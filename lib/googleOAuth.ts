import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { parse as parseCookie, serialize } from 'cookie';
import jwt from 'jsonwebtoken';
import { GOOGLE_SCOPE_PARAM } from './googleIdToken';
import { getJwtSecret } from './users';

export const GOOGLE_OAUTH_COOKIE = 'bizkit_google_oauth';
export const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/**
 * Android returns here from the system browser. One web OAuth client is enough:
 * Google redirects to the web callback, and this app scheme is only our own bounce.
 */
export const GOOGLE_MOBILE_CALLBACK = 'pitchcrafter://auth/google';

const OAUTH_MAX_AGE_SECONDS = 600;

export type GoogleOAuthClient = 'web' | 'mobile';
export type GoogleOAuthReturn = 'home' | 'account-delete';

export type GoogleOAuthState = {
  state: string;
  verifier: string;
  nonce: string;
  client: GoogleOAuthClient;
  returnTo: GoogleOAuthReturn;
  /** S256 challenge from the Android app. Null for the web flow. */
  mobileChallenge: string | null;
};

/** S256 PKCE challenge: 32 bytes, base64url, no padding. */
export function mobileCodeChallenge(value: string): string | null {
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9_-]{43}$/.test(trimmed)) return null;
  return trimmed;
}

/** RFC 7636 code verifier, or the one-time mobile code (same unreserved alphabet, no dot or tilde). */
export function mobileAuthCode(value: string): string | null {
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(trimmed)) return null;
  return trimmed;
}

export function mobilePkceVerifier(value: string): string | null {
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(trimmed)) return null;
  return trimmed;
}

export function googleClientId(): string | null {
  const value = (process.env.GOOGLE_CLIENT_ID || '').trim();
  return value || null;
}

export function googleClientSecret(): string | null {
  const value = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  return value || null;
}

/** Public redirect URI registered on the Web application client. */
export function googleRedirectUri(): string | null {
  const raw = (process.env.APP_BASE_URL || '').trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.pathname !== '/' && url.pathname !== '') return null;
  if (url.search || url.hash) return null;
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') return null;
  return `${url.origin}/api/auth/google/callback`;
}

/** Both client values and a usable redirect URI are required. Otherwise the feature stays off. */
export function googleAuthConfigured(): boolean {
  return Boolean(googleClientId() && googleClientSecret() && googleRedirectUri());
}

export function createPkceVerifier(): string {
  return randomBytes(32).toString('base64url');
}

export function pkceChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function createGoogleOAuthSecrets(): { state: string; verifier: string; nonce: string } {
  return {
    state: randomBytes(32).toString('base64url'),
    verifier: createPkceVerifier(),
    nonce: randomBytes(32).toString('base64url'),
  };
}

export function signGoogleOAuthState(payload: GoogleOAuthState): string {
  return jwt.sign(
    { ...payload, typ: 'google-oauth-state' },
    getJwtSecret(),
    { expiresIn: OAUTH_MAX_AGE_SECONDS },
  );
}

export function readGoogleOAuthState(token: string): GoogleOAuthState | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as Record<string, unknown>;
    if (decoded.typ !== 'google-oauth-state') return null;
    if (decoded.client !== 'web' && decoded.client !== 'mobile') return null;
    if (
      typeof decoded.state !== 'string' ||
      typeof decoded.verifier !== 'string' ||
      typeof decoded.nonce !== 'string' ||
      decoded.state.length < 16 ||
      decoded.verifier.length < 43
    ) {
      return null;
    }
    const returnTo: GoogleOAuthReturn = decoded.returnTo === 'account-delete' ? 'account-delete' : 'home';
    let mobileChallenge: string | null = null;
    if (decoded.client === 'mobile') {
      if (typeof decoded.mobileChallenge !== 'string') return null;
      mobileChallenge = mobileCodeChallenge(decoded.mobileChallenge);
      if (!mobileChallenge) return null;
    }
    return {
      state: decoded.state,
      verifier: decoded.verifier,
      nonce: decoded.nonce,
      client: decoded.client,
      returnTo: decoded.client === 'mobile' ? 'home' : returnTo,
      mobileChallenge,
    };
  } catch {
    return null;
  }
}

export function googleOAuthCookie(value: string, maxAge = OAUTH_MAX_AGE_SECONDS): string {
  return serialize(GOOGLE_OAUTH_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/api/auth/google',
  });
}

export function readOAuthCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const cookies = parseCookie(cookieHeader);
  const value = cookies[GOOGLE_OAUTH_COOKIE];
  return value || null;
}

export function safeEqualString(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function buildGoogleAuthorizeUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string;
}): string {
  const url = new URL(GOOGLE_AUTHORIZE_URL);
  url.searchParams.set('client_id', input.clientId);
  url.searchParams.set('redirect_uri', input.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_SCOPE_PARAM);
  url.searchParams.set('state', input.state);
  url.searchParams.set('nonce', input.nonce);
  url.searchParams.set('code_challenge', input.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('include_granted_scopes', 'false');
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

const PUBLIC_GOOGLE_ERRORS = new Set([
  'access_denied',
  'email_not_verified',
  'signup_blocked',
  'identity_conflict',
  'invalid_state',
  'exchange_failed',
  'token_invalid',
]);

export function publicGoogleError(error: string): string {
  return PUBLIC_GOOGLE_ERRORS.has(error) ? error : 'google_sign_in_failed';
}

export function googleFinishLocation(
  flow: { client: GoogleOAuthClient; returnTo: GoogleOAuthReturn },
  result: { ok: true; created: boolean; mobileCode?: string } | { ok: false; error: string },
): string {
  if (flow.client === 'mobile') {
    const url = new URL(GOOGLE_MOBILE_CALLBACK);
    const mobileCode = result.ok ? mobileAuthCode(result.mobileCode ?? '') : null;
    if (result.ok && mobileCode) {
      url.searchParams.set('code', mobileCode);
      if (result.created) url.searchParams.set('created', '1');
    } else {
      url.searchParams.set('error', publicGoogleError(result.ok ? 'exchange_failed' : result.error));
    }
    return url.toString();
  }
  const path = flow.returnTo === 'account-delete' ? '/account/delete' : '/';
  if (result.ok) return path;
  const params = new URLSearchParams({ google_error: publicGoogleError(result.error) });
  return `${path}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  input: {
    code: string;
    redirectUri: string;
    codeVerifier: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<{ idToken: string } | { error: 'exchange_failed' }> {
  const clientId = googleClientId();
  const clientSecret = googleClientSecret();
  if (!clientId || !clientSecret) return { error: 'exchange_failed' };
  const body = new URLSearchParams({
    code: input.code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: input.redirectUri,
    grant_type: 'authorization_code',
    code_verifier: input.codeVerifier,
  });
  try {
    const response = await fetchImpl(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
      redirect: 'error',
    });
    const payload = (await response.json()) as { id_token?: unknown };
    if (!response.ok || typeof payload.id_token !== 'string' || payload.id_token.length === 0) {
      return { error: 'exchange_failed' };
    }
    return { idToken: payload.id_token };
  } catch {
    return { error: 'exchange_failed' };
  }
}
