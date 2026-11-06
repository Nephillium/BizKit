import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { NextApiRequest, NextApiResponse } from 'next';
import { handleLogin, handleRegister } from '../lib/authHandlers';
import {
  MOBILE_CLIENT_HEADER,
  MOBILE_CLIENT_VALUE,
  clientRequestsSessionToken,
  sessionCookie,
} from '../lib/authResponse';
import { getSessionFromRequest, withAuth } from '../lib/session';
import { generateToken, getUserFromRequest, type User } from '../lib/users';
import logoutHandler from '../pages/api/auth/logout';

// mobile/package.json is CommonJS, so a static ESM import cannot see its named exports.
const {
  generateContent,
  getAuthToken,
  getMe,
  login,
  register,
  setApiBaseUrl,
  setAuthToken,
} = createRequire(import.meta.url)('../mobile/src/lib/api.ts') as typeof import('../mobile/src/lib/api');

const SESSION_TOKEN = 'session-token-should-stay-in-cookie';

function setEnv(name: string, value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[name];
  else env[name] = value;
}

function createResponse() {
  let statusCode = 0;
  let jsonBody: unknown;
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
  };
  return {
    res: res as unknown as NextApiResponse,
    result() {
      return {
        statusCode,
        jsonBody,
        setCookie: headers.get('set-cookie'),
      };
    },
  };
}

function createRequest(
  body: unknown,
  headers: Record<string, string | string[] | undefined> = {},
  method = 'POST',
): NextApiRequest {
  return { method, body, headers } as NextApiRequest;
}

function mobileHeaders(): Record<string, string> {
  return { [MOBILE_CLIENT_HEADER]: MOBILE_CLIENT_VALUE };
}

const registeredUser: User = {
  id: 'user-1',
  email: 'ada@example.com',
  password_hash: 'hashed-password-must-not-leak',
  role: 'user',
  credits: 5,
  usage_count: 0,
  created_at: new Date('2026-01-01T00:00:00.000Z'),
};

function testClientHeaderMatching() {
  assert.equal(clientRequestsSessionToken(undefined), false);
  assert.equal(clientRequestsSessionToken({}), false);
  assert.equal(clientRequestsSessionToken({ [MOBILE_CLIENT_HEADER]: '' }), false);
  assert.equal(clientRequestsSessionToken({ [MOBILE_CLIENT_HEADER]: 'web' }), false);
  assert.equal(clientRequestsSessionToken({ [MOBILE_CLIENT_HEADER]: 'mobile-web' }), false);
  assert.equal(clientRequestsSessionToken({ [MOBILE_CLIENT_HEADER]: 'mobile, web' }), false);
  assert.equal(clientRequestsSessionToken({ [MOBILE_CLIENT_HEADER]: ['mobile', 'web'] }), false);
  assert.equal(clientRequestsSessionToken({ [MOBILE_CLIENT_HEADER]: ' Mobile ' }), true);
  assert.equal(clientRequestsSessionToken({ [MOBILE_CLIENT_HEADER]: 'MOBILE' }), true);
}

