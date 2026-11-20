import assert from 'node:assert/strict';
import { createSign, generateKeyPairSync, type KeyObject } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { NextApiRequest, NextApiResponse } from 'next';
import { CONTINUE_WITH_GOOGLE_LABEL } from '../components/ContinueWithGoogle';
import { planGoogleLink } from '../lib/googleAccount';
import { handleGoogleCallback, handleGoogleStart } from '../lib/googleAuthHandlers';
import { googleSignInErrorMessage } from '../lib/googleAuthCopy';
import {
  GOOGLE_ISSUERS,
  GOOGLE_SCOPE_PARAM,
  verifyGoogleIdToken,
  type GoogleJwk,
} from '../lib/googleIdToken';
import {
  GOOGLE_MOBILE_CALLBACK,
  googleAuthConfigured,
  googleRedirectUri,
  pkceChallenge,
  readGoogleOAuthState,
  readOAuthCookie,
} from '../lib/googleOAuth';
import { publicRuntimeConfig } from '../lib/runtimeConfig';

const require = createRequire(import.meta.url);
const {
  GOOGLE_MOBILE_CALLBACK: mobileCallback,
  appGoogleAuthEnabled,
  googleButtonVisible,
  googleMobileErrorMessage,
  readGoogleMobileResult,
  resolveGoogleRedirectUri,
} = require('../mobile/src/lib/googleRedirect.ts') as typeof import('../mobile/src/lib/googleRedirect');

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

    const mobileStart = createResponse();
    await handleGoogleStart(
      { method: 'GET', query: { client: 'mobile', return_to: 'account-delete' }, headers: {} } as unknown as NextApiRequest,
      mobileStart.res,
    );
    const mobileCookie = cookiePair(mobileStart.result().setCookie);
    const mobileFlow = readGoogleOAuthState(readOAuthCookie(mobileCookie) ?? '');
    assert.ok(mobileFlow);
    assert.equal(mobileFlow.client, 'mobile');
    assert.equal(mobileFlow.returnTo, 'home');
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
      },
    );
    const mobileResult = mobile.result();
    assert.equal(mobileResult.statusCode, 302);
    const returned = new URL(String(mobileResult.location));
    assert.equal(`${returned.protocol}//${returned.host}${returned.pathname}`, GOOGLE_MOBILE_CALLBACK);
    assert.equal(returned.searchParams.get('token'), 'mobile-bearer-token');
    assert.equal(returned.searchParams.get('created'), '1');
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
      },
    );
    assert.equal(denied.result().location, '/?google_error=access_denied');
    assert.equal(googleSignInErrorMessage('access_denied'), 'Google sign-in was cancelled.');
    assert.equal(googleSignInErrorMessage('not-a-real-code'), 'Google sign-in failed. Try again.');
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

function testMobileContract() {
  assert.equal(appGoogleAuthEnabled(undefined), false);
  assert.equal(appGoogleAuthEnabled(''), false);
  assert.equal(appGoogleAuthEnabled('true'), false);
  assert.equal(appGoogleAuthEnabled('1'), true);
  assert.equal(googleButtonVisible(false, true), false);
  assert.equal(googleButtonVisible(true, false), false);
  assert.equal(googleButtonVisible(true, true), true);
  assert.equal(resolveGoogleRedirectUri('exp://127.0.0.1:8081/--/auth/google'), GOOGLE_MOBILE_CALLBACK);
  assert.equal(resolveGoogleRedirectUri(GOOGLE_MOBILE_CALLBACK), GOOGLE_MOBILE_CALLBACK);

  const success = readGoogleMobileResult('pitchcrafter://auth/google?token=abc.def.ghi&created=1');
  assert.equal(success.kind, 'success');
  if (success.kind === 'success') {
    assert.equal(success.token, 'abc.def.ghi');
    assert.equal(success.created, true);
  }
  const failed = readGoogleMobileResult('pitchcrafter://auth/google?error=email_not_verified&token=nope');
  assert.equal(failed.kind, 'error');
  if (failed.kind === 'error') {
    assert.equal(failed.error, googleMobileErrorMessage('email_not_verified'));
    assert.equal(failed.error.includes('nope'), false);
  }
  assert.equal(readGoogleMobileResult('https://evil.example/auth/google?token=abc').kind, 'ignore');
  assert.equal(googleMobileErrorMessage('<script>'), 'Google sign-in failed. Try again.');

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
  assert.match(appJson, /"versionCode": 4/);
  assert.match(appConfig, /EXPO_PUBLIC_GOOGLE_AUTH/);
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

testIdToken();
testLinkPlan();
testConfigGate();
await testOAuthHandlers();
testMobileContract();
testWebButton();
console.log('google auth tests passed');
