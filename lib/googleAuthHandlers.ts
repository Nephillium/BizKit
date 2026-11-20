import type { NextApiRequest, NextApiResponse } from 'next';
import { clientRequestsSessionToken, sessionCookie } from './authResponse';
import { signInWithGoogleProfile, type GoogleSignInResult } from './googleAccount';
import { verifyGoogleIdTokenForClient, type GoogleIdTokenResult } from './googleIdToken';
import { createMobileAuthCode, redeemMobileAuthCode, saveMobileAuthCode, type RedeemMobileCodeResult } from './googleMobileCode';
import {
  buildGoogleAuthorizeUrl,
  createGoogleOAuthSecrets,
  exchangeGoogleCode,
  googleAuthConfigured,
  googleClientId,
  googleFinishLocation,
  googleOAuthCookie,
  googleRedirectUri,
  mobileCodeChallenge,
  pkceChallenge,
  readGoogleOAuthState,
  readOAuthCookie,
  safeEqualString,
  signGoogleOAuthState,
  type GoogleOAuthReturn,
  type GoogleOAuthState,
} from './googleOAuth';
import { findUserById, generateToken, roleAfterAuthentication, type User } from './users';

type ExchangeResult = { idToken: string } | { error: 'exchange_failed' };

export type GoogleAuthDeps = {
  exchangeCode: (input: {
    code: string;
    redirectUri: string;
    codeVerifier: string;
  }) => Promise<ExchangeResult>;
  verifyIdToken: (idToken: string, nonce: string) => Promise<GoogleIdTokenResult>;
  signIn: typeof signInWithGoogleProfile;
  issueMobileCode: (input: { codeChallenge: string; userId: string; created: boolean }) => Promise<string>;
};

async function issueMobileCode(input: { codeChallenge: string; userId: string; created: boolean }): Promise<string> {
  const code = createMobileAuthCode();
  await saveMobileAuthCode({
    code,
    codeChallenge: input.codeChallenge,
    userId: input.userId,
    created: input.created,
  });
  return code;
}

const defaultDeps: GoogleAuthDeps = {
  exchangeCode: (input) => exchangeGoogleCode(input),
  verifyIdToken: (idToken, nonce) => verifyGoogleIdTokenForClient(idToken, nonce),
  signIn: signInWithGoogleProfile,
  issueMobileCode,
};

function queryValue(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' ? raw : '';
}

function finish(
  res: NextApiResponse,
  flow: { client: GoogleOAuthState['client']; returnTo: GoogleOAuthReturn },
  result: { ok: true; created: boolean; mobileCode?: string } | { ok: false; error: string },
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
  const mobileChallenge = client === 'mobile' ? mobileCodeChallenge(queryValue(req.query.code_challenge)) : null;
  if (client === 'mobile' && !mobileChallenge) {
    return res.status(400).json({ ok: false, error: 'invalid_code_challenge' });
  }
  const secrets = createGoogleOAuthSecrets();
  let signed: string;
  try {
    signed = signGoogleOAuthState({ ...secrets, client, returnTo, mobileChallenge });
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
    mobileChallenge: null,
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

  if (signedFlow.client === 'mobile') {
    if (!signedFlow.mobileChallenge) {
      return finish(res, signedFlow, { ok: false, error: 'exchange_failed' });
    }
    let mobileCode: string;
    try {
      mobileCode = await deps.issueMobileCode({
        codeChallenge: signedFlow.mobileChallenge,
        userId: signedIn.user.id,
        created: signedIn.created,
      });
    } catch {
      return finish(res, signedFlow, { ok: false, error: 'exchange_failed' });
    }
    return finish(
      res,
      signedFlow,
      { ok: true, created: signedIn.created, mobileCode },
      signedIn.token,
    );
  }

  return finish(res, signedFlow, { ok: true, created: signedIn.created }, signedIn.token);
}

function exchangeBody(req: NextApiRequest): { code?: unknown; code_verifier?: unknown } {
  if (!req.body || typeof req.body !== 'object') return {};
  return req.body as { code?: unknown; code_verifier?: unknown };
}

export type GoogleMobileExchangeDeps = {
  redeem: typeof redeemMobileAuthCode;
  findUser: typeof findUserById;
  generateToken: typeof generateToken;
};

const defaultExchangeDeps: GoogleMobileExchangeDeps = {
  redeem: redeemMobileAuthCode,
  findUser: findUserById,
  generateToken,
};

function publicUser(user: User, role: User['role']) {
  return {
    id: user.id,
    email: user.email,
    role,
    credits: user.credits,
    usage_count: user.usage_count,
    created_at: user.created_at,
  };
}

/** Trade a one-time mobile code and the app's PKCE verifier for the session token. */
export async function handleGoogleMobileExchange(
  req: NextApiRequest,
  res: NextApiResponse,
  deps: GoogleMobileExchangeDeps = defaultExchangeDeps,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');
  if (!googleAuthConfigured()) {
    return res.status(404).json({ ok: false, error: 'google_auth_disabled' });
  }
  if (!clientRequestsSessionToken(req.headers)) {
    return res.status(400).json({ ok: false, error: 'mobile_client_required' });
  }
  const body = exchangeBody(req);
  const code = typeof body.code === 'string' ? body.code : '';
  const verifier = typeof body.code_verifier === 'string' ? body.code_verifier : '';
  if (!code || !verifier) {
    return res.status(400).json({ ok: false, error: 'invalid_code' });
  }

  let redeemed: RedeemMobileCodeResult;
  try {
    redeemed = await deps.redeem({ code, verifier });
  } catch {
    return res.status(500).json({ ok: false, error: 'exchange_failed' });
  }
  if (!redeemed.ok) {
    return res.status(401).json({ ok: false, error: redeemed.error });
  }

  const user = await deps.findUser(redeemed.userId);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'invalid_code' });
  }
  const role = roleAfterAuthentication(user.role, user.email);
  const token = deps.generateToken({ id: user.id, email: user.email, role });
  res.setHeader('Set-Cookie', sessionCookie(token));
  return res.status(200).json({
    ok: true,
    token,
    created: redeemed.created,
    user: publicUser(user, role),
  });
}
