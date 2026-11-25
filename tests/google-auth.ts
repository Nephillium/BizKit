import assert from 'node:assert/strict';
import { createSign, generateKeyPairSync, type KeyObject } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  AUTH_RATE_LIMIT,
  AUTH_RATE_WINDOW_MS,
  allowAuthAttempt,
  authRateLimitBucketCount,
  clientAddressFromRequest,
  resetAuthRateLimits,
} from '../lib/authRateLimit';
import { MOBILE_CLIENT_HEADER } from '../lib/authResponse';
import { CONTINUE_WITH_GOOGLE_LABEL } from '../components/ContinueWithGoogle';
import { planGoogleLink, type GoogleProfile } from '../lib/googleAccount';
import {
  GOOGLE_NATIVE_RATE_ROUTE,
  handleGoogleCallback,
  handleGoogleMobileExchange,
  handleGoogleNative,
  handleGoogleStart,
} from '../lib/googleAuthHandlers';
import { googleSignInErrorMessage } from '../lib/googleAuthCopy';
import {
  GOOGLE_ISSUERS,
  GOOGLE_SCOPE_PARAM,
  GOOGLE_JWKS_UNKNOWN_KID_REFRESH_MS,
  clearGoogleJwksCache,
  verifyGoogleIdToken,
  verifyGoogleIdTokenForClient,
  verifyGoogleNativeIdToken,
  type GoogleJwk,
} from '../lib/googleIdToken';
import {
  GOOGLE_MOBILE_CALLBACK,
  createPkceVerifier,
  googleAuthConfigured,
  googleRedirectUri,
  pkceChallenge,
  readGoogleOAuthState,
  readOAuthCookie,
} from '../lib/googleOAuth';
import { publicRuntimeConfig } from '../lib/runtimeConfig';
import {
  databaseHost,
  describeIdToken,
  resetGoogleAuthHostLogForTests,
  scrubLogText,
  writeGoogleAuthLog,
} from '../lib/googleAuthLog';
import {
  GOOGLE_SCHEMA_STATEMENTS,
  applyGoogleSchema,
  cachedOnce,
  type SchemaCache,
} from '../lib/googleSchema';

const require = createRequire(import.meta.url);
const {
  GOOGLE_MOBILE_CALLBACK: mobileCallback,
  appGoogleAuthEnabled,
  googleButtonVisible,
  base64ToBase64Url,
  bytesToBase64,
  googleMobileErrorMessage,
  mobileGoogleStartPath,
  readGoogleMobileResult,
  requestMobileSession,
  resolveGoogleRedirectUri,
} = require('../mobile/src/lib/googleRedirect.ts') as typeof import('../mobile/src/lib/googleRedirect');
const {
  GOOGLE_CANCELLED_MESSAGE,
  GOOGLE_DEVELOPER_ERROR,
  GOOGLE_FAILED_MESSAGE,
  GOOGLE_NO_ACCOUNT_MESSAGE,
  GOOGLE_NO_SAVED_CREDENTIAL,
  GOOGLE_NULL_PRESENTER,
  GOOGLE_PLAY_SERVICES_NOT_AVAILABLE,
  GOOGLE_SIGN_IN_CANCELLED,
  GOOGLE_SIGN_IN_FAILED,
  GOOGLE_SIGN_IN_REQUIRED,
  classifyNativeGoogleError,
  nativeGoogleAuthEnabled,
  requestNativeGoogleSession,
  shouldUseNativeGoogleSignIn,
} = require('../mobile/src/lib/googleNative.ts') as typeof import('../mobile/src/lib/googleNative');

const CLIENT_ID = 'test-google-client-id';
const CLIENT_SECRET = 'test-google-client-secret-not-in-urls';
const JWT_SECRET = 'google-auth-test-secret-32chars-min';
const NOW = 1_700_000_000;

function setEnv(name: string, value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[name];
  else env[name] = value;
}

function withEnv(values: Record<string, string | undefined>, run: () => void) {
  const previous: Record<string, string | undefined> = {};
  for (const name of Object.keys(values)) previous[name] = process.env[name];
  try {
    for (const [name, value] of Object.entries(values)) setEnv(name, value);
    run();
  } finally {
    for (const [name, value] of Object.entries(previous)) setEnv(name, value);
  }
}

function base64url(value: Buffer | string): string {
  const buffer = typeof value === 'string' ? Buffer.from(value) : value;
  return buffer.toString('base64url');
}

function signToken(
  payload: Record<string, unknown>,
  privateKey: KeyObject,
  header: Record<string, unknown> = { alg: 'RS256', typ: 'JWT', kid: 'test-key' },
): string {
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  if (header.alg === 'none') return `${data}.`;
  const signature = createSign('RSA-SHA256').update(data).sign(privateKey);
  return `${data}.${base64url(signature)}`;
}

function claims(overrides: Record<string, unknown> = {}) {
  return {
    iss: 'https://accounts.google.com',
    aud: CLIENT_ID,
    exp: NOW + 3600,
    iat: NOW,
    sub: 'google-sub-1',
    email: 'Ada@Example.com',
    email_verified: true,
    name: 'Ada Lovelace',
    picture: 'https://example.invalid/avatar.png',
    nonce: 'nonce-1',
    ...overrides,
  };
}

