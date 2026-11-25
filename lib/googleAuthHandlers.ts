import type { NextApiRequest, NextApiResponse } from 'next';
import { allowAuthAttempt, clientAddressFromRequest } from './authRateLimit';
import { clientRequestsSessionToken, sessionCookie } from './authResponse';
import { signInWithGoogleProfile, type GoogleSignInResult } from './googleAccount';
import {
  describeIdToken,
  emptyGoogleAuthLog,
  noteGoogleAuthResult,
  noteGoogleAuthThrow,
  verifyReason,
  writeGoogleAuthLog,
} from './googleAuthLog';
import { verifyGoogleIdTokenForClient, verifyGoogleNativeIdToken, type GoogleIdTokenResult } from './googleIdToken';
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
  const log = emptyGoogleAuthLog('GET /api/auth/google/start');
  try {
    if (req.method !== 'GET') {
      noteGoogleAuthResult(log, 405, 'method_not_allowed');
      return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }
    res.setHeader('Cache-Control', 'no-store');
    if (!googleAuthConfigured()) {
      noteGoogleAuthResult(log, 404, 'google_auth_disabled');
      return res.status(404).json({ ok: false, error: 'google_auth_disabled' });
    }
    const redirectUri = googleRedirectUri();
    const clientId = googleClientId();
    if (!redirectUri || !clientId) {
      noteGoogleAuthResult(log, 404, 'google_auth_disabled');
      return res.status(404).json({ ok: false, error: 'google_auth_disabled' });
    }

    const client = queryValue(req.query.client) === 'mobile' ? 'mobile' : 'web';
    const returnTo: GoogleOAuthReturn =
      client === 'web' && queryValue(req.query.return_to) === 'account-delete' ? 'account-delete' : 'home';
    const mobileChallenge = client === 'mobile' ? mobileCodeChallenge(queryValue(req.query.code_challenge)) : null;
    if (client === 'mobile' && !mobileChallenge) {
      noteGoogleAuthResult(log, 400, 'invalid_code_challenge');
      return res.status(400).json({ ok: false, error: 'invalid_code_challenge' });
    }
    const secrets = createGoogleOAuthSecrets();
    let signed: string;
    try {
      signed = signGoogleOAuthState({ ...secrets, client, returnTo, mobileChallenge });
    } catch (error) {
      noteGoogleAuthThrow(log, 503, 'google_auth_disabled', error);
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
    noteGoogleAuthResult(log, 302, null);
    res.redirect(302, location);
  } finally {
    writeGoogleAuthLog(log);
  }
}