function testCookieFlags() {
  const previous = process.env.NODE_ENV;
  try {
    setEnv('NODE_ENV', 'development');
    const devCookie = sessionCookie(SESSION_TOKEN);
    assert.match(devCookie, new RegExp(`^bizkit_token=${SESSION_TOKEN};`));
    assert.match(devCookie, /HttpOnly/);
    assert.match(devCookie, /SameSite=Lax/);
    assert.match(devCookie, /Path=\//);
    assert.match(devCookie, /Max-Age=604800/);
    assert.doesNotMatch(devCookie, /Secure/);

    setEnv('NODE_ENV', 'production');
    const prodCookie = sessionCookie(SESSION_TOKEN);
    assert.match(prodCookie, /Secure/);
    assert.match(prodCookie, /HttpOnly/);

    const cleared = sessionCookie('', 0);
    assert.match(cleared, /^bizkit_token=;/);
    assert.match(cleared, /Max-Age=0/);
    assert.match(cleared, /HttpOnly/);
  } finally {
    setEnv('NODE_ENV', previous);
  }
}

async function testLoginHidesTokenUnlessMobileAsks() {
  let calls = 0;
  const authenticate = async (email: string, password: string) => {
    calls += 1;
    assert.equal(email, 'ada@example.com');
    assert.equal(password, 'correct-password');
    return {
      token: SESSION_TOKEN,
      user: {
        id: registeredUser.id,
        email: registeredUser.email,
        role: registeredUser.role,
        credits: registeredUser.credits,
        usage_count: registeredUser.usage_count,
        created_at: registeredUser.created_at,
      },
    };
  };

  const web = createResponse();
  await handleLogin(
    createRequest(
      { email: 'ada@example.com', password: 'correct-password', returnToken: true, client: 'mobile' },
    ),
    web.res,
    authenticate,
  );
  const webResult = web.result();
  assert.equal(webResult.statusCode, 200);
  assert.equal(calls, 1);
  const webBody = webResult.jsonBody as { ok: boolean; user: { email: string }; token?: string };
  assert.equal(webBody.ok, true);
  assert.equal(webBody.user.email, 'ada@example.com');
  assert.equal(Object.hasOwn(webBody, 'token'), false);
  assert.equal(JSON.stringify(webBody).includes(SESSION_TOKEN), false);
  assert.match(String(webResult.setCookie), new RegExp(`bizkit_token=${SESSION_TOKEN}`));
  assert.match(String(webResult.setCookie), /HttpOnly/);

  const mobile = createResponse();
  await handleLogin(
    createRequest(
      { email: 'ada@example.com', password: 'correct-password' },
      { 'x-bizkit-client': 'Mobile' },
    ),
    mobile.res,
    authenticate,
  );
  const mobileResult = mobile.result();
  const mobileBody = mobileResult.jsonBody as { ok: boolean; token?: string };
  assert.equal(mobileResult.statusCode, 200);
  assert.equal(mobileBody.token, SESSION_TOKEN);
  assert.match(String(mobileResult.setCookie), /HttpOnly/);
  assert.match(String(mobileResult.setCookie), new RegExp(`bizkit_token=${SESSION_TOKEN}`));

  const rejected = createResponse();
  await handleLogin(
    createRequest({ email: 'ada@example.com', password: 'wrong-password' }, mobileHeaders()),
    rejected.res,
    async () => ({ error: 'Invalid email or password' }),
  );
  assert.equal(rejected.result().statusCode, 401);
  assert.equal(rejected.result().setCookie, undefined);
  assert.equal(JSON.stringify(rejected.result().jsonBody).includes(SESSION_TOKEN), false);

  const missing = createResponse();
  await handleLogin(createRequest({ email: 'ada@example.com' }, mobileHeaders()), missing.res, async () => {
    throw new Error('should not authenticate');
  });
  assert.equal(missing.result().statusCode, 400);
  assert.equal(missing.result().setCookie, undefined);

  const wrongMethod = createResponse();
  await handleLogin(createRequest({}, mobileHeaders(), 'GET'), wrongMethod.res, async () => {
    throw new Error('should not authenticate');
  });
  assert.equal(wrongMethod.result().statusCode, 405);
}

async function testRegisterHidesTokenUnlessMobileAsks() {
  const deps = {
    registerUser: async () => registeredUser,
    generateToken: (user: { id: string; email: string; role: 'user' | 'admin' }) => {
      assert.equal(user.id, registeredUser.id);
      return SESSION_TOKEN;
    },
  };

  const web = createResponse();
  await handleRegister(
    createRequest({ email: 'ada@example.com', password: 'long-password', includeToken: true }),
    web.res,
    deps,
  );
  const webBody = web.result().jsonBody as { user: User; token?: string };
  assert.equal(web.result().statusCode, 200);
  assert.equal(Object.hasOwn(webBody, 'token'), false);
  assert.equal(Object.hasOwn(webBody.user, 'password_hash'), false);
  assert.equal(JSON.stringify(webBody).includes(SESSION_TOKEN), false);
  assert.equal(JSON.stringify(webBody).includes('hashed-password-must-not-leak'), false);
  assert.match(String(web.result().setCookie), /HttpOnly/);
  assert.match(String(web.result().setCookie), new RegExp(`bizkit_token=${SESSION_TOKEN}`));

  const mobile = createResponse();
  await handleRegister(
    createRequest({ email: 'ada@example.com', password: 'long-password' }, mobileHeaders()),
    mobile.res,
    deps,
  );
  const mobileBody = mobile.result().jsonBody as { token?: string; user: { email: string } };
  assert.equal(mobileBody.token, SESSION_TOKEN);
  assert.equal(mobileBody.user.email, 'ada@example.com');
  assert.equal(JSON.stringify(mobileBody).includes('hashed-password-must-not-leak'), false);

  const short = createResponse();
  await handleRegister(
    createRequest({ email: 'ada@example.com', password: 'short' }, mobileHeaders()),
    short.res,
    {
      registerUser: async () => {
        throw new Error('should not register');
      },
      generateToken: () => {
        throw new Error('should not sign');
      },
    },
  );
  assert.equal(short.result().statusCode, 400);
  assert.equal(short.result().setCookie, undefined);
}

async function testLogoutClearsCookie() {
  const previous = process.env.NODE_ENV;
  try {
    setEnv('NODE_ENV', 'development');
    const captured = createResponse();
    await logoutHandler(createRequest({}), captured.res);
    const cookie = String(captured.result().setCookie);
    assert.equal(captured.result().statusCode, 200);
    assert.match(cookie, /^bizkit_token=;/);
    assert.match(cookie, /Max-Age=0/);
    assert.match(cookie, /HttpOnly/);
    assert.doesNotMatch(cookie, /Secure/);
  } finally {
    setEnv('NODE_ENV', previous);
  }
}

async function testBearerStillAuthenticates() {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSecret = process.env.JWT_SECRET;
  try {
    setEnv('NODE_ENV', 'development');
    setEnv('JWT_SECRET', 'test-only-jwt-secret-not-a-credential');
    const token = generateToken({ id: 'user-1', email: 'ada@example.com', role: 'user' });

    const fromBearer = getUserFromRequest(undefined, `Bearer ${token}`);
    assert.equal(fromBearer?.id, 'user-1');
    assert.equal(fromBearer?.email, 'ada@example.com');

    const fromCookie = getUserFromRequest(`bizkit_token=${token}`);
    assert.equal(fromCookie?.id, 'user-1');

    const fromSession = getSessionFromRequest({
      headers: { authorization: `Bearer ${token}` },
    } as NextApiRequest);
    assert.equal(fromSession?.email, 'ada@example.com');

    let seenEmail = '';
    const handler = withAuth(async (_req, _res, user) => {
      seenEmail = user.email;
    });
    const allowed = createResponse();
    await handler(createRequest(undefined, { authorization: `Bearer ${token}` }, 'GET'), allowed.res);
    assert.equal(seenEmail, 'ada@example.com');
    assert.equal(allowed.result().statusCode, 0);

    const denied = createResponse();
    await handler(createRequest(undefined, {}, 'GET'), denied.res);
    assert.equal(denied.result().statusCode, 401);
    assert.equal((denied.result().jsonBody as { message: string }).message, 'Unauthorized');
  } finally {
    setEnv('NODE_ENV', previousNodeEnv);
    setEnv('JWT_SECRET', previousSecret);
  }
}

async function testExpoClientAsksForTokenAndSendsBearer() {
  setApiBaseUrl('http://api.test');
  setAuthToken(null);
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; headers: Headers; body: string | undefined }> = [];

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const url = String(input);
    calls.push({ url, headers, body: typeof init?.body === 'string' ? init.body : undefined });
    if (url.endsWith('/api/auth/login') || url.endsWith('/api/auth/register')) {
      assert.equal(headers.get('x-bizkit-client'), 'mobile');
      assert.equal(headers.get('content-type'), 'application/json');
      const payload = JSON.parse(calls[calls.length - 1].body || '{}') as Record<string, unknown>;
      assert.equal(payload.email, 'ada@example.com');
      assert.equal('token' in payload, false);
      assert.equal('returnToken' in payload, false);
      return new Response(
        JSON.stringify({
          ok: true,
          token: 'mobile-bearer-token',
          user: { id: 1, email: 'ada@example.com', role: 'user', credits: 5 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    return new Response(
      JSON.stringify({
        ok: true,
        output: 'draft',
        user: { id: 1, email: 'ada@example.com', role: 'user', credits: 5 },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  };

  try {
    const loggedIn = await login('ada@example.com', 'long-password');
    assert.equal(loggedIn.success, true);
    assert.equal(loggedIn.token, 'mobile-bearer-token');
    assert.equal(getAuthToken(), 'mobile-bearer-token');

    const me = await getMe();
    assert.equal(me.success, true);
    const meCall = calls.find((call) => call.url.endsWith('/api/auth/me'));
    assert.ok(meCall);
    assert.equal(meCall.headers.get('authorization'), 'Bearer mobile-bearer-token');
    assert.equal(meCall.headers.get('x-bizkit-client'), null);

    const generated = await generateContent({
      tool: 'cold_email',
      inputs: { target: 'owners', service: 'support', tone: 'warm', language: 'English' },
    });
    assert.equal(generated.content, 'draft');
    const generateCall = calls.find((call) => call.url.endsWith('/api/generate'));
    assert.ok(generateCall);
    assert.equal(generateCall.headers.get('authorization'), 'Bearer mobile-bearer-token');

    setAuthToken(null);
    calls.length = 0;
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      assert.equal(String(input).endsWith('/api/auth/register'), true);
      assert.equal(headers.get('x-bizkit-client'), 'mobile');
      assert.equal(headers.get('authorization'), null);
      return new Response(
        JSON.stringify({ ok: true, user: { id: 1, email: 'ada@example.com', role: 'user', credits: 0 } }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    };
    const missingToken = await register('ada@example.com', 'long-password');
    assert.equal(missingToken.success, false);
    assert.equal(missingToken.error, 'Registration did not return a session token');
    assert.equal(getAuthToken(), null);
  } finally {
    globalThis.fetch = originalFetch;
    setAuthToken(null);
  }
}

function testWebClientDoesNotAskForToken() {
  const webAuth = readFileSync('hooks/useAuth.ts', 'utf8');
  assert.equal(webAuth.includes('X-BizKit-Client'), false);
  assert.equal(webAuth.includes('x-bizkit-client'), false);
  assert.match(webAuth, /credentials:\s*'include'/);

  const loginPage = readFileSync('pages/api/auth/login.ts', 'utf8');
  const registerPage = readFileSync('pages/api/auth/register.ts', 'utf8');
  assert.match(loginPage, /return handleLogin\(req, res\)/);
  assert.match(registerPage, /return handleRegister\(req, res\)/);
  assert.doesNotMatch(loginPage, /token/);
  assert.doesNotMatch(registerPage, /token/);

  const checkout = readFileSync('pages/api/stripe/create-checkout.ts', 'utf8');
  assert.match(
    checkout,
    /getUserFromRequest\(req\.headers\.cookie,\s*req\.headers\.authorization\)/,
  );
}

testClientHeaderMatching();
testCookieFlags();
await testLoginHidesTokenUnlessMobileAsks();
await testRegisterHidesTokenUnlessMobileAsks();
await testLogoutClearsCookie();
await testBearerStillAuthenticates();
await testExpoClientAsksForTokenAndSendsBearer();
testWebClientDoesNotAskForToken();
console.log('auth-session tests passed');
