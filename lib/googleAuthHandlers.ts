import type { NextApiRequest, NextApiResponse } from 'next';
import { sessionCookie } from './authResponse';
import { signInWithGoogleProfile, type GoogleSignInResult } from './googleAccount';
import { verifyGoogleIdTokenForClient, type GoogleIdTokenResult } from './googleIdToken';
import {
  buildGoogleAuthorizeUrl,
  createGoogleOAuthSecrets,
  exchangeGoogleCode,
  googleAuthConfigured,
  googleClientId,
  googleFinishLocation,
  googleOAuthCookie,
  googleRedirectUri,
  pkceChallenge,
  readGoogleOAuthState,
  readOAuthCookie,
  safeEqualString,
  signGoogleOAuthState,
  type GoogleOAuthReturn,
  type GoogleOAuthState,
} from './googleOAuth';

type ExchangeResult = { idToken: string } | { error: 'exchange_failed' };

export type GoogleAuthDeps = {
  exchangeCode: (input: {
    code: string;
    redirectUri: string;
    codeVerifier: string;
  }) => Promise<ExchangeResult>;
  verifyIdToken: (idToken: string, nonce: string) => Promise<GoogleIdTokenResult>;
  signIn: typeof signInWithGoogleProfile;
};

const defaultDeps: GoogleAuthDeps = {
  exchangeCode: (input) => exchangeGoogleCode(input),
  verifyIdToken: (idToken, nonce) => verifyGoogleIdTokenForClient(idToken, nonce),
  signIn: signInWithGoogleProfile,
};

function queryValue(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' ? raw : '';
}

function finish(
  res: NextApiResponse,
  flow: { client: GoogleOAuthState['client']; returnTo: GoogleOAuthReturn },
  result: { ok: true; token: string; created: boolean } | { ok: false; error: string },
  sessionToken?: string,
) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const cookies = [googleOAuthCookie('', 0)];
  if (sessionToken) cookies.push(sessionCookie(sessionToken));
  res.setHeader('Set-Cookie', cookies);
  res.redirect(302, googleFinishLocation(flow, result));
}

export async function handleGoogleStart(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');
  if (!googleAuthConfigured()) {
    return res.status(404).json({ ok: false, error: 'google_auth_disabled' });
  }
  const redirectUri = googleRedirectUri();
  const clientId = googleClientId();
  if (!redirectUri || !clientId) {
    return res.status(404).json({ ok: false, error: 'google_auth_disabled' });
  }

  const client = queryValue(req.query.client) === 'mobile' ? 'mobile' : 'web';
  const returnTo: GoogleOAuthReturn =
    client === 'web' && queryValue(req.query.return_to) === 'account-delete' ? 'account-delete' : 'home';
  const secrets = createGoogleOAuthSecrets();
  let signed: string;
  try {
    signed = signGoogleOAuthState({ ...secrets, client, returnTo });
  } catch {
    return res.status(503).json({ ok: false, error: 'google_auth_disabled' });
  }

  res.setHeader('Set-Cookie', googleOAuthCookie(signed));
  const location = buildGoogleAuthorizeUrl({
    clientId,
    redirectUri,
    state: secrets.state,
    nonce: secrets.nonce,
    codeChallenge: pkceChallenge(secrets.verifier),
  });
  res.redirect(302, location);
}

export async function handleGoogleCallback(
  req: NextApiRequest,
  res: NextApiResponse,
  deps: GoogleAuthDeps = defaultDeps,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  if (!googleAuthConfigured()) {
    return res.status(404).json({ ok: false, error: 'google_auth_disabled' });
  }

  const cookieHeader = typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined;
  const flow = readGoogleOAuthState(readOAuthCookie(cookieHeader) ?? '') ?? {
    client: 'web' as const,
    returnTo: 'home' as const,
    state: '',
    verifier: '',
    nonce: '',
  };
  const signedFlow = flow.state ? flow : null;

  const googleError = queryValue(req.query.error);
  if (googleError) {
    return finish(res, flow, {
      ok: false,
      error: googleError === 'access_denied' ? 'access_denied' : 'google_sign_in_failed',
    });
  }
  if (!signedFlow) {
    return finish(res, flow, { ok: false, error: 'invalid_state' });
  }

  const stateParam = queryValue(req.query.state);
  if (!safeEqualString(stateParam, signedFlow.state)) {
    return finish(res, signedFlow, { ok: false, error: 'invalid_state' });
  }

  const code = queryValue(req.query.code);
  const redirectUri = googleRedirectUri();
  if (!code || !redirectUri) {
    return finish(res, signedFlow, { ok: false, error: 'exchange_failed' });
  }

  const exchanged = await deps.exchangeCode({
    code,
    redirectUri,
    codeVerifier: signedFlow.verifier,
  });
  if ('error' in exchanged) {
    return finish(res, signedFlow, { ok: false, error: 'exchange_failed' });
  }

  let verified: GoogleIdTokenResult;
  try {
    verified = await deps.verifyIdToken(exchanged.idToken, signedFlow.nonce);
  } catch {
    return finish(res, signedFlow, { ok: false, error: 'token_invalid' });
  }
  if (!verified.ok) {
    return finish(res, signedFlow, {
      ok: false,
      error: verified.error === 'email_not_verified' ? 'email_not_verified' : 'token_invalid',
    });
  }

  let signedIn: GoogleSignInResult;
  try {
    signedIn = await deps.signIn(verified.identity);
  } catch {
    return finish(res, signedFlow, { ok: false, error: 'google_sign_in_failed' });
  }
  if ('error' in signedIn) {
    return finish(res, signedFlow, { ok: false, error: signedIn.error });
  }

  return finish(
    res,
    signedFlow,
    { ok: true, token: signedIn.token, created: signedIn.created },
    signedIn.token,
  );
}