export async function handleGoogleCallback(
  req: NextApiRequest,
  res: NextApiResponse,
  deps: GoogleAuthDeps = defaultDeps,
) {
  const log = emptyGoogleAuthLog('GET /api/auth/google/callback');
  try {
  if (req.method !== 'GET') {
    noteGoogleAuthResult(log, 405, 'method_not_allowed');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  if (!googleAuthConfigured()) {
    noteGoogleAuthResult(log, 404, 'google_auth_disabled');
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
    const error = googleError === 'access_denied' ? 'access_denied' : 'google_sign_in_failed';
    noteGoogleAuthResult(log, 302, error);
    return finish(res, flow, { ok: false, error });
  }
  if (!signedFlow) {
    noteGoogleAuthResult(log, 302, 'invalid_state');
    return finish(res, flow, { ok: false, error: 'invalid_state' });
  }

  const stateParam = queryValue(req.query.state);
  if (!safeEqualString(stateParam, signedFlow.state)) {
    noteGoogleAuthResult(log, 302, 'invalid_state');
    return finish(res, signedFlow, { ok: false, error: 'invalid_state' });
  }

  const code = queryValue(req.query.code);
  const redirectUri = googleRedirectUri();
  if (!code || !redirectUri) {
    noteGoogleAuthResult(log, 302, 'exchange_failed');
    return finish(res, signedFlow, { ok: false, error: 'exchange_failed' });
  }

  const exchanged = await deps.exchangeCode({
    code,
    redirectUri,
    codeVerifier: signedFlow.verifier,
  });
  if ('error' in exchanged) {
    noteGoogleAuthResult(log, 302, 'exchange_failed');
    return finish(res, signedFlow, { ok: false, error: 'exchange_failed' });
  }
  Object.assign(log, describeIdToken(exchanged.idToken, googleClientId() || ''));

  let verified: GoogleIdTokenResult;
  try {
    verified = await deps.verifyIdToken(exchanged.idToken, signedFlow.nonce);
  } catch (error) {
    noteGoogleAuthThrow(log, 302, 'token_invalid', error);
    log.verify = 'sig';
    return finish(res, signedFlow, { ok: false, error: 'token_invalid' });
  }
  if (!verified.ok) {
    const error = verified.error === 'email_not_verified' ? 'email_not_verified' : 'token_invalid';
    noteGoogleAuthResult(log, 302, error);
    log.verify = verifyReason(verified.error);
    return finish(res, signedFlow, { ok: false, error });
  }

  let signedIn: GoogleSignInResult;
  try {
    signedIn = await deps.signIn(verified.identity);
  } catch (error) {
    noteGoogleAuthThrow(log, 302, 'google_sign_in_failed', error);
    return finish(res, signedFlow, { ok: false, error: 'google_sign_in_failed' });
  }
  if ('error' in signedIn) {
    noteGoogleAuthResult(log, 302, signedIn.error);
    return finish(res, signedFlow, { ok: false, error: signedIn.error });
  }

  if (signedFlow.client === 'mobile') {
    if (!signedFlow.mobileChallenge) {
      noteGoogleAuthResult(log, 302, 'exchange_failed');
      return finish(res, signedFlow, { ok: false, error: 'exchange_failed' });
    }
    let mobileCode: string;
    try {
      mobileCode = await deps.issueMobileCode({
        codeChallenge: signedFlow.mobileChallenge,
        userId: signedIn.user.id,
        created: signedIn.created,
      });
    } catch (error) {
      noteGoogleAuthThrow(log, 302, 'exchange_failed', error);
      return finish(res, signedFlow, { ok: false, error: 'exchange_failed' });
    }
    noteGoogleAuthResult(log, 302, null);
    return finish(
      res,
      signedFlow,
      { ok: true, created: signedIn.created, mobileCode },
      signedIn.token,
    );
  }

  noteGoogleAuthResult(log, 302, null);
  return finish(res, signedFlow, { ok: true, created: signedIn.created }, signedIn.token);
  } finally {
    writeGoogleAuthLog(log);
  }
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
  const log = emptyGoogleAuthLog('POST /api/auth/google/exchange');
  try {
    if (req.method !== 'POST') {
      noteGoogleAuthResult(log, 405, 'method_not_allowed');
      return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }
    res.setHeader('Cache-Control', 'no-store');
    if (!googleAuthConfigured()) {
      noteGoogleAuthResult(log, 404, 'google_auth_disabled');
      return res.status(404).json({ ok: false, error: 'google_auth_disabled' });
    }
    if (!clientRequestsSessionToken(req.headers)) {
      noteGoogleAuthResult(log, 400, 'mobile_client_required');
      return res.status(400).json({ ok: false, error: 'mobile_client_required' });
    }
    const body = exchangeBody(req);
    const code = typeof body.code === 'string' ? body.code : '';
    const verifier = typeof body.code_verifier === 'string' ? body.code_verifier : '';
    if (!code || !verifier) {
      noteGoogleAuthResult(log, 400, 'invalid_code');
      return res.status(400).json({ ok: false, error: 'invalid_code' });
    }

    let redeemed: RedeemMobileCodeResult;
    try {
      redeemed = await deps.redeem({ code, verifier });
    } catch (error) {
      noteGoogleAuthThrow(log, 500, 'exchange_failed', error);
      return res.status(500).json({ ok: false, error: 'exchange_failed' });
    }
    if (!redeemed.ok) {
      noteGoogleAuthResult(log, 401, redeemed.error);
      return res.status(401).json({ ok: false, error: redeemed.error });
    }

    const user = await deps.findUser(redeemed.userId);
    if (!user) {
      noteGoogleAuthResult(log, 401, 'invalid_code');
      return res.status(401).json({ ok: false, error: 'invalid_code' });
    }
    const role = roleAfterAuthentication(user.role, user.email);
    const token = deps.generateToken({ id: user.id, email: user.email, role });
    res.setHeader('Set-Cookie', sessionCookie(token));
    noteGoogleAuthResult(log, 200, null);
    return res.status(200).json({
      ok: true,
      token,
      created: redeemed.created,
      user: publicUser(user, role),
    });
  } finally {
    writeGoogleAuthLog(log);
  }
}

export const GOOGLE_NATIVE_RATE_ROUTE = 'google-native';

export type GoogleNativeDeps = {
  verifyIdToken: (idToken: string) => Promise<GoogleIdTokenResult>;
  signIn: typeof signInWithGoogleProfile;
};

const defaultNativeDeps: GoogleNativeDeps = {
  verifyIdToken: (idToken) => verifyGoogleNativeIdToken(idToken),
  signIn: signInWithGoogleProfile,
};

function nativeIdToken(req: NextApiRequest): string {
  if (!req.body || typeof req.body !== 'object') return '';
  const value = (req.body as { id_token?: unknown }).id_token;
  return typeof value === 'string' ? value.trim() : '';
}

function nativeFailureStatus(error: string): number {
  if (error === 'signup_blocked') return 403;
  if (error === 'identity_conflict') return 409;
  return 401;
}

/**
 * Trade a Google ID token from the Android account picker for the same
 * bearer session the browser code exchange returns.
 * The token is verified and then discarded. It is not logged or stored.
 */
export async function handleGoogleNative(
  req: NextApiRequest,
  res: NextApiResponse,
  deps: GoogleNativeDeps = defaultNativeDeps,
) {
  const log = emptyGoogleAuthLog('POST /api/auth/google/native');
  try {
    if (req.method !== 'POST') {
      noteGoogleAuthResult(log, 405, 'method_not_allowed');
      return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }
    res.setHeader('Cache-Control', 'no-store');
    const idToken = nativeIdToken(req);
    Object.assign(log, describeIdToken(idToken, googleClientId() || ''));
    if (!allowAuthAttempt(GOOGLE_NATIVE_RATE_ROUTE, clientAddressFromRequest(req))) {
      res.setHeader('Retry-After', '60');
      noteGoogleAuthResult(log, 429, 'rate_limited');
      return res.status(429).json({ ok: false, error: 'rate_limited' });
    }
    if (!googleAuthConfigured()) {
      noteGoogleAuthResult(log, 404, 'google_auth_disabled');
      return res.status(404).json({ ok: false, error: 'google_auth_disabled' });
    }
    if (!clientRequestsSessionToken(req.headers)) {
      noteGoogleAuthResult(log, 400, 'mobile_client_required');
      return res.status(400).json({ ok: false, error: 'mobile_client_required' });
    }
    if (!idToken) {
      noteGoogleAuthResult(log, 400, 'invalid_token');
      return res.status(400).json({ ok: false, error: 'invalid_token' });
    }

    let verified: GoogleIdTokenResult;
    try {
      verified = await deps.verifyIdToken(idToken);
    } catch (error) {
      noteGoogleAuthThrow(log, 401, 'token_invalid', error);
      return res.status(401).json({ ok: false, error: 'token_invalid' });
    }
    if (!verified.ok) {
      const error = verified.error === 'bad_audience'
        || verified.error === 'expired'
        || verified.error === 'email_not_verified'
        ? verified.error
        : 'token_invalid';
      noteGoogleAuthResult(log, 401, error);
      log.verify = verifyReason(verified.error);
      return res.status(401).json({ ok: false, error });
    }

    let signedIn: GoogleSignInResult;
    try {
      signedIn = await deps.signIn(verified.identity);
    } catch (error) {
      noteGoogleAuthThrow(log, 500, 'google_sign_in_failed', error);
      return res.status(500).json({ ok: false, error: 'google_sign_in_failed' });
    }
    if ('error' in signedIn) {
      const status = nativeFailureStatus(signedIn.error);
      noteGoogleAuthResult(log, status, signedIn.error);
      return res.status(status).json({ ok: false, error: signedIn.error });
    }

    res.setHeader('Set-Cookie', sessionCookie(signedIn.token));
    noteGoogleAuthResult(log, 200, null);
    return res.status(200).json({
      ok: true,
      token: signedIn.token,
      created: signedIn.created,
      user: signedIn.user,
    });
  } finally {
    writeGoogleAuthLog(log);
  }
}