function createResponse() {
  let statusCode = 200;
  let jsonBody: unknown;
  let location: string | undefined;
  const headers = new Map<string, string | number | readonly string[]>();
  const res = {
    setHeader(name: string, value: string | number | readonly string[]) {
      headers.set(name.toLowerCase(), value);
      return res;
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(body: unknown) {
      jsonBody = body;
      return res;
    },
    redirect(statusOrUrl: number | string, url?: string) {
      if (typeof statusOrUrl === 'string') {
        statusCode = 302;
        location = statusOrUrl;
      } else {
        statusCode = statusOrUrl;
        location = url;
      }
      return res;
    },
  };
  return {
    res: res as unknown as NextApiResponse,
    result() {
      return { statusCode, jsonBody, location, setCookie: headers.get('set-cookie') };
    },
  };
}

function cookiePair(setCookie: string | number | readonly string[] | undefined): string {
  const first = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  assert.equal(typeof first, 'string');
  return String(first).split(';')[0];
}

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const exported = publicKey.export({ format: 'jwk' }) as { n: string; e: string; kty: string };
const keys: GoogleJwk[] = [{
  kty: 'RSA',
  n: exported.n,
  e: exported.e,
  kid: 'test-key',
  alg: 'RS256',
  use: 'sig',
}];

function testIdToken() {
  const valid = signToken(claims(), privateKey);
  const verified = verifyGoogleIdToken(valid, { clientId: CLIENT_ID, keys, nonce: 'nonce-1', now: NOW });
  assert.equal(verified.ok, true);
  if (!verified.ok) return;
  assert.equal(verified.identity.email, 'ada@example.com');
  assert.equal(verified.identity.sub, 'google-sub-1');
  assert.equal(verified.identity.name, 'Ada Lovelace');
  assert.equal(verified.identity.emailVerified, true);
  assert.equal(Object.hasOwn(verified.identity, 'picture'), false);
  assert.equal(JSON.stringify(verified.identity).includes('avatar'), false);

  const plainIssuer = verifyGoogleIdToken(
    signToken(claims({ iss: 'accounts.google.com' }), privateKey),
    { clientId: CLIENT_ID, keys, nonce: 'nonce-1', now: NOW },
  );
  assert.equal(plainIssuer.ok, true);

  const androidPresenter = signToken(
    claims({ azp: 'android-client-id', nonce: undefined }),
    privateKey,
  );
  const strictPresenter = verifyGoogleIdToken(androidPresenter, {
    clientId: CLIENT_ID,
    keys,
    nonce: 'nonce-1',
    now: NOW,
  });
  assert.equal(strictPresenter.ok, false);
  if (!strictPresenter.ok) assert.equal(strictPresenter.error, 'bad_audience');
  const nativePresenter = verifyGoogleIdToken(androidPresenter, {
    clientId: CLIENT_ID,
    keys,
    now: NOW,
    allowDifferentAuthorizedParty: true,
  });
  assert.equal(nativePresenter.ok, true);

  const verifiedString = verifyGoogleIdToken(
    signToken(claims({ email_verified: 'true' }), privateKey),
    { clientId: CLIENT_ID, keys, nonce: 'nonce-1', now: NOW },
  );
  assert.equal(verifiedString.ok, true);

  const withinSkew = verifyGoogleIdToken(
    signToken(claims({ exp: NOW - 30 }), privateKey),
    { clientId: CLIENT_ID, keys, nonce: 'nonce-1', now: NOW },
  );
  assert.equal(withinSkew.ok, true);

  const cases: Array<[Record<string, unknown>, string]> = [
    [{ aud: 'other-client' }, 'bad_audience'],
    [{ aud: [CLIENT_ID], azp: 'other-client' }, 'bad_audience'],
    [{ iss: 'https://evil.example' }, 'bad_issuer'],
    [{ exp: NOW - 120 }, 'expired'],
    [{ email_verified: false }, 'email_not_verified'],
    [{ email_verified: 'false' }, 'email_not_verified'],
    [{ email: 'not-an-email' }, 'missing_email'],
    [{ sub: '' }, 'missing_subject'],
    [{ nonce: 'other-nonce' }, 'bad_nonce'],
  ];
  for (const [override, error] of cases) {
    const result = verifyGoogleIdToken(signToken(claims(override), privateKey), {
      clientId: CLIENT_ID,
      keys,
      nonce: 'nonce-1',
      now: NOW,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, error);
  }

  const tamperedPayload = valid.split('.');
  tamperedPayload[1] = base64url(JSON.stringify(claims({ email: 'other@example.com' })));
  const tampered = verifyGoogleIdToken(tamperedPayload.join('.'), {
    clientId: CLIENT_ID,
    keys,
    nonce: 'nonce-1',
    now: NOW,
  });
  assert.equal(tampered.ok, false);
  if (!tampered.ok) assert.equal(tampered.error, 'invalid_signature');

  const signatureStart = valid.lastIndexOf('.') + 1;
  const flipAt = signatureStart + 4;
  const flippedChar = valid[flipAt] === 'a' ? 'b' : 'a';
  const flipped = `${valid.slice(0, flipAt)}${flippedChar}${valid.slice(flipAt + 1)}`;
  const badSignature = verifyGoogleIdToken(flipped, {
    clientId: CLIENT_ID,
    keys,
    nonce: 'nonce-1',
    now: NOW,
  });
  assert.equal(badSignature.ok, false);

  const noneAlg = verifyGoogleIdToken(
    signToken(claims(), privateKey, { alg: 'none', typ: 'JWT', kid: 'test-key' }),
    { clientId: CLIENT_ID, keys, nonce: 'nonce-1', now: NOW },
  );
  assert.equal(noneAlg.ok, false);
  if (!noneAlg.ok) assert.equal(noneAlg.error, 'unsupported_alg');

  const unknownKid = verifyGoogleIdToken(
    signToken(claims(), privateKey, { alg: 'RS256', typ: 'JWT', kid: 'missing' }),
    { clientId: CLIENT_ID, keys, nonce: 'nonce-1', now: NOW },
  );
  assert.equal(unknownKid.ok, false);
  if (!unknownKid.ok) assert.equal(unknownKid.error, 'unknown_kid');

  assert.deepEqual(GOOGLE_ISSUERS, ['https://accounts.google.com', 'accounts.google.com']);
}

function testLinkPlan() {
  const base = {
    sub: 'sub-1',
    email: 'ada@example.com',
    emailVerified: true,
    linkedUserId: null,
    emailUserId: null,
    emailUserGoogleSub: null,
    signupBlocked: false,
  };
  assert.deepEqual(planGoogleLink(base), { action: 'create' });
  assert.deepEqual(planGoogleLink({ ...base, emailVerified: false }), {
    action: 'reject',
    error: 'email_not_verified',
  });
  assert.deepEqual(planGoogleLink({ ...base, signupBlocked: true }), {
    action: 'reject',
    error: 'signup_blocked',
  });
  assert.deepEqual(planGoogleLink({ ...base, emailUserId: 'user-1', signupBlocked: true }), {
    action: 'link_existing',
    userId: 'user-1',
  });
  assert.deepEqual(planGoogleLink({ ...base, emailUserId: 'user-1' }), {
    action: 'link_existing',
    userId: 'user-1',
  });
  assert.deepEqual(
    planGoogleLink({ ...base, emailUserId: 'user-1', emailUserGoogleSub: 'other-sub' }),
    { action: 'reject', error: 'identity_conflict' },
  );
  assert.deepEqual(
    planGoogleLink({
      ...base,
      linkedUserId: 'user-1',
      emailUserId: 'user-2',
      emailUserGoogleSub: null,
    }),
    { action: 'update_link', userId: 'user-1' },
  );
  assert.deepEqual(planGoogleLink({ ...base, email: ' ' }), {
    action: 'reject',
    error: 'invalid_profile',
  });
}

function configuredEnv(): Record<string, string> {
  return {
    NODE_ENV: 'production',
    JWT_SECRET,
    GOOGLE_CLIENT_ID: CLIENT_ID,
    GOOGLE_CLIENT_SECRET: CLIENT_SECRET,
    APP_BASE_URL: 'https://pitchcrafter.glmlabs.io',
  };
}

function testConfigGate() {
  withEnv(
    {
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
      APP_BASE_URL: 'https://pitchcrafter.glmlabs.io',
      NODE_ENV: 'production',
    },
    () => {
      assert.equal(googleAuthConfigured(), false);
      assert.equal(publicRuntimeConfig().googleAuth, false);
    },
  );
  withEnv({ ...configuredEnv(), GOOGLE_CLIENT_SECRET: undefined }, () => {
    assert.equal(googleAuthConfigured(), false);
  });
  withEnv({ ...configuredEnv(), APP_BASE_URL: 'http://pitchcrafter.glmlabs.io' }, () => {
    assert.equal(googleRedirectUri(), null);
    assert.equal(googleAuthConfigured(), false);
  });
  withEnv(configuredEnv(), () => {
    assert.equal(googleAuthConfigured(), true);
    assert.equal(
      googleRedirectUri(),
      'https://pitchcrafter.glmlabs.io/api/auth/google/callback',
    );
    const config = publicRuntimeConfig();
    assert.equal(config.googleAuth, true);
    const serialized = JSON.stringify(config);
    assert.equal(serialized.includes(CLIENT_SECRET), false);
    assert.equal(serialized.includes(CLIENT_ID), false);
  });
  withEnv(
    { ...configuredEnv(), NODE_ENV: 'development', APP_BASE_URL: 'http://localhost:5000/' },
    () => {
      assert.equal(googleRedirectUri(), 'http://localhost:5000/api/auth/google/callback');
    },
  );
}

async function testOAuthHandlers() {
  await withEnvAsync(configuredEnv(), async () => {
    const disabled = createResponse();
    setEnv('GOOGLE_CLIENT_SECRET', undefined);
    await handleGoogleStart({ method: 'GET', query: {}, headers: {} } as NextApiRequest, disabled.res);
    assert.equal(disabled.result().statusCode, 404);
    assert.equal(disabled.result().location, undefined);
    setEnv('GOOGLE_CLIENT_SECRET', CLIENT_SECRET);

    const start = createResponse();
    await handleGoogleStart(
      { method: 'GET', query: {}, headers: {} } as NextApiRequest,
      start.res,
    );
    const started = start.result();
    assert.equal(started.statusCode, 302);
    const authorize = new URL(String(started.location));
    assert.equal(authorize.origin, 'https://accounts.google.com');
    assert.equal(authorize.pathname, '/o/oauth2/v2/auth');
    assert.equal(authorize.searchParams.get('scope'), GOOGLE_SCOPE_PARAM);
    assert.equal(authorize.searchParams.get('scope'), 'openid email profile');
    assert.equal(authorize.searchParams.get('response_type'), 'code');
    assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256');
    assert.equal(authorize.searchParams.get('client_id'), CLIENT_ID);
    assert.equal(
      authorize.searchParams.get('redirect_uri'),
      'https://pitchcrafter.glmlabs.io/api/auth/google/callback',
    );
    assert.equal(String(started.location).includes(CLIENT_SECRET), false);
    const cookie = cookiePair(started.setCookie);
    assert.match(String(started.setCookie), /HttpOnly/);
    assert.match(String(started.setCookie), /SameSite=Lax/);
    assert.match(String(started.setCookie), /Path=\/api\/auth\/google/);
    assert.match(String(started.setCookie), /Secure/);
    const flow = readGoogleOAuthState(readOAuthCookie(cookie) ?? '');
    assert.ok(flow);
    assert.equal(flow.client, 'web');
    assert.equal(authorize.searchParams.get('state'), flow.state);
    assert.equal(authorize.searchParams.get('nonce'), flow.nonce);
    assert.equal(authorize.searchParams.get('code_challenge'), pkceChallenge(flow.verifier));

    let exchangedVerifier = '';
    const success = createResponse();
    await handleGoogleCallback(
      {
        method: 'GET',
        query: { code: 'auth-code', state: flow.state },
        headers: { cookie },
      } as unknown as NextApiRequest,
      success.res,
      {
        exchangeCode: async (input) => {
          exchangedVerifier = input.codeVerifier;
          assert.equal(input.code, 'auth-code');
          assert.equal(input.redirectUri, 'https://pitchcrafter.glmlabs.io/api/auth/google/callback');
          return { idToken: 'signed-id-token' };
        },
        verifyIdToken: async (_token, nonce) => {
          assert.equal(nonce, flow.nonce);
          return {
            ok: true,
            identity: {
              sub: 'google-sub-1',
              email: 'ada@example.com',
              emailVerified: true,
              name: 'Ada Lovelace',
            },
          };
        },
        signIn: async () => ({
          token: 'session-token-from-google',
          created: false,
          user: {
            id: 'user-1',
            email: 'ada@example.com',
            role: 'user',
            credits: 0,
            usage_count: 0,
            created_at: new Date('2026-01-01T00:00:00.000Z'),
          },
        }),
        issueMobileCode: async () => {
          throw new Error('web sign-in must not issue a mobile code');
        },
      },
    );
    assert.equal(exchangedVerifier, flow.verifier);
    const signedIn = success.result();
    assert.equal(signedIn.statusCode, 302);
    assert.equal(signedIn.location, '/');
    assert.equal(String(signedIn.location).includes('session-token-from-google'), false);
    const setCookie = signedIn.setCookie;
    assert.ok(Array.isArray(setCookie));
    const joined = (setCookie as string[]).join('\n');
    assert.match(joined, /bizkit_token=session-token-from-google/);
    assert.match(joined, /bizkit_google_oauth=/);
    assert.match(joined, /HttpOnly/);

    const missingChallenge = createResponse();
    await handleGoogleStart(
      { method: 'GET', query: { client: 'mobile' }, headers: {} } as unknown as NextApiRequest,
      missingChallenge.res,
    );
    assert.equal(missingChallenge.result().statusCode, 400);
    assert.equal(missingChallenge.result().location, undefined);
    assert.equal((missingChallenge.result().jsonBody as { error: string }).error, 'invalid_code_challenge');

    const appVerifier = createPkceVerifier();
    const appChallenge = pkceChallenge(appVerifier);
    const mobileStart = createResponse();
    await handleGoogleStart(
      {
        method: 'GET',
        query: { client: 'mobile', return_to: 'account-delete', code_challenge: appChallenge },
        headers: {},
      } as unknown as NextApiRequest,
      mobileStart.res,
    );
    const mobileCookie = cookiePair(mobileStart.result().setCookie);
    const mobileFlow = readGoogleOAuthState(readOAuthCookie(mobileCookie) ?? '');
    assert.ok(mobileFlow);
    assert.equal(mobileFlow.client, 'mobile');
    assert.equal(mobileFlow.returnTo, 'home');
    assert.equal(mobileFlow.mobileChallenge, appChallenge);
    const mobileAuthorize = new URL(String(mobileStart.result().location));
    assert.equal(mobileAuthorize.searchParams.get('code_challenge'), pkceChallenge(mobileFlow.verifier));
    assert.notEqual(mobileAuthorize.searchParams.get('code_challenge'), appChallenge);
    const mobile = createResponse();
    await handleGoogleCallback(
      {
        method: 'GET',
        query: { code: 'mobile-code', state: mobileFlow.state },
        headers: { cookie: mobileCookie },
      } as unknown as NextApiRequest,
      mobile.res,
      {
        exchangeCode: async () => ({ idToken: 'mobile-id-token' }),
        verifyIdToken: async () => ({
          ok: true,
          identity: {
            sub: 'google-sub-2',
            email: 'new@example.com',
            emailVerified: true,
            name: null,
          },
        }),
        signIn: async () => ({
          token: 'mobile-bearer-token',
          created: true,
          user: {
            id: 'user-2',
            email: 'new@example.com',
            role: 'user',
            credits: 0,
            usage_count: 0,
            created_at: new Date('2026-01-01T00:00:00.000Z'),
          },
        }),
        issueMobileCode: async (input) => {
          assert.equal(input.codeChallenge, appChallenge);
          assert.equal(input.userId, 'user-2');
          assert.equal(input.created, true);
          return 'a'.repeat(43);
        },
      },
    );
    const mobileResult = mobile.result();
    assert.equal(mobileResult.statusCode, 302);
    const returned = new URL(String(mobileResult.location));
    assert.equal(`${returned.protocol}//${returned.host}${returned.pathname}`, GOOGLE_MOBILE_CALLBACK);
    assert.equal(returned.searchParams.get('code'), 'a'.repeat(43));
    assert.equal(returned.searchParams.get('token'), null);
    assert.equal(returned.searchParams.get('created'), '1');
    assert.equal(String(mobileResult.location).includes('mobile-bearer-token'), false);
    assert.equal(mobileCallback, GOOGLE_MOBILE_CALLBACK);

    const unverified = createResponse();
    await handleGoogleCallback(
      {
        method: 'GET',
        query: { code: 'auth-code', state: flow.state },
        headers: { cookie },
      } as unknown as NextApiRequest,
      unverified.res,
      {
        exchangeCode: async () => ({ idToken: 'id-token' }),
        verifyIdToken: async () => ({ ok: false, error: 'email_not_verified' }),
        signIn: async () => {
          throw new Error('should not link an unverified email');
        },
        issueMobileCode: async () => {
          throw new Error('should not issue a mobile code');
        },
      },
    );
    assert.equal(unverified.result().location, '/?google_error=email_not_verified');
    assert.equal(String(unverified.result().setCookie).includes('bizkit_token='), false);

    const mismatch = createResponse();
    await handleGoogleCallback(
      {
        method: 'GET',
        query: { code: 'auth-code', state: 'wrong-state' },
        headers: { cookie },
      } as unknown as NextApiRequest,
      mismatch.res,
      {
        exchangeCode: async () => {
          throw new Error('should not exchange');
        },
        verifyIdToken: async () => {
          throw new Error('should not verify');
        },
        signIn: async () => {
          throw new Error('should not link');
        },
        issueMobileCode: async () => {
          throw new Error('should not issue a mobile code');
        },
      },
    );
    assert.equal(mismatch.result().location, '/?google_error=invalid_state');

    const denied = createResponse();
    await handleGoogleCallback(
      {
        method: 'GET',
        query: { error: 'access_denied', state: flow.state },
        headers: { cookie },
      } as unknown as NextApiRequest,
      denied.res,
      {
        exchangeCode: async () => {
          throw new Error('should not exchange');
        },
        verifyIdToken: async () => {
          throw new Error('should not verify');
        },
        signIn: async () => {
          throw new Error('should not link');
        },
        issueMobileCode: async () => {
          throw new Error('should not issue a mobile code');
        },
      },
    );
    assert.equal(denied.result().location, '/?google_error=access_denied');
    assert.equal(googleSignInErrorMessage('access_denied'), 'Google sign-in was cancelled.');
    assert.equal(googleSignInErrorMessage('not-a-real-code'), 'Google sign-in failed. Try again.');

    let redeemCalls = 0;
    const noHeader = createResponse();
    await handleGoogleMobileExchange(
      { method: 'POST', body: { code: 'a'.repeat(43), code_verifier: appVerifier }, headers: {} } as unknown as NextApiRequest,
      noHeader.res,
      {
        redeem: async () => {
          redeemCalls += 1;
          return { ok: false, error: 'invalid_code' };
        },
        findUser: async () => null,
        generateToken: () => {
          throw new Error('should not mint a token');
        },
      },
    );
    assert.equal(noHeader.result().statusCode, 400);
    assert.equal(redeemCalls, 0);

    const rejected = createResponse();
    await handleGoogleMobileExchange(
      {
        method: 'POST',
        body: { code: 'a'.repeat(43), code_verifier: 'wrong-verifier-value-0123456789abcdef' },
        headers: { [MOBILE_CLIENT_HEADER]: 'mobile' },
      } as unknown as NextApiRequest,
      rejected.res,
      {
        redeem: async () => ({ ok: false, error: 'invalid_verifier' }),
        findUser: async () => {
          throw new Error('should not load a user');
        },
        generateToken: () => {
          throw new Error('should not mint a token');
        },
      },
    );
    assert.equal(rejected.result().statusCode, 401);
    assert.equal((rejected.result().jsonBody as { error: string }).error, 'invalid_verifier');
    assert.equal(JSON.stringify(rejected.result().jsonBody).includes('token'), false);

    const exchanged = createResponse();
    await handleGoogleMobileExchange(
      {
        method: 'POST',
        body: { code: 'a'.repeat(43), code_verifier: appVerifier },
        headers: { [MOBILE_CLIENT_HEADER]: 'mobile' },
      } as unknown as NextApiRequest,
      exchanged.res,
      {
        redeem: async (input) => {
          assert.equal(input.code, 'a'.repeat(43));
          assert.equal(input.verifier, appVerifier);
          return { ok: true, userId: 'user-2', created: true };
        },
        findUser: async () => ({
          id: 'user-2',
          email: 'new@example.com',
          password_hash: 'hashed-password-must-not-leak',
          role: 'user',
          credits: 0,
          usage_count: 0,
          created_at: new Date('2026-01-01T00:00:00.000Z'),
        }),
        generateToken: () => 'exchanged-session-token',
      },
    );
    assert.equal(exchanged.result().statusCode, 200);
    const exchangeBody = exchanged.result().jsonBody as { token?: string; created?: boolean; user?: { password_hash?: string } };
    assert.equal(exchangeBody.token, 'exchanged-session-token');
    assert.equal(exchangeBody.created, true);
    assert.equal(exchangeBody.user?.password_hash, undefined);
    assert.match(String(exchanged.result().setCookie), /bizkit_token=exchanged-session-token/);
  });

  await withEnvAsync({ ...configuredEnv(), NODE_ENV: 'development' }, async () => {
    const dev = createResponse();
    await handleGoogleStart({ method: 'GET', query: {}, headers: {} } as NextApiRequest, dev.res);
    assert.match(String(dev.result().setCookie), /HttpOnly/);
    assert.doesNotMatch(String(dev.result().setCookie), /Secure/);
  });
}

async function withEnvAsync(values: Record<string, string | undefined>, run: () => Promise<void>) {
  const previous: Record<string, string | undefined> = {};
  for (const name of Object.keys(values)) previous[name] = process.env[name];
  try {
    for (const [name, value] of Object.entries(values)) setEnv(name, value);
    await run();
  } finally {
    for (const [name, value] of Object.entries(previous)) setEnv(name, value);
  }
}

async function testMobileContract() {
  assert.equal(appGoogleAuthEnabled(undefined), false);
  assert.equal(appGoogleAuthEnabled(''), false);
  assert.equal(appGoogleAuthEnabled('true'), false);
  assert.equal(appGoogleAuthEnabled('1'), true);
  assert.equal(googleButtonVisible(false, true), false);
  assert.equal(googleButtonVisible(true, false), false);
  assert.equal(googleButtonVisible(true, true), true);
  assert.equal(resolveGoogleRedirectUri('exp://127.0.0.1:8081/--/auth/google'), GOOGLE_MOBILE_CALLBACK);
  assert.equal(resolveGoogleRedirectUri(GOOGLE_MOBILE_CALLBACK), GOOGLE_MOBILE_CALLBACK);

  const oneTimeCode = 'b'.repeat(43);
  const success = readGoogleMobileResult(`pitchcrafter://auth/google?code=${oneTimeCode}&created=1`);
  assert.equal(success.kind, 'success');
  if (success.kind === 'success') {
    assert.equal(success.code, oneTimeCode);
    assert.equal(success.created, true);
    assert.equal('token' in success, false);
  }
  const intercepted = readGoogleMobileResult('pitchcrafter://auth/google?token=long-lived-session-token&created=1');
  assert.equal(intercepted.kind, 'error');
  assert.equal(JSON.stringify(intercepted).includes('long-lived-session-token'), false);
  const failed = readGoogleMobileResult('pitchcrafter://auth/google?error=email_not_verified&token=nope');
  assert.equal(failed.kind, 'error');
  if (failed.kind === 'error') {
    assert.equal(failed.error, googleMobileErrorMessage('email_not_verified'));
    assert.equal(failed.error.includes('nope'), false);
  }
  assert.equal(readGoogleMobileResult('https://evil.example/auth/google?code=' + oneTimeCode).kind, 'ignore');
  assert.equal(googleMobileErrorMessage('<script>'), 'Google sign-in failed. Try again.');
  assert.equal(pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  assert.equal(base64ToBase64Url('abc+def/ghi='), 'abc-def_ghi');
  assert.equal(bytesToBase64(Uint8Array.from([0, 1, 2])), 'AAEC');
  const challenge = pkceChallenge(createPkceVerifier());
  assert.equal(mobileGoogleStartPath(challenge), `/api/auth/google/start?client=mobile&code_challenge=${challenge}`);
  assert.equal(mobileGoogleStartPath(challenge).includes('code_verifier'), false);

  const verifier = 'verifier-secret-value-which-is-long-enough-1234';
  let postedUrl = '';
  let postedBody = '';
  let postedHeader = '';
  const session = await requestMobileSession(
    'https://pitchcrafter.glmlabs.io',
    oneTimeCode,
    verifier,
    async (url, init) => {
      postedUrl = String(url);
      postedBody = String(init?.body);
      postedHeader = String((init?.headers as Record<string, string>)['X-PitchCrafter-Client']);
      return {
        ok: true,
        json: async () => ({ ok: true, token: 'session-from-exchange', created: false }),
      } as Response;
    },
  );
  assert.equal(postedUrl, 'https://pitchcrafter.glmlabs.io/api/auth/google/exchange');
  assert.equal(postedUrl.includes(verifier), false);
  assert.equal(postedUrl.includes(oneTimeCode), false);
  assert.match(postedBody, new RegExp(`"code":"${oneTimeCode}"`));
  assert.match(postedBody, new RegExp(`"code_verifier":"${verifier}"`));
  assert.equal(postedHeader, 'mobile');
  assert.equal('token' in session && session.token, 'session-from-exchange');
  const exchangeError = await requestMobileSession(
    'https://pitchcrafter.glmlabs.io',
    oneTimeCode,
    verifier,
    async () => ({
      ok: false,
      json: async () => ({ ok: false, error: 'invalid_verifier' }),
    }) as Response,
  );
  assert.deepEqual(exchangeError, { error: 'Google sign-in failed (invalid_verifier). Try again.' });
  const exchangeLeak = await requestMobileSession(
    'https://pitchcrafter.glmlabs.io',
    oneTimeCode,
    verifier,
    async () => ({
      ok: false,
      json: async () => ({ ok: false, error: 'ada@example.com' }),
    }) as Response,
  );
  assert.deepEqual(exchangeLeak, { error: 'Google sign-in failed. Try again.' });
  assert.equal(JSON.stringify(exchangeLeak).includes('ada@example.com'), false);

  const login = readFileSync('mobile/src/screens/LoginScreen.tsx', 'utf8');
  const register = readFileSync('mobile/src/screens/RegisterScreen.tsx', 'utf8');
  const button = readFileSync('mobile/src/components/ContinueWithGoogleButton.tsx', 'utf8');
  const appJson = readFileSync('mobile/app.json', 'utf8');
  const appConfig = readFileSync('mobile/app.config.ts', 'utf8');
  assert.match(login, /googleAuthEnabled/);
  assert.match(register, /googleAuthEnabled/);
  assert.match(button, /Continue with Google/);
  assert.match(button, /#747775/);
  assert.match(appJson, /"scheme": "pitchcrafter"/);
  assert.match(appJson, /"versionCode": 8/);
  assert.match(appJson, /#6366F1/);
  assert.match(appJson, /#FAFAFA/);
  const appSource = readFileSync('mobile/App.tsx', 'utf8');
  const themeSource = readFileSync('mobile/src/lib/theme.ts', 'utf8');
  assert.match(appSource, /SafeAreaProvider/);
  assert.match(appSource, /useSafeAreaInsets/);
  assert.match(appSource, /Ionicons/);
  assert.match(appSource, /tabCreate/);
  assert.match(appSource, /tabAccount/);
  assert.doesNotMatch(appSource, /homeIcon/);
  assert.match(themeSource, /#6366F1/);
  assert.match(themeSource, /#FAFAFA/);
  assert.match(themeSource, /#0F172A/);
  assert.match(themeSource, /#EEF2FF/);
  assert.doesNotMatch(themeSource, /#FD7C55/);
  assert.doesNotMatch(themeSource, /#C2410C/);
  assert.match(appConfig, /EXPO_PUBLIC_GOOGLE_AUTH/);
  assert.match(appConfig, /EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID/);
  assert.match(appConfig, /@react-native-google-signin\/google-signin/);
  const mobilePackage = readFileSync('mobile/package.json', 'utf8');
  assert.match(mobilePackage, /@react-native-google-signin\/google-signin/);
  const signInSource = readFileSync('mobile/src/lib/googleSignIn.ts', 'utf8');
  assert.match(signInSource, /startBrowserGoogleSignIn/);
  assert.match(signInSource, /attemptNativeGoogleSignIn/);
  assert.match(signInSource, /hasPlayServices/);
  assert.match(signInSource, /webClientId/);
  const nativeAttempt = signInSource.slice(
    signInSource.indexOf('async function attemptNativeGoogleSignIn'),
    signInSource.indexOf('export async function startBrowserGoogleSignIn'),
  );
  assert.match(nativeAttempt, /return \{ cancelled: true \}/);
  assert.equal(nativeAttempt.includes('GOOGLE_CANCELLED_MESSAGE'), false);
  assert.match(readFileSync('pages/api/auth/google/native.ts', 'utf8'), /handleGoogleNative/);
  const handlerSource = readFileSync('lib/googleAuthHandlers.ts', 'utf8');
  const nativeHandler = handlerSource.slice(handlerSource.indexOf('export async function handleGoogleNative'));
  assert.equal(nativeHandler.includes('console.'), false);

  assert.equal(nativeGoogleAuthEnabled('1', 'web-client-id'), true);
  assert.equal(nativeGoogleAuthEnabled('1', '  '), false);
  assert.equal(nativeGoogleAuthEnabled('1', undefined), false);
  assert.equal(nativeGoogleAuthEnabled(undefined, 'web-client-id'), false);
  assert.equal(nativeGoogleAuthEnabled('true', 'web-client-id'), false);
  assert.equal(shouldUseNativeGoogleSignIn({
    platform: 'android',
    authFlag: '1',
    webClientId: 'web-client-id',
  }), true);
  assert.equal(shouldUseNativeGoogleSignIn({
    platform: 'ios',
    authFlag: '1',
    webClientId: 'web-client-id',
  }), false);
  assert.equal(shouldUseNativeGoogleSignIn({
    platform: 'android',
    authFlag: '1',
    webClientId: '',
  }), false);

  const cancelledDecision = classifyNativeGoogleError({ code: GOOGLE_SIGN_IN_CANCELLED });
  assert.equal(cancelledDecision.action, 'cancelled');
  if (cancelledDecision.action === 'cancelled') {
    assert.equal(cancelledDecision.message, GOOGLE_CANCELLED_MESSAGE);
  }
  const noAccount = classifyNativeGoogleError({ code: GOOGLE_SIGN_IN_REQUIRED });
  assert.equal(noAccount.action, 'message');
  if (noAccount.action === 'message') {
    assert.equal(
      noAccount.message,
      'No Google account is on this device. Add a Google account in Android settings, then try again (4).',
    );
  }
  const noCredential = classifyNativeGoogleError({ code: GOOGLE_NO_SAVED_CREDENTIAL });
  if (noCredential.action === 'message') {
    assert.equal(noCredential.message.includes('(NO_SAVED_CREDENTIAL_FOUND)'), true);
  }
  const noAccountText = classifyNativeGoogleError({ message: 'No Google account on this device' });
  if (noAccountText.action === 'message') assert.equal(noAccountText.message, GOOGLE_NO_ACCOUNT_MESSAGE);
  const playServices = classifyNativeGoogleError({ code: GOOGLE_PLAY_SERVICES_NOT_AVAILABLE });
  if (playServices.action === 'message') {
    assert.equal(
      playServices.message,
      'Google Play services is missing or out of date on this device (PLAY_SERVICES_NOT_AVAILABLE).',
    );
  }
  assert.equal(classifyNativeGoogleError({ code: GOOGLE_DEVELOPER_ERROR }).action, 'fallback');
  assert.equal(classifyNativeGoogleError({ code: GOOGLE_SIGN_IN_FAILED, message: 'DEVELOPER_ERROR' }).action, 'fallback');
  assert.equal(classifyNativeGoogleError({ code: GOOGLE_NULL_PRESENTER }).action, 'fallback');
  assert.equal(classifyNativeGoogleError({ message: 'Cannot find native module' }).action, 'fallback');
  const unknownCode = classifyNativeGoogleError({ code: '999' });
  if (unknownCode.action === 'message') {
    assert.equal(unknownCode.message, 'Google sign-in failed (999). Try again.');
  }

  const nativeIdToken = 'header.payload.signature';
  let nativeUrl = '';
  let nativeBody = '';
  let nativeHeader = '';
  const nativeSession = await requestNativeGoogleSession(
    'https://pitchcrafter.glmlabs.io',
    nativeIdToken,
    async (url, init) => {
      nativeUrl = String(url);
      nativeBody = String(init?.body);
      nativeHeader = String((init?.headers as Record<string, string>)['X-PitchCrafter-Client']);
      return {
        ok: true,
        json: async () => ({ ok: true, token: 'session-from-native', created: true }),
      } as Response;
    },
  );
  assert.equal(nativeUrl, 'https://pitchcrafter.glmlabs.io/api/auth/google/native');
  assert.equal(nativeUrl.includes(nativeIdToken), false);
  assert.equal(nativeHeader, 'mobile');
  assert.match(nativeBody, /"id_token":"header.payload.signature"/);
  assert.equal('token' in nativeSession && nativeSession.token, 'session-from-native');
  const limitedSession = await requestNativeGoogleSession(
    'https://pitchcrafter.glmlabs.io',
    nativeIdToken,
    async () => ({
      ok: false,
      json: async () => ({ ok: false, error: 'rate_limited' }),
    }) as Response,
  );
  assert.deepEqual(limitedSession, {
    error: 'Too many Google sign-in attempts. Wait a minute and try again (rate_limited).',
  });
  assert.equal(JSON.stringify(limitedSession).includes(nativeIdToken), false);
  const audienceSession = await requestNativeGoogleSession(
    'https://pitchcrafter.glmlabs.io',
    nativeIdToken,
    async () => ({
      ok: false,
      json: async () => ({ ok: false, error: 'bad_audience' }),
    }) as Response,
  );
  assert.deepEqual(audienceSession, { error: 'Google sign-in failed (bad_audience). Try again.' });
  const leaked = await requestNativeGoogleSession(
    'https://pitchcrafter.glmlabs.io',
    nativeIdToken,
    async () => ({
      ok: false,
      json: async () => ({ ok: false, error: 'ada@example.com' }),
    }) as Response,
  );
  assert.deepEqual(leaked, { error: GOOGLE_FAILED_MESSAGE });
  assert.equal(JSON.stringify(leaked).includes('ada@example.com'), false);
  assert.equal(JSON.stringify(leaked).includes(nativeIdToken), false);
}

function testWebButton() {
  assert.equal(CONTINUE_WITH_GOOGLE_LABEL, 'Continue with Google');
  const button = readFileSync('components/ContinueWithGoogle.tsx', 'utf8');
  const home = readFileSync('pages/index.tsx', 'utf8');
  const deletion = readFileSync('pages/account/delete.tsx', 'utf8');
  assert.match(button, /Continue with Google/);
  assert.match(button, /#EA4335/);
  assert.match(button, /#4285F4/);
  assert.match(button, /#FBBC05/);
  assert.match(button, /#34A853/);
  assert.match(button, /#747775/);
  assert.match(button, /#1f1f1f/);
  assert.match(home, /runtime\?\.googleAuth === true/);
  assert.match(home, /ContinueWithGoogle/);
  assert.match(deletion, /googleAuth &&/);
  assert.match(deletion, /return_to=account-delete/);
  const account = readFileSync('lib/googleAccount.ts', 'utf8');
  assert.match(account, /picture is not stored|profile photo is not stored/i);
  assert.match(account, /recordSignIn\(user\.id\)/);
}

function nativeRequest(
  body: unknown,
  remoteAddress: string,
  headers: Record<string, string> = { [MOBILE_CLIENT_HEADER]: 'mobile' },
): NextApiRequest {
  return {
    method: 'POST',
    body,
    headers,
    socket: { remoteAddress },
  } as unknown as NextApiRequest;
}

async function testNativeEndpoint() {
  clearGoogleJwksCache();
  resetAuthRateLimits();
  const logs: string[] = [];
  const consoleMethods = ['log', 'info', 'warn', 'error', 'debug'] as const;
  const original = Object.fromEntries(consoleMethods.map((method) => [method, console[method]])) as {
    [K in (typeof consoleMethods)[number]]: typeof console[K];
  };
  for (const method of consoleMethods) {
    console[method] = (...args: unknown[]) => {
      logs.push(args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '));
    };
  }

  const jwksFetch = (async () => ({
    ok: true,
    json: async () => ({ keys }),
  })) as unknown as typeof fetch;

  const androidClient = 'android-oauth-client.apps.googleusercontent.com';
  let signedInWith: GoogleProfile | null = null;
  const deps = {
    verifyIdToken: (idToken: string) => verifyGoogleNativeIdToken(idToken, jwksFetch, NOW),
    signIn: async (profile: GoogleProfile) => {
      signedInWith = profile;
      return {
        token: 'native-session-token',
        created: true,
        user: {
          id: 'user-9',
          email: profile.email,
          role: 'user' as const,
          credits: 0,
          usage_count: 0,
          created_at: new Date('2026-01-01T00:00:00.000Z'),
        },
      };
    },
  };

  function nativeToken(overrides: Record<string, unknown> = {}) {
    return signToken(claims({
      azp: androidClient,
      nonce: undefined,
      ...overrides,
    }), privateKey);
  }

  try {
    await withEnvAsync(configuredEnv(), async () => {
      const idToken = nativeToken({ iss: 'accounts.google.com' });
      const ok = createResponse();
      await handleGoogleNative(nativeRequest({ id_token: idToken }, '203.0.113.40'), ok.res, deps);
      assert.equal(ok.result().statusCode, 200);
      const body = ok.result().jsonBody as {
        ok?: boolean;
        token?: string;
        created?: boolean;
        user?: { email?: string; password_hash?: string; id?: string };
      };
      assert.equal(body.ok, true);
      assert.equal(body.token, 'native-session-token');
      assert.equal(body.created, true);
      assert.equal(body.user?.email, 'ada@example.com');
      assert.equal(body.user?.id, 'user-9');
      assert.equal(body.user?.password_hash, undefined);
      assert.match(String(ok.result().setCookie), /bizkit_token=native-session-token/);
      assert.equal(JSON.stringify(body).includes(idToken), false);
      assert.equal(JSON.stringify(body).includes('avatar'), false);
      assert.equal(JSON.stringify(ok.result().setCookie).includes(idToken), false);
      assert.ok(signedInWith);
      assert.equal(signedInWith?.email, 'ada@example.com');
      assert.equal(signedInWith?.sub, 'google-sub-1');
      assert.equal(signedInWith?.name, 'Ada Lovelace');
      assert.equal(signedInWith?.emailVerified, true);
      assert.equal(JSON.stringify(signedInWith).includes('avatar'), false);

      const httpsIssuer = nativeToken({ iss: 'https://accounts.google.com' });
      signedInWith = null;
      const httpsOk = createResponse();
      await handleGoogleNative(nativeRequest({ id_token: httpsIssuer }, '203.0.113.45'), httpsOk.res, deps);
      assert.equal(httpsOk.result().statusCode, 200);
      assert.equal((httpsOk.result().jsonBody as { token?: string }).token, 'native-session-token');

      signedInWith = null;
      const wrongAudienceToken = nativeToken({ aud: 'other-client' });
      const wrongAudience = createResponse();
      await handleGoogleNative(
        nativeRequest({ id_token: wrongAudienceToken }, '203.0.113.41'),
        wrongAudience.res,
        deps,
      );
      assert.equal(wrongAudience.result().statusCode, 401);
      assert.equal((wrongAudience.result().jsonBody as { error?: string }).error, 'bad_audience');
      assert.equal(wrongAudience.result().jsonBody && JSON.stringify(wrongAudience.result().jsonBody).includes(wrongAudienceToken), false);
      assert.equal(signedInWith, null);
      const audienceLog = loggedGoogleAuth(logs).find((entry) => entry.error === 'bad_audience');
      assert.ok(audienceLog);
      assert.equal(audienceLog.route, 'POST /api/auth/google/native');
      assert.equal(audienceLog.status, 401);
      assert.equal(audienceLog.verify, 'aud');
      assert.equal(audienceLog.aud_matched, false);
      assert.equal(audienceLog.azp_present, true);
      assert.equal(audienceLog.azp_equals_client_id, false);
      assert.equal(audienceLog.has_id_token, true);
      assert.equal(audienceLog.token_length, wrongAudienceToken.length);
      assert.equal(audienceLog.kid, 'test-key');
      assert.equal(audienceLog.alg, 'RS256');
      const audienceText = JSON.stringify(audienceLog);
      assert.equal(audienceText.includes(wrongAudienceToken), false);
      assert.equal(audienceText.includes('ada@example.com'), false);
      assert.equal(audienceText.includes('Ada Lovelace'), false);
      assert.equal(audienceText.includes('android-oauth-client'), false);

      const dbError = Object.assign(
        new Error('relation "google_accounts" does not exist for ada@example.com'),
        { code: '42P01' },
      );
      const failedDb = createResponse();
      await handleGoogleNative(
        nativeRequest({ id_token: idToken }, '203.0.113.70'),
        failedDb.res,
        {
          verifyIdToken: deps.verifyIdToken,
          signIn: async () => {
            throw dbError;
          },
        },
      );
      assert.equal(failedDb.result().statusCode, 500);
      assert.equal((failedDb.result().jsonBody as { error?: string }).error, 'google_sign_in_failed');
      const dbLog = loggedGoogleAuth(logs).find((entry) => entry.pg_code === '42P01');
      assert.ok(dbLog);
      assert.equal(dbLog.error, 'google_sign_in_failed');
      assert.match(String(dbLog.pg_message), /google_accounts/);
      assert.equal(String(dbLog.pg_message).includes('ada@example.com'), false);
      assert.equal(JSON.stringify(dbLog).includes(idToken), false);

      const expiredToken = nativeToken({ exp: NOW - 120 });
      const expired = createResponse();
      await handleGoogleNative(nativeRequest({ id_token: expiredToken }, '203.0.113.42'), expired.res, deps);
      assert.equal(expired.result().statusCode, 401);
      assert.equal((expired.result().jsonBody as { error?: string }).error, 'expired');
      assert.equal(JSON.stringify(expired.result().jsonBody).includes(expiredToken), false);
      assert.equal(signedInWith, null);

      const unverifiedToken = nativeToken({ email_verified: false });
      const unverified = createResponse();
      await handleGoogleNative(
        nativeRequest({ id_token: unverifiedToken }, '203.0.113.43'),
        unverified.res,
        deps,
      );
      assert.equal(unverified.result().statusCode, 401);
      assert.equal((unverified.result().jsonBody as { error?: string }).error, 'email_not_verified');
      assert.equal(JSON.stringify(unverified.result().jsonBody).includes(unverifiedToken), false);
      assert.equal(signedInWith, null);

      const tamperedParts = idToken.split('.');
      tamperedParts[1] = base64url(JSON.stringify(claims({ email: 'other@example.com', nonce: undefined })));
      const tamperedToken = tamperedParts.join('.');
      const tampered = createResponse();
      await handleGoogleNative(nativeRequest({ id_token: tamperedToken }, '203.0.113.44'), tampered.res, deps);
      assert.equal(tampered.result().statusCode, 401);
      assert.equal((tampered.result().jsonBody as { error?: string }).error, 'token_invalid');
      assert.equal(signedInWith, null);

      const missingHeader = createResponse();
      await handleGoogleNative(
        nativeRequest({ id_token: idToken }, '203.0.113.46', {}),
        missingHeader.res,
        deps,
      );
      assert.equal(missingHeader.result().statusCode, 400);
      assert.equal((missingHeader.result().jsonBody as { error?: string }).error, 'mobile_client_required');

      const missingToken = createResponse();
      await handleGoogleNative(nativeRequest({}, '203.0.113.47'), missingToken.res, deps);
      assert.equal(missingToken.result().statusCode, 400);
      assert.equal((missingToken.result().jsonBody as { error?: string }).error, 'invalid_token');

      const wrongMethod = createResponse();
      await handleGoogleNative(
        { method: 'GET', query: {}, headers: {}, socket: { remoteAddress: '203.0.113.48' } } as unknown as NextApiRequest,
        wrongMethod.res,
        deps,
      );
      assert.equal(wrongMethod.result().statusCode, 405);

      setEnv('GOOGLE_CLIENT_ID', undefined);
      const disabled = createResponse();
      await handleGoogleNative(nativeRequest({ id_token: idToken }, '203.0.113.49'), disabled.res, deps);
      assert.equal(disabled.result().statusCode, 404);
      assert.equal((disabled.result().jsonBody as { error?: string }).error, 'google_auth_disabled');
      setEnv('GOOGLE_CLIENT_ID', CLIENT_ID);

      const floodAddress = '198.51.100.77';
      for (let attempt = 0; attempt < AUTH_RATE_LIMIT; attempt += 1) {
        assert.equal(allowAuthAttempt(GOOGLE_NATIVE_RATE_ROUTE, floodAddress, Date.now()), true);
      }
      const limitedToken = `limited-${idToken}`;
      const limited = createResponse();
      await handleGoogleNative(nativeRequest({ id_token: limitedToken }, floodAddress), limited.res, deps);
      assert.equal(limited.result().statusCode, 429);
      assert.equal((limited.result().jsonBody as { error?: string }).error, 'rate_limited');
      assert.equal(JSON.stringify(limited.result().jsonBody).includes(limitedToken), false);
      assert.equal(JSON.stringify(limited.result()).includes(limitedToken), false);
    });
    assert.equal(logs.some((line) => line.includes('native-session-token')), false);
    assert.equal(logs.some((line) => line.includes('android-oauth-client')), false);
    assert.equal(logs.some((line) => line.includes('eyJ')), false);
  } finally {
    for (const method of consoleMethods) console[method] = original[method];
    clearGoogleJwksCache();
    resetAuthRateLimits();
  }
}

function proxyRequest(forwardedFor: string): NextApiRequest {
  return {
    socket: { remoteAddress: '10.0.0.8' },
    headers: { 'x-forwarded-for': forwardedFor },
  } as unknown as NextApiRequest;
}

function testAuthRateLimitWindow() {
  resetAuthRateLimits();
  const previous = process.env.TRUST_PROXY;
  try {
    const t0 = 5_000_000;
    assert.equal(allowAuthAttempt('google-native', '203.0.113.1', t0), true);
    assert.equal(allowAuthAttempt('google-native', '203.0.113.2', t0), true);
    assert.equal(authRateLimitBucketCount(), 2);
    assert.equal(allowAuthAttempt('google-native', '203.0.113.3', t0 + AUTH_RATE_WINDOW_MS), true);
    assert.equal(authRateLimitBucketCount(), 1);

    setEnv('TRUST_PROXY', undefined);
    const sharedA = clientAddressFromRequest(proxyRequest('203.0.113.8'));
    const sharedB = clientAddressFromRequest(proxyRequest('198.51.100.9'));
    assert.equal(sharedA, '10.0.0.8');
    assert.equal(sharedB, sharedA);
    resetAuthRateLimits();
    for (let attempt = 0; attempt < AUTH_RATE_LIMIT; attempt += 1) {
      assert.equal(allowAuthAttempt(GOOGLE_NATIVE_RATE_ROUTE, sharedA, t0), true);
    }
    assert.equal(allowAuthAttempt(GOOGLE_NATIVE_RATE_ROUTE, sharedB, t0), false);

    setEnv('TRUST_PROXY', '1');
    const visitorA = clientAddressFromRequest(proxyRequest('203.0.113.8'));
    const visitorB = clientAddressFromRequest(proxyRequest('198.51.100.9'));
    assert.equal(visitorA, '203.0.113.8');
    assert.equal(visitorB, '198.51.100.9');
    resetAuthRateLimits();
    for (let attempt = 0; attempt < AUTH_RATE_LIMIT; attempt += 1) {
      assert.equal(allowAuthAttempt(GOOGLE_NATIVE_RATE_ROUTE, visitorA, t0), true);
    }
    assert.equal(allowAuthAttempt(GOOGLE_NATIVE_RATE_ROUTE, visitorB, t0), true);
    assert.equal(allowAuthAttempt(GOOGLE_NATIVE_RATE_ROUTE, visitorA, t0), false);
  } finally {
    setEnv('TRUST_PROXY', previous);
    resetAuthRateLimits();
  }
}

async function testUnknownKidRefreshThrottle() {
  clearGoogleJwksCache();
  const previous = process.env.GOOGLE_CLIENT_ID;
  setEnv('GOOGLE_CLIENT_ID', CLIENT_ID);
  let fetches = 0;
  const jwksFetch = (async () => {
    fetches += 1;
    return { ok: true, json: async () => ({ keys }) };
  }) as unknown as typeof fetch;
  const token = signToken(claims(), privateKey, { alg: 'RS256', typ: 'JWT', kid: 'missing' });
  const t0 = 1_800_000_000_000;
  try {
    const first = await verifyGoogleNativeIdToken(token, jwksFetch, NOW, t0);
    assert.equal(first.ok, false);
    if (!first.ok) assert.equal(first.error, 'unknown_kid');
    assert.equal(fetches, 2);

    const second = await verifyGoogleNativeIdToken(token, jwksFetch, NOW, t0 + 1_000);
    assert.equal(second.ok, false);
    if (!second.ok) assert.equal(second.error, 'unknown_kid');
    assert.equal(fetches, 2);

    const third = await verifyGoogleNativeIdToken(
      token,
      jwksFetch,
      NOW,
      t0 + GOOGLE_JWKS_UNKNOWN_KID_REFRESH_MS,
    );
    assert.equal(third.ok, false);
    if (!third.ok) assert.equal(third.error, 'unknown_kid');
    assert.equal(fetches, 3);

    const browser = await verifyGoogleIdTokenForClient(
      token,
      'nonce-1',
      jwksFetch,
      t0 + GOOGLE_JWKS_UNKNOWN_KID_REFRESH_MS,
    );
    assert.equal(browser.ok, false);
    if (!browser.ok) assert.equal(browser.error, 'unknown_kid');
    assert.equal(fetches, 3);
  } finally {
    setEnv('GOOGLE_CLIENT_ID', previous);
    clearGoogleJwksCache();
  }
}

function loggedGoogleAuth(lines: string[]): Array<Record<string, unknown>> {
  return lines.flatMap((line) => {
    try {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      return parsed.event === 'google_auth' ? [parsed] : [];
    } catch {
      return [];
    }
  });
}

async function testGoogleDiagnostics() {
  const secretUrl = 'postgres://neondb_owner:s3cret-password@ep-cool.eu-central-1.aws.neon.tech/neondb';
  assert.equal(databaseHost(secretUrl), 'ep-cool.eu-central-1.aws.neon.tech');
  assert.equal(databaseHost(secretUrl)?.includes('s3cret'), false);
  assert.equal(databaseHost(secretUrl)?.includes('neondb_owner'), false);
  assert.equal(databaseHost(''), null);
  assert.equal(databaseHost('not a url'), null);

  const scrubbed = scrubLogText(
    'relation "google_accounts" does not exist for ada@example.com eyJhbGciOi.eyJzdWI.sig postgres://user:s3cret-password@host/db',
  );
  assert.match(scrubbed, /google_accounts/);
  assert.equal(scrubbed.includes('ada@example.com'), false);
  assert.equal(scrubbed.includes('s3cret-password'), false);
  assert.equal(scrubbed.includes('eyJ'), false);
  const roleScrubbed = scrubLogText(
    'password authentication failed for user "neondb_owner" and role "app_owner" does not exist',
  );
  assert.equal(roleScrubbed.includes('neondb_owner'), false);
  assert.equal(roleScrubbed.includes('app_owner'), false);
  assert.match(roleScrubbed, /\[role\]/);

  const described = describeIdToken(
    signToken(claims({ azp: 'android-client', nonce: undefined }), privateKey),
    CLIENT_ID,
  );
  assert.equal(described.has_id_token, true);
  assert.equal(described.kid, 'test-key');
  assert.equal(described.alg, 'RS256');
  assert.equal(described.aud_matched, true);
  assert.equal(described.azp_present, true);
  assert.equal(described.azp_equals_client_id, false);
  assert.equal(JSON.stringify(described).includes('Ada Lovelace'), false);
  assert.equal(JSON.stringify(described).includes('ada@example.com'), false);

  const schemaSql = GOOGLE_SCHEMA_STATEMENTS.join('\n');
  assert.match(schemaSql, /ADD COLUMN IF NOT EXISTS last_sign_in_at/);
  assert.match(schemaSql, /UPDATE users SET last_sign_in_at = NOW\(\) WHERE last_sign_in_at IS NULL/);
  assert.match(schemaSql, /google_accounts/);
  assert.match(schemaSql, /google_mobile_codes/);
  assert.doesNotMatch(schemaSql, /^\s*(DROP|DELETE|TRUNCATE)\b/im);
  let schemaCalls = 0;
  await applyGoogleSchema(async () => {
    schemaCalls += 1;
    if (schemaCalls === 1) {
      const duplicate = new Error('relation already exists') as Error & { code: string };
      duplicate.code = '42P07';
      throw duplicate;
    }
  });
  assert.equal(schemaCalls, GOOGLE_SCHEMA_STATEMENTS.length);
  await assert.rejects(
    applyGoogleSchema(async () => {
      const denied = new Error('permission denied') as Error & { code: string };
      denied.code = '42501';
      throw denied;
    }),
    (error: unknown) => (error as { code?: string }).code === '42501',
  );
  assert.match(readFileSync('lib/googleAccount.ts', 'utf8'), /ensureGoogleSchema\(/);
  assert.match(readFileSync('lib/googleMobileCode.ts', 'utf8'), /ensureGoogleSchema\(/);

  const cache: SchemaCache = { current: null };
  let calls = 0;
  await cachedOnce(cache, async () => {
    calls += 1;
    throw new Error('unavailable');
  }).catch((error: unknown) => {
    assert.equal(error instanceof Error && error.message, 'unavailable');
  });
  assert.equal(cache.current, null);
  assert.equal(calls, 1);
  const again = cachedOnce(cache, async () => {
    calls += 1;
  });
  const third = cachedOnce(cache, async () => {
    calls += 1;
  });
  await Promise.all([again, third]);
  assert.equal(calls, 2);
}

function testDatabaseHostLog() {
  resetGoogleAuthHostLogForTests();
  const previous = process.env.DATABASE_URL;
  const lines: string[] = [];
  const original = console.info;
  console.info = (...args: unknown[]) => {
    lines.push(args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '));
  };
  try {
    setEnv('DATABASE_URL', 'postgres://neondb_owner:s3cret-password@ep-cool.eu-central-1.aws.neon.tech/neondb');
    writeGoogleAuthLog({
      route: 'POST /api/auth/google/native',
      status: 200,
      error: null,
      has_id_token: false,
      token_length: 0,
      kid: null,
      alg: null,
      verify: null,
      aud_matched: null,
      azp_present: null,
      azp_equals_client_id: null,
      error_name: null,
      pg_code: null,
      pg_message: null,
    });
    writeGoogleAuthLog({
      route: 'POST /api/auth/google/native',
      status: 200,
      error: null,
      has_id_token: false,
      token_length: 0,
      kid: null,
      alg: null,
      verify: null,
      aud_matched: null,
      azp_present: null,
      azp_equals_client_id: null,
      error_name: null,
      pg_code: null,
      pg_message: null,
    });
    const hostLines = lines.filter((line) => line.includes('google_auth_db'));
    assert.equal(hostLines.length, 1);
    assert.match(hostLines[0] ?? '', /ep-cool\.eu-central-1\.aws\.neon\.tech/);
    assert.equal((hostLines[0] ?? '').includes('s3cret-password'), false);
    assert.equal((hostLines[0] ?? '').includes('neondb_owner'), false);
    assert.equal(lines.filter((line) => line.includes('"event":"google_auth"')).length, 2);
  } finally {
    console.info = original;
    setEnv('DATABASE_URL', previous);
    resetGoogleAuthHostLogForTests();
  }
}

testIdToken();
testLinkPlan();
testAuthRateLimitWindow();
await testGoogleDiagnostics();
testDatabaseHostLog();
testConfigGate();
await testOAuthHandlers();
await testUnknownKidRefreshThrottle();
await testMobileContract();
await testNativeEndpoint();
testWebButton();
console.log('google auth tests passed');
