import { createPublicKey, createVerify, timingSafeEqual } from 'node:crypto';

/** OpenID Connect issuers Google documents for ID tokens. */
export const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'] as const;

/** The only scopes this app requests. */
export const GOOGLE_SCOPE_PARAM = 'openid email profile';

export const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

const CLOCK_SKEW_SECONDS = 60;

export type GoogleIdentity = {
  sub: string;
  email: string;
  emailVerified: true;
  name: string | null;
};

export type GoogleJwk = {
  kid?: string;
  kty?: string;
  n?: string;
  e?: string;
  alg?: string;
  use?: string;
};

export type GoogleIdTokenResult =
  | { ok: true; identity: GoogleIdentity }
  | { ok: false; error: string };

type TokenClaims = Record<string, unknown>;

/**
 * Display name from the `name` claim only.
 * The profile photo (`picture`) is not returned and is not stored.
 */
export function googleDisplayName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  return trimmed.slice(0, 200);
}

function decodeBase64Url(segment: string): Buffer {
  if (!/^[A-Za-z0-9_-]+$/.test(segment)) {
    throw new Error('invalid_encoding');
  }
  const pad = segment.length % 4 === 0 ? '' : '='.repeat(4 - (segment.length % 4));
  return Buffer.from(segment.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 320) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function emailIsVerified(value: unknown): boolean {
  return value === true || value === 'true';
}

function audienceAccepted(
  claims: TokenClaims,
  clientId: string,
  allowDifferentAuthorizedParty = false,
): boolean {
  const aud = claims.aud;
  const azp = claims.azp;
  if (allowDifferentAuthorizedParty) {
    const audOk = typeof aud === 'string'
      ? aud === clientId
      : Array.isArray(aud) && aud.some((item) => item === clientId);
    if (!audOk) return false;
    // Android Sign-In sets `aud` to the Web client and `azp` to the Android client.
    if (azp === undefined) return true;
    return typeof azp === 'string' && azp.length > 0 && azp.length <= 512;
  }
  if (typeof aud === 'string') {
    if (aud !== clientId) return false;
    return azp === undefined || azp === clientId;
  }
  if (!Array.isArray(aud) || !aud.some((item) => item === clientId)) return false;
  return azp === clientId;
}

/**
 * Verify a Google OpenID Connect ID token.
 * Checks the RS256 signature, `aud`, `iss`, `exp`, and `email_verified`.
 * Callers pass Google's JWKS. This function does not fetch them.
 */
export function verifyGoogleIdToken(
  token: string,
  options: {
    clientId: string;
    keys: readonly GoogleJwk[];
    nonce?: string;
    now?: number;
    /**
     * Native Android ID tokens use the Web client as `aud` and the Android
     * client as `azp`. The browser flow keeps the stricter check.
     */
    allowDifferentAuthorizedParty?: boolean;
  },
): GoogleIdTokenResult {
  if (typeof token !== 'string' || token.length < 20 || token.length > 8192) {
    return { ok: false, error: 'malformed' };
  }
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, error: 'malformed' };
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  if (!encodedHeader || !encodedPayload) return { ok: false, error: 'malformed' };

  let header: TokenClaims;
  try {
    const parsed = JSON.parse(decodeBase64Url(encodedHeader).toString('utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, error: 'malformed' };
    }
    header = parsed as TokenClaims;
  } catch {
    return { ok: false, error: 'malformed' };
  }

  if (header.alg !== 'RS256' || header.crit !== undefined) {
    return { ok: false, error: 'unsupported_alg' };
  }
  if (!encodedSignature) return { ok: false, error: 'invalid_signature' };
  if (typeof header.kid !== 'string' || header.kid.length === 0) {
    return { ok: false, error: 'unknown_kid' };
  }

  const jwk = options.keys.find(
    (key) => key.kid === header.kid && key.kty === 'RSA' && typeof key.n === 'string' && typeof key.e === 'string',
  );
  if (!jwk || !jwk.n || !jwk.e) return { ok: false, error: 'unknown_kid' };

  try {
    const key = createPublicKey({ key: { kty: 'RSA', n: jwk.n, e: jwk.e }, format: 'jwk' });
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${encodedHeader}.${encodedPayload}`);
    verifier.end();
    const valid = verifier.verify(key, decodeBase64Url(encodedSignature));
    if (!valid) return { ok: false, error: 'invalid_signature' };
  } catch {
    return { ok: false, error: 'invalid_signature' };
  }

  let claims: TokenClaims;
  try {
    const parsed = JSON.parse(decodeBase64Url(encodedPayload).toString('utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, error: 'invalid_claims' };
    }
    claims = parsed as TokenClaims;
  } catch {
    return { ok: false, error: 'invalid_claims' };
  }

  const now = options.now ?? Math.floor(Date.now() / 1000);
  if (typeof claims.iss !== 'string' || !GOOGLE_ISSUERS.includes(claims.iss as (typeof GOOGLE_ISSUERS)[number])) {
    return { ok: false, error: 'bad_issuer' };
  }
  if (!options.clientId || !audienceAccepted(claims, options.clientId, options.allowDifferentAuthorizedParty === true)) {
    return { ok: false, error: 'bad_audience' };
  }
  if (typeof claims.exp !== 'number' || !Number.isFinite(claims.exp) || now > claims.exp + CLOCK_SKEW_SECONDS) {
    return { ok: false, error: 'expired' };
  }
  if (typeof claims.iat === 'number' && claims.iat > now + CLOCK_SKEW_SECONDS) {
    return { ok: false, error: 'invalid_claims' };
  }
  if (typeof claims.nbf === 'number' && now + CLOCK_SKEW_SECONDS < claims.nbf) {
    return { ok: false, error: 'invalid_claims' };
  }
  if (options.nonce !== undefined && (typeof claims.nonce !== 'string' || !safeEqual(claims.nonce, options.nonce))) {
    return { ok: false, error: 'bad_nonce' };
  }
  if (typeof claims.sub !== 'string' || claims.sub.trim().length === 0 || claims.sub.length > 255) {
    return { ok: false, error: 'missing_subject' };
  }
  const email = normalizeEmail(claims.email);
  if (!email) return { ok: false, error: 'missing_email' };
  if (!emailIsVerified(claims.email_verified)) {
    return { ok: false, error: 'email_not_verified' };
  }

  return {
    ok: true,
    identity: {
      sub: claims.sub.trim(),
      email,
      emailVerified: true,
      name: googleDisplayName(claims.name),
    },
  };
}

type JwksCache = { keys: GoogleJwk[]; expiresAt: number };
let jwksCache: JwksCache | null = null;

/** Unknown key ids may refresh Google's certificates at most this often. */
export const GOOGLE_JWKS_UNKNOWN_KID_REFRESH_MS = 60_000;

let lastUnknownKidRefreshMs = Number.NEGATIVE_INFINITY;

export function clearGoogleJwksCache(): void {
  jwksCache = null;
  lastUnknownKidRefreshMs = Number.NEGATIVE_INFINITY;
}

/**
 * One certificate refetch per minute when a token names a key id we do not
 * have yet. Returns false when the last refetch is still inside the window,
 * so a stream of unknown kids cannot fetch Google on every request.
 * A true result drops the cached certificates before the caller fetches again.
 */
function takeUnknownKidRefresh(nowMs: number): boolean {
  if (nowMs - lastUnknownKidRefreshMs < GOOGLE_JWKS_UNKNOWN_KID_REFRESH_MS) return false;
  lastUnknownKidRefreshMs = nowMs;
  jwksCache = null;
  return true;
}

export async function fetchGoogleJwks(
  fetchImpl: typeof fetch,
  now = Date.now(),
): Promise<GoogleJwk[]> {
  if (jwksCache && jwksCache.expiresAt > now) return jwksCache.keys;
  const response = await fetchImpl(GOOGLE_JWKS_URL, {
    headers: { accept: 'application/json' },
    redirect: 'error',
  });
  if (!response.ok) throw new Error('jwks_fetch_failed');
  const payload = (await response.json()) as { keys?: GoogleJwk[] };
  if (!payload || !Array.isArray(payload.keys)) throw new Error('jwks_fetch_failed');
  jwksCache = { keys: payload.keys, expiresAt: now + 60 * 60 * 1000 };
  return payload.keys;
}

/** Fetch Google's certificates and verify an ID token for this server's client id. */
export async function verifyGoogleIdTokenForClient(
  idToken: string,
  nonce: string,
  fetchImpl: typeof fetch = fetch,
  refreshNow = Date.now(),
): Promise<GoogleIdTokenResult> {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  if (!clientId) return { ok: false, error: 'bad_audience' };
  let keys = await fetchGoogleJwks(fetchImpl);
  let result = verifyGoogleIdToken(idToken, { clientId, keys, nonce });
  if (!result.ok && result.error === 'unknown_kid' && takeUnknownKidRefresh(refreshNow)) {
    keys = await fetchGoogleJwks(fetchImpl);
    result = verifyGoogleIdToken(idToken, { clientId, keys, nonce });
  }
  return result;
}

/**
 * Verify an ID token from the Android account picker.
 * There is no server nonce. `aud` must be this server's Web client id.
 * `azp` may be the Android OAuth client in the same Google Cloud project.
 */
export async function verifyGoogleNativeIdToken(
  idToken: string,
  fetchImpl: typeof fetch = fetch,
  now?: number,
  refreshNow = Date.now(),
): Promise<GoogleIdTokenResult> {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  if (!clientId) return { ok: false, error: 'bad_audience' };
  const verify = (keys: GoogleJwk[]) => verifyGoogleIdToken(idToken, {
    clientId,
    keys,
    now,
    allowDifferentAuthorizedParty: true,
  });
  let keys = await fetchGoogleJwks(fetchImpl);
  let result = verify(keys);
  if (!result.ok && result.error === 'unknown_kid' && takeUnknownKidRefresh(refreshNow)) {
    keys = await fetchGoogleJwks(fetchImpl);
    result = verify(keys);
  }
  return result;
}
