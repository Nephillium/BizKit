import assert from 'node:assert/strict';
import { randomBytes, randomInt } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import type { NextApiRequest } from 'next';
import { signInWithGoogleProfile } from '../../lib/googleAccount';
import { hashMobileCode, redeemMobileAuthCode, saveMobileAuthCode } from '../../lib/googleMobileCode';
import { createPkceVerifier, pkceChallenge } from '../../lib/googleOAuth';
import { anonymousSubject } from '../../lib/anonymousQuota';
import { pool, query } from '../../lib/db';
import { initSchema } from '../../lib/initSchema';
import { MOBILE_CLIENT_HEADER, MOBILE_CLIENT_VALUE } from '../../lib/authResponse';
import {
  AI_NOT_CONFIGURED_ERROR,
  AI_NOT_CONFIGURED_MESSAGE,
} from '../../lib/runtimeConfig';
import exchangeHandler from '../../pages/api/auth/google/exchange';
import loginHandler from '../../pages/api/auth/login';
import logoutHandler from '../../pages/api/auth/logout';
import meHandler from '../../pages/api/auth/me';
import registerHandler from '../../pages/api/auth/register';
import generateHandler from '../../pages/api/generate';
import generationByIdHandler from '../../pages/api/generations/[id]';
import generationsHandler from '../../pages/api/generations/index';
import checkoutHandler from '../../pages/api/stripe/create-checkout';
import deleteAccountHandler from '../../pages/api/account/delete';
import { cookieHeaderFromSetCookie, invoke } from './invoke';

const coldEmail = {
  tool: 'cold_email',
  inputs: {
    target: 'clinic owners',
    service: 'recall reminders',
    tone: 'warm',
    language: 'English',
  },
};

const ENV_KEYS = [
  'NODE_ENV',
  'DEMO_MODE',
  'HUGGINGFACE_API_KEY',
  'LMSTUDIO_API_URL',
  'LMSTUDIO_MODEL',
  'AI_PROVIDER',
  'AI_MODEL',
  'AI_BASE_URL',
  'AI_API_KEY',
  'OPENAI_API_KEY',
  'TRUST_PROXY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const;

function setEnv(name: string, value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[name];
  else env[name] = value;
}

function snapshotEnv() {
  const previous: Record<string, string | undefined> = {};
  for (const name of ENV_KEYS) previous[name] = process.env[name];
  return {
    restore() {
      for (const name of ENV_KEYS) setEnv(name, previous[name]);
    },
  };
}

function subjectFor(remoteAddress: string): string {
  return anonymousSubject({
    socket: { remoteAddress },
    headers: {},
  } as NextApiRequest);
}

function documentationAddress(): string {
  return `203.0.113.${randomInt(1, 254)}`;
}

function sessionToken(setCookie: string | string[] | undefined): string {
  const pair = cookieHeaderFromSetCookie(setCookie);
  const value = pair.slice(pair.indexOf('=') + 1);
  assert.ok(value.length > 0, 'session cookie was empty');
  return value;
}

function assertWebSession(body: { token?: unknown }, token: string) {
  assert.equal(Object.hasOwn(body, 'token'), false);
  assert.equal(JSON.stringify(body).includes(token), false);
}

async function deleteSubject(remoteAddress: string) {
  await query('DELETE FROM anonymous_generations WHERE subject_hash = $1', [
    subjectFor(remoteAddress),
  ]);
}

async function deleteUser(email: string) {
  await query('DELETE FROM users WHERE email = $1', [email.toLowerCase()]);
}

before(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Start Postgres and run npm run test:api.');
  }
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || '';
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters for production API tests.');
  }
  await initSchema();
});

after(async () => {
  await pool.end();
});

describe('POST /api/generate', () => {
  test('anonymous free generation is stored server-side and is not reset by cookies', async () => {
    const env = snapshotEnv();
    const remoteAddress = documentationAddress();
    const otherAddress = `198.51.100.${randomInt(1, 254)}`;
    try {
      setEnv('NODE_ENV', 'production');
      setEnv('DEMO_MODE', '1');
      setEnv('HUGGINGFACE_API_KEY', undefined);
      setEnv('LMSTUDIO_API_URL', undefined);
      setEnv('OPENAI_API_KEY', undefined);
      setEnv('TRUST_PROXY', undefined);
      await deleteSubject(remoteAddress);
      await deleteSubject(otherAddress);

      const first = await invoke(generateHandler, {
        method: 'POST',
        body: coldEmail,
        remoteAddress,
        headers: { cookie: 'free_generation=0; bizkit_seen=yes' },
      });
      assert.equal(first.status, 200);
      assert.equal(first.body.ok, true);
      assert.match(String(first.body.output), /Demo mode — sample output/);
      assert.match(String(first.body.output), /clinic owners/);

      const stored = await query(
        'SELECT subject_hash FROM anonymous_generations WHERE subject_hash = $1',
        [subjectFor(remoteAddress)]
      );
      assert.equal(stored.length, 1);

      const clearedCookie = await invoke(generateHandler, {
        method: 'POST',
        body: coldEmail,
        remoteAddress,
        headers: {},
      });
      assert.equal(clearedCookie.status, 403);
      assert.equal(clearedCookie.body.ok, false);
      assert.equal(clearedCookie.body.freeUsed, true);
      assert.equal(clearedCookie.body.requiresLogin, true);
      assert.equal(clearedCookie.body.output, undefined);

      const spoofed = await invoke(generateHandler, {
        method: 'POST',
        body: coldEmail,
        remoteAddress,
        headers: {
          cookie: 'bizkit_token=not-a-session; freeUsed=false',
          'x-forwarded-for': '198.51.100.20',
        },
      });
      assert.equal(spoofed.status, 403);
      assert.equal(spoofed.body.freeUsed, true);

      const stillOne = await query(
        'SELECT subject_hash FROM anonymous_generations WHERE subject_hash = $1',
        [subjectFor(remoteAddress)]
      );
      assert.equal(stillOne.length, 1);

      const other = await invoke(generateHandler, {
        method: 'POST',
        body: coldEmail,
        remoteAddress: otherAddress,
      });
      assert.equal(other.status, 200);
      assert.equal(other.body.ok, true);
    } finally {
      await deleteSubject(remoteAddress);
      await deleteSubject(otherAddress);
      env.restore();
    }
  });

  test('a signed-in caller is not stopped by the anonymous quota on the same address', async () => {
    const env = snapshotEnv();
    const remoteAddress = documentationAddress();
    const email = `quota-${randomBytes(6).toString('hex')}@example.com`;
    const password = 'quota-test-password';
    try {
      setEnv('NODE_ENV', 'production');
      setEnv('DEMO_MODE', '1');
      setEnv('HUGGINGFACE_API_KEY', undefined);
      setEnv('LMSTUDIO_API_URL', undefined);
      setEnv('OPENAI_API_KEY', undefined);
      setEnv('TRUST_PROXY', undefined);
      await deleteSubject(remoteAddress);

      const anonymous = await invoke(generateHandler, {
        method: 'POST',
        body: coldEmail,
        remoteAddress,
      });
      assert.equal(anonymous.status, 200);

      const refused = await invoke(generateHandler, {
        method: 'POST',
        body: coldEmail,
        remoteAddress,
      });
      assert.equal(refused.status, 403);
      assert.equal(refused.body.freeUsed, true);

      const registered = await invoke(registerHandler, {
        method: 'POST',
        body: { email, password },
        remoteAddress,
      });
      assert.equal(registered.status, 200);
      const userId = registered.body.user.id as string;
      assertWebSession(registered.body, sessionToken(registered.headers['set-cookie']));
      await query('UPDATE users SET credits = 2, usage_count = 0 WHERE id = $1', [userId]);
      const cookie = cookieHeaderFromSetCookie(registered.headers['set-cookie']);

      const first = await invoke(generateHandler, {
        method: 'POST',
        body: coldEmail,
        remoteAddress,
        headers: { cookie },
      });
      assert.equal(first.status, 200);
      const second = await invoke(generateHandler, {
        method: 'POST',
        body: coldEmail,
        remoteAddress,
        headers: { cookie },
      });
      assert.equal(second.status, 200);

      const rows = await query<{ credits: number; usage_count: number }>(
        'SELECT credits, usage_count FROM users WHERE id = $1',
        [userId]
      );
      assert.equal(rows[0]?.credits, 0);
      assert.equal(rows[0]?.usage_count, 2);
    } finally {
      await deleteSubject(remoteAddress);
      await deleteUser(email);
      env.restore();
    }
  });

  test('production without a provider returns 503 ai_not_configured and charges nothing', async () => {
    const env = snapshotEnv();
    const email = `gate-${randomBytes(6).toString('hex')}@example.com`;
    const password = 'gate-test-password';
    const remoteAddress = '192.0.2.44';
    try {
      setEnv('NODE_ENV', 'production');
      setEnv('DEMO_MODE', undefined);
      setEnv('HUGGINGFACE_API_KEY', undefined);
      setEnv('LMSTUDIO_API_URL', undefined);
      setEnv('AI_PROVIDER', undefined);
      setEnv('AI_MODEL', undefined);
      setEnv('AI_BASE_URL', undefined);
      setEnv('AI_API_KEY', undefined);
      setEnv('OPENAI_API_KEY', undefined);

      const registered = await invoke(registerHandler, {
        method: 'POST',
        body: { email, password },
      });
      assert.equal(registered.status, 200);
      const userId = registered.body.user.id as string;
      assertWebSession(registered.body, sessionToken(registered.headers['set-cookie']));
      await query('UPDATE users SET credits = 4, usage_count = 0 WHERE id = $1', [userId]);
      const cookie = cookieHeaderFromSetCookie(registered.headers['set-cookie']);
      await deleteSubject(remoteAddress);

      const blocked = await invoke(generateHandler, {
        method: 'POST',
        body: coldEmail,
        headers: { cookie },
        remoteAddress,
      });
      assert.equal(blocked.status, 503);
      assert.equal(blocked.body.ok, false);
      assert.equal(blocked.body.error, AI_NOT_CONFIGURED_ERROR);
      assert.equal(blocked.body.error, 'ai_not_configured');
      assert.equal(blocked.body.message, AI_NOT_CONFIGURED_MESSAGE);
      assert.equal(blocked.body.output, undefined);

      const anonymous = await invoke(generateHandler, {
        method: 'POST',
        body: coldEmail,
        remoteAddress,
      });
      assert.equal(anonymous.status, 503);
      assert.equal(anonymous.body.error, 'ai_not_configured');
      const claims = await query(
        'SELECT subject_hash FROM anonymous_generations WHERE subject_hash = $1',
        [subjectFor(remoteAddress)]
      );
      assert.equal(claims.length, 0);

      const untouched = await query<{ credits: number; usage_count: number }>(
        'SELECT credits, usage_count FROM users WHERE id = $1',
        [userId]
      );
      assert.equal(untouched[0]?.credits, 4);
      assert.equal(untouched[0]?.usage_count, 0);
      const transactions = await query(
        'SELECT amount FROM credit_transactions WHERE user_id = $1',
        [userId]
      );
      assert.equal(transactions.length, 0);
      const generations = await query('SELECT id FROM generations WHERE user_id = $1', [userId]);
      assert.equal(generations.length, 0);

      setEnv('DEMO_MODE', '1');
      setEnv('LMSTUDIO_API_URL', 'http://127.0.0.1:9/v1');
      const sample = await invoke(generateHandler, {
        method: 'POST',
        body: coldEmail,
        headers: { cookie },
        remoteAddress,
      });
      assert.equal(sample.status, 200);
      assert.equal(sample.body.ok, true);
      assert.match(String(sample.body.output), /Demo mode — sample output/);
      assert.match(String(sample.body.output), /recall reminders/);

      const charged = await query<{ credits: number; usage_count: number }>(
        'SELECT credits, usage_count FROM users WHERE id = $1',
        [userId]
      );
      assert.equal(charged[0]?.credits, 3);
      assert.equal(charged[0]?.usage_count, 1);
      const charge = await query<{ amount: number; reason: string }>(
        'SELECT amount, reason FROM credit_transactions WHERE user_id = $1',
        [userId]
      );
      assert.equal(charge.length, 1);
      assert.equal(charge[0]?.amount, -1);
      assert.equal(charge[0]?.reason, 'generation');
      const saved = await query('SELECT id FROM generations WHERE user_id = $1', [userId]);
      assert.equal(saved.length, 1);
    } finally {
      await deleteSubject(remoteAddress);
      await deleteUser(email);
      env.restore();
    }
  });
});

describe('auth', () => {
  test('signup, login, and logout, and protected routes reject anonymous callers', async () => {
    const env = snapshotEnv();
    const email = `Auth-${randomBytes(6).toString('hex')}@Example.com`;
    const password = 'auth-test-password';
    try {
      setEnv('NODE_ENV', 'production');
      setEnv('STRIPE_SECRET_KEY', undefined);
      setEnv('STRIPE_WEBHOOK_SECRET', undefined);

      const me = await invoke(meHandler, { method: 'GET' });
      assert.equal(me.status, 401);
      assert.equal(me.body.ok, false);

      const history = await invoke(generationsHandler, { method: 'GET' });
      assert.equal(history.status, 401);
      assert.equal(history.body.error, 'not_authenticated');

      const save = await invoke(generationsHandler, {
        method: 'POST',
        body: { toolType: 'cold_email', inputs: {}, output: 'nope' },
      });
      assert.equal(save.status, 401);

      const remove = await invoke(generationByIdHandler, {
        method: 'DELETE',
        query: { id: '1' },
      });
      assert.equal(remove.status, 401);
      assert.equal(remove.body.error, 'not_authenticated');

      const checkout = await invoke(checkoutHandler, {
        method: 'POST',
        body: { packageId: 'credits_10' },
        headers: { authorization: 'Bearer not-a-token' },
      });
      assert.equal(checkout.status, 401);
      assert.equal(checkout.body.error, 'not_authenticated');

      const shortPassword = await invoke(registerHandler, {
        method: 'POST',
        body: { email, password: 'short' },
      });
      assert.equal(shortPassword.status, 400);

      const registered = await invoke(registerHandler, {
        method: 'POST',
        body: { email, password, returnToken: true, client: 'mobile' },
      });
      assert.equal(registered.status, 200);
      assert.equal(registered.body.ok, true);
      assert.equal(registered.body.user.email, email.toLowerCase());
      assert.equal(registered.body.user.role, 'user');
      assert.equal(registered.body.user.credits, 0);
      assert.equal(registered.body.user.password_hash, undefined);
      const cookie = cookieHeaderFromSetCookie(registered.headers['set-cookie']);
      assert.match(cookie, /^bizkit_token=\S+/);
      assertWebSession(registered.body, sessionToken(registered.headers['set-cookie']));

      const meCookie = await invoke(meHandler, { method: 'GET', headers: { cookie } });
      assert.equal(meCookie.status, 200);
      assert.equal(meCookie.body.user.email, email.toLowerCase());

      const ownHistory = await invoke(generationsHandler, {
        method: 'GET',
        headers: { cookie },
      });
      assert.equal(ownHistory.status, 200);
      assert.ok(Array.isArray(ownHistory.body));
      assert.equal(ownHistory.body.length, 0);

      const checkoutCookie = await invoke(checkoutHandler, {
        method: 'POST',
        body: { packageId: 'credits_10' },
        headers: { cookie },
      });
      assert.equal(checkoutCookie.status, 503);
      assert.equal(checkoutCookie.body.error, 'stripe_not_configured');

      const loggedOut = await invoke(logoutHandler, {
        method: 'POST',
        headers: { cookie },
      });
      assert.equal(loggedOut.status, 200);
      assert.equal(loggedOut.body.ok, true);
      const cleared = cookieHeaderFromSetCookie(loggedOut.headers['set-cookie']);
      assert.equal(cleared, 'bizkit_token=');

      const afterLogout = await invoke(meHandler, { method: 'GET' });
      assert.equal(afterLogout.status, 401);
      const emptyCookie = await invoke(meHandler, {
        method: 'GET',
        headers: { cookie: cleared },
      });
      assert.equal(emptyCookie.status, 401);

      const wrongPassword = await invoke(loginHandler, {
        method: 'POST',
        body: { email, password: 'wrong-password-value' },
      });
      assert.equal(wrongPassword.status, 401);
      assert.equal(wrongPassword.headers['set-cookie'], undefined);

      const login = await invoke(loginHandler, {
        method: 'POST',
        body: { email: email.toUpperCase(), password, returnToken: true },
      });
      assert.equal(login.status, 200);
      assert.equal(login.body.user.email, email.toLowerCase());
      const loginCookie = cookieHeaderFromSetCookie(login.headers['set-cookie']);
      assertWebSession(login.body, sessionToken(login.headers['set-cookie']));
      const meAgain = await invoke(meHandler, {
        method: 'GET',
        headers: { cookie: loginCookie },
      });
      assert.equal(meAgain.status, 200);
      assert.equal(meAgain.body.user.email, email.toLowerCase());

      const mobileLogin = await invoke(loginHandler, {
        method: 'POST',
        body: { email, password },
        headers: { [MOBILE_CLIENT_HEADER]: MOBILE_CLIENT_VALUE },
      });
      assert.equal(mobileLogin.status, 200);
      const mobileToken = sessionToken(mobileLogin.headers['set-cookie']);
      assert.equal(mobileLogin.body.token, mobileToken);
      assert.equal(mobileLogin.body.user.email, email.toLowerCase());

      const meBearer = await invoke(meHandler, {
        method: 'GET',
        headers: { authorization: `Bearer ${mobileToken}` },
      });
      assert.equal(meBearer.status, 200);
      assert.equal(meBearer.body.user.id, registered.body.user.id);

      const bearerHistory = await invoke(generationsHandler, {
        method: 'GET',
        headers: { authorization: `Bearer ${mobileToken}` },
      });
      assert.equal(bearerHistory.status, 200);
      assert.ok(Array.isArray(bearerHistory.body));

      const missingGeneration = await invoke(generationByIdHandler, {
        method: 'DELETE',
        query: { id: '999999' },
        headers: { authorization: `Bearer ${mobileToken}` },
      });
      assert.equal(missingGeneration.status, 404);

      const checkoutBearer = await invoke(checkoutHandler, {
        method: 'POST',
        body: { packageId: 'credits_10' },
        headers: { authorization: `Bearer ${mobileToken}` },
      });
      assert.equal(checkoutBearer.status, 503);
      assert.equal(checkoutBearer.body.error, 'stripe_not_configured');

      const duplicate = await invoke(registerHandler, {
        method: 'POST',
        body: { email, password },
      });
      assert.equal(duplicate.status, 400);
    } finally {
      await deleteUser(email);
      env.restore();
    }
  });
});

describe('generation history', () => {
  test('list filters and delete stay limited to the signed-in user', async () => {
    const env = snapshotEnv();
    const ownerEmail = `hist-owner-${randomBytes(4).toString('hex')}@example.com`;
    const otherEmail = `hist-other-${randomBytes(4).toString('hex')}@example.com`;
    const password = 'history-test-password';
    try {
      setEnv('NODE_ENV', 'production');

      const owner = await invoke(registerHandler, {
        method: 'POST',
        body: { email: ownerEmail, password },
      });
      const other = await invoke(registerHandler, {
        method: 'POST',
        body: { email: otherEmail, password },
      });
      assert.equal(owner.status, 200);
      assert.equal(other.status, 200);
      const ownerCookie = cookieHeaderFromSetCookie(owner.headers['set-cookie']);
      const otherCookie = cookieHeaderFromSetCookie(other.headers['set-cookie']);

      const cold = await invoke(generationsHandler, {
        method: 'POST',
        headers: { cookie: ownerCookie },
        body: {
          toolType: 'cold_email',
          inputs: { target: 'clinic owners', service: 'recall reminders' },
          output: 'A warm note for clinic owners about recall reminders.',
        },
      });
      assert.equal(cold.status, 201);
      assert.equal(typeof cold.body.id, 'number');

      const social = await invoke(generationsHandler, {
        method: 'POST',
        headers: { cookie: ownerCookie },
        body: {
          toolType: 'social_pack',
          inputs: { businessType: 'a sourdough bakery', niche: 'weekend bread' },
          output: 'Social pack for a sourdough bakery on Instagram.',
        },
      });
      assert.equal(social.status, 201);

      const foreign = await invoke(generationsHandler, {
        method: 'POST',
        headers: { cookie: otherCookie },
        body: {
          toolType: 'proposal',
          inputs: { clientType: 'a private studio' },
          output: 'Private proposal that the other account must not see.',
        },
      });
      assert.equal(foreign.status, 201);

      const ownerList = await invoke(generationsHandler, {
        method: 'GET',
        headers: { cookie: ownerCookie },
        query: { userId: String(other.body.user.id) },
      });
      assert.equal(ownerList.status, 200);
      assert.ok(Array.isArray(ownerList.body));
      const ownerIds = ownerList.body.map((row: { id: number }) => row.id);
      assert.deepEqual(ownerIds.sort(), [cold.body.id, social.body.id].sort());
      assert.equal(ownerList.body.some((row: { output: string }) => row.output.includes('Private proposal')), false);

      const clinic = await invoke(generationsHandler, {
        method: 'GET',
        headers: { cookie: ownerCookie },
        query: { q: 'clinic' },
      });
      assert.equal(clinic.status, 200);
      assert.deepEqual(clinic.body.map((row: { id: number }) => row.id), [cold.body.id]);

      const socialOnly = await invoke(generationsHandler, {
        method: 'GET',
        headers: { cookie: ownerCookie },
        query: { tool: 'social_pack' },
      });
      assert.equal(socialOnly.status, 200);
      assert.deepEqual(socialOnly.body.map((row: { id: number }) => row.id), [social.body.id]);

      const injected = await invoke(generationsHandler, {
        method: 'GET',
        headers: { cookie: ownerCookie },
        query: { q: "%' OR user_id <> 'x" },
      });
      assert.equal(injected.status, 200);
      assert.deepEqual(injected.body, []);

      const badTool = await invoke(generationsHandler, {
        method: 'GET',
        headers: { cookie: ownerCookie },
        query: { tool: 'invoice' },
      });
      assert.equal(badTool.status, 400);
      assert.equal(badTool.body.error, 'invalid_tool');

      const tooLong = await invoke(generationsHandler, {
        method: 'GET',
        headers: { cookie: ownerCookie },
        query: { q: 'z'.repeat(201) },
      });
      assert.equal(tooLong.status, 400);
      assert.equal(tooLong.body.error, 'query_too_long');

      const otherList = await invoke(generationsHandler, {
        method: 'GET',
        headers: { cookie: otherCookie },
      });
      assert.deepEqual(otherList.body.map((row: { id: number }) => row.id), [foreign.body.id]);

      const foreignDelete = await invoke(generationByIdHandler, {
        method: 'DELETE',
        query: { id: String(cold.body.id) },
        headers: { cookie: otherCookie },
      });
      assert.equal(foreignDelete.status, 404);
      assert.equal(foreignDelete.body.error, 'not_found');

      const stillThere = await invoke(generationsHandler, {
        method: 'GET',
        headers: { cookie: ownerCookie },
        query: { q: 'clinic' },
      });
      assert.deepEqual(stillThere.body.map((row: { id: number }) => row.id), [cold.body.id]);

      const removed = await invoke(generationByIdHandler, {
        method: 'DELETE',
        query: { id: String(cold.body.id) },
        headers: { cookie: ownerCookie },
      });
      assert.equal(removed.status, 200);
      assert.equal(removed.body.ok, true);

      const afterCookieDelete = await invoke(generationsHandler, {
        method: 'GET',
        headers: { cookie: ownerCookie },
      });
      assert.deepEqual(afterCookieDelete.body.map((row: { id: number }) => row.id), [social.body.id]);

      const mobile = await invoke(loginHandler, {
        method: 'POST',
        body: { email: ownerEmail, password },
        headers: { [MOBILE_CLIENT_HEADER]: MOBILE_CLIENT_VALUE },
      });
      assert.equal(mobile.status, 200);
      assert.equal(typeof mobile.body.token, 'string');

      const bearerDelete = await invoke(generationByIdHandler, {
        method: 'DELETE',
        query: { id: String(social.body.id) },
        headers: { authorization: `Bearer ${mobile.body.token}` },
      });
      assert.equal(bearerDelete.status, 200);

      const bearerForeign = await invoke(generationByIdHandler, {
        method: 'DELETE',
        query: { id: String(foreign.body.id) },
        headers: { authorization: `Bearer ${mobile.body.token}` },
      });
      assert.equal(bearerForeign.status, 404);

      const otherBearer = await invoke(generationsHandler, {
        method: 'GET',
        headers: { authorization: `Bearer ${sessionToken(other.headers['set-cookie'])}` },
      });
      assert.equal(otherBearer.status, 200);
      assert.deepEqual(otherBearer.body.map((row: { id: number }) => row.id), [foreign.body.id]);

      const otherAfter = await invoke(generationsHandler, {
        method: 'GET',
        headers: { cookie: otherCookie },
      });
      assert.equal(otherAfter.body[0].output, foreign.body.output);

      const badId = await invoke(generationByIdHandler, {
        method: 'DELETE',
        query: { id: 'nope' },
        headers: { cookie: ownerCookie },
      });
      assert.equal(badId.status, 400);
      assert.equal(badId.body.error, 'invalid_id');
    } finally {
      await deleteUser(ownerEmail);
      await deleteUser(otherEmail);
      env.restore();
    }
  });
});

describe('POST /api/account/delete', () => {
  test('deletes the user, history, and credits in one account and logs that session out', async () => {
    const env = snapshotEnv();
    const email = `delete-${randomBytes(4).toString('hex')}@example.com`;
    const otherEmail = `keep-${randomBytes(4).toString('hex')}@example.com`;
    const password = 'delete-account-password';
    const previousBase = process.env.APP_BASE_URL;
    try {
      setEnv('NODE_ENV', 'production');
      setEnv('APP_BASE_URL', undefined);
      const registered = await invoke(registerHandler, {
        method: 'POST',
        body: { email, password },
        headers: { [MOBILE_CLIENT_HEADER]: MOBILE_CLIENT_VALUE },
      });
      const other = await invoke(registerHandler, {
        method: 'POST',
        body: { email: otherEmail, password },
      });
      assert.equal(registered.status, 200);
      assert.equal(other.status, 200);
      const userId = registered.body.user.id as string;
      const token = registered.body.token as string;
      const otherCookie = cookieHeaderFromSetCookie(other.headers['set-cookie']);

      await query(
        `INSERT INTO generations (user_id, tool_type, inputs, output)
         VALUES ($1, 'cold_email', '{"target":"clinics"}'::jsonb, 'private draft')`,
        [userId],
      );
      await query(
        `INSERT INTO credit_transactions (user_id, amount, reason)
         VALUES ($1, 10, 'Purchased 10 credits via Stripe')`,
        [userId],
      );
      await query(
        `INSERT INTO google_accounts (google_sub, user_id, email, name)
         VALUES ($1, $2, $3, 'Delete Me')`,
        [`google-sub-${userId}`, userId, email.toLowerCase()],
      );
      await query('UPDATE users SET credits = 10 WHERE id = $1', [userId]);
      await query(
        `INSERT INTO generations (user_id, tool_type, inputs, output)
         VALUES ($1, 'proposal', '{}'::jsonb, 'other draft')`,
        [other.body.user.id],
      );

      const anonymous = await invoke(deleteAccountHandler, {
        method: 'POST',
        body: { confirm: true },
      });
      assert.equal(anonymous.status, 401);

      const unconfirmed = await invoke(deleteAccountHandler, {
        method: 'POST',
        body: {},
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(unconfirmed.status, 400);
      const stillThere = await query('SELECT credits FROM users WHERE id = $1', [userId]);
      assert.equal(stillThere.length, 1);

      const cookie = cookieHeaderFromSetCookie(registered.headers['set-cookie']);
      const crossOrigin = await invoke(deleteAccountHandler, {
        method: 'POST',
        body: { confirm: true },
        headers: {
          cookie,
          host: 'pitchcrafter.glmlabs.io',
          'x-forwarded-proto': 'https',
          origin: 'https://evil.example',
        },
      });
      assert.equal(crossOrigin.status, 403);
      assert.equal(crossOrigin.body.error, 'cross_origin');
      assert.equal((await query('SELECT id FROM users WHERE id = $1', [userId])).length, 1);

      const deleted = await invoke(deleteAccountHandler, {
        method: 'POST',
        body: { confirm: true },
        headers: {
          cookie,
          host: 'pitchcrafter.glmlabs.io',
          'x-forwarded-proto': 'https',
          origin: 'https://pitchcrafter.glmlabs.io',
        },
      });
      assert.equal(deleted.status, 200);
      assert.equal(deleted.body.ok, true);
      assert.equal(cookieHeaderFromSetCookie(deleted.headers['set-cookie']), 'bizkit_token=');

      assert.equal((await query('SELECT id FROM users WHERE id = $1', [userId])).length, 0);
      assert.equal((await query('SELECT google_sub FROM google_accounts WHERE user_id = $1', [userId])).length, 0);
      assert.equal((await query('SELECT id FROM generations WHERE user_id = $1', [userId])).length, 0);
      assert.equal(
        (await query('SELECT id FROM credit_transactions WHERE user_id = $1', [userId])).length,
        0,
      );

      const staleMe = await invoke(meHandler, {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(staleMe.status, 401);
      const staleHistory = await invoke(generationsHandler, {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(staleHistory.status, 401);

      const otherStill = await invoke(generationsHandler, {
        method: 'GET',
        headers: { cookie: otherCookie },
      });
      assert.equal(otherStill.status, 200);
      assert.equal(otherStill.body.length, 1);
      assert.equal(otherStill.body[0].output, 'other draft');
    } finally {
      setEnv('APP_BASE_URL', previousBase);
      await deleteUser(email);
      await deleteUser(otherEmail);
      env.restore();
    }
  });
});

describe('Google account linking', () => {
  test('links a verified email, creates with the same credits, and deletion removes the link', async () => {
    const env = snapshotEnv();
    const previousCredits = process.env.DEMO_SIGNUP_CREDITS;
    const previousSuper = process.env.SUPER_USER_EMAIL;
    const password = 'google-link-password';
    const existingEmail = `link-${randomBytes(4).toString('hex')}@example.com`;
    const createdEmail = `new-${randomBytes(4).toString('hex')}@example.com`;
    const blockedEmail = `admin-${randomBytes(4).toString('hex')}@example.com`;
    const otherEmail = `other-${randomBytes(4).toString('hex')}@example.com`;
    try {
      setEnv('NODE_ENV', 'production');
      setEnv('DEMO_SIGNUP_CREDITS', '7');
      const columns = await query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'google_accounts'
         ORDER BY column_name`,
      );
      assert.deepEqual(columns.map((row) => row.column_name), [
        'created_at',
        'email',
        'google_sub',
        'name',
        'user_id',
      ]);

      const registered = await invoke(registerHandler, {
        method: 'POST',
        body: { email: existingEmail, password },
      });
      assert.equal(registered.status, 200);
      assert.equal(registered.body.user.credits, 0);
      const existingId = registered.body.user.id as string;
      await query(
        `UPDATE users SET last_sign_in_at = '2020-01-01T00:00:00.000Z' WHERE id = $1`,
        [existingId],
      );

      const linked = await signInWithGoogleProfile({
        sub: 'sub-existing',
        email: existingEmail.toUpperCase(),
        emailVerified: true,
        name: 'Ada Lovelace',
      });
      assert.equal('error' in linked, false);
      if ('error' in linked) return;
      assert.equal(linked.created, false);
      assert.equal(linked.user.id, existingId);
      assert.equal(linked.user.credits, 0);
      const linkRow = await query<{ email: string; name: string }>(
        'SELECT email, name FROM google_accounts WHERE google_sub = $1',
        ['sub-existing'],
      );
      assert.equal(linkRow[0]?.email, existingEmail.toLowerCase());
      assert.equal(linkRow[0]?.name, 'Ada Lovelace');
      const linkedStamp = await query<{ last_sign_in_at: Date | string }>(
        'SELECT last_sign_in_at FROM users WHERE id = $1',
        [existingId],
      );
      assert.ok(
        new Date(linkedStamp[0]?.last_sign_in_at ?? 0).getTime() > Date.parse('2020-01-02T00:00:00.000Z'),
      );
      const storedHash = await query<{ password_hash: string }>(
        'SELECT password_hash FROM users WHERE id = $1',
        [existingId],
      );
      assert.equal(JSON.stringify(linked).includes(storedHash[0].password_hash), false);

      const passwordLogin = await invoke(loginHandler, {
        method: 'POST',
        body: { email: existingEmail, password },
      });
      assert.equal(passwordLogin.status, 200);

      const conflict = await signInWithGoogleProfile({
        sub: 'sub-other',
        email: existingEmail,
        emailVerified: true,
        name: 'Someone Else',
      });
      assert.deepEqual(conflict, { error: 'identity_conflict' });
      assert.equal(
        (await query('SELECT google_sub FROM google_accounts WHERE user_id = $1', [existingId])).length,
        1,
      );

      const unverified = await signInWithGoogleProfile({
        sub: 'sub-unverified',
        email: `unverified-${randomBytes(4).toString('hex')}@example.com`,
        emailVerified: false,
        name: null,
      });
      assert.deepEqual(unverified, { error: 'email_not_verified' });

      setEnv('SUPER_USER_EMAIL', blockedEmail);
      const blocked = await signInWithGoogleProfile({
        sub: 'sub-blocked',
        email: blockedEmail,
        emailVerified: true,
        name: 'Admin',
      });
      assert.deepEqual(blocked, { error: 'signup_blocked' });
      assert.equal((await query('SELECT id FROM users WHERE email = $1', [blockedEmail])).length, 0);
      setEnv('SUPER_USER_EMAIL', previousSuper);

      const created = await signInWithGoogleProfile({
        sub: 'sub-created',
        email: createdEmail,
        emailVerified: true,
        name: 'New Person',
      });
      assert.equal('error' in created, false);
      if ('error' in created) return;
      assert.equal(created.created, true);
      assert.equal(created.user.credits, 0);
      assert.equal(created.user.role, 'user');
      const me = await invoke(meHandler, {
        method: 'GET',
        headers: { authorization: `Bearer ${created.token}` },
      });
      assert.equal(me.status, 200);
      assert.equal(me.body.user.email, createdEmail);
      const createdStamp = await query<{ last_sign_in_at: Date | string }>(
        'SELECT last_sign_in_at FROM users WHERE id = $1',
        [created.user.id],
      );
      assert.ok(
        new Date(createdStamp[0]?.last_sign_in_at ?? 0).getTime() > Date.parse('2020-01-02T00:00:00.000Z'),
      );
      await query(
        `UPDATE users SET last_sign_in_at = '2020-01-01T00:00:00.000Z' WHERE id = $1`,
        [created.user.id],
      );

      const renamed = await signInWithGoogleProfile({
        sub: 'sub-created',
        email: otherEmail,
        emailVerified: true,
        name: 'Renamed',
      });
      assert.equal('error' in renamed, false);
      if ('error' in renamed) return;
      assert.equal(renamed.user.id, created.user.id);
      assert.equal(renamed.user.email, createdEmail);
      const renamedStamp = await query<{ last_sign_in_at: Date | string }>(
        'SELECT last_sign_in_at FROM users WHERE id = $1',
        [created.user.id],
      );
      assert.ok(
        new Date(renamedStamp[0]?.last_sign_in_at ?? 0).getTime() > Date.parse('2020-01-02T00:00:00.000Z'),
      );
      const renamedRow = await query<{ email: string; name: string }>(
        'SELECT email, name FROM google_accounts WHERE google_sub = $1',
        ['sub-created'],
      );
      assert.equal(renamedRow[0]?.email, otherEmail);
      assert.equal(renamedRow[0]?.name, 'Renamed');
      assert.equal(
        (await query<{ email: string }>('SELECT email FROM users WHERE id = $1', [created.user.id]))[0]?.email,
        createdEmail,
      );

      setEnv('NODE_ENV', 'development');
      setEnv('DEMO_SIGNUP_CREDITS', '7');
      const demoEmail = `demo-google-${randomBytes(4).toString('hex')}@example.com`;
      const demo = await signInWithGoogleProfile({
        sub: 'sub-demo-credits',
        email: demoEmail,
        emailVerified: true,
        name: null,
      });
      assert.equal('error' in demo, false);
      if ('error' in demo) return;
      assert.equal(demo.user.credits, 7);
      const passwordEmail = `demo-password-${randomBytes(4).toString('hex')}@example.com`;
      const passwordSignup = await invoke(registerHandler, {
        method: 'POST',
        body: { email: passwordEmail, password },
      });
      assert.equal(passwordSignup.status, 200);
      assert.equal(passwordSignup.body.user.credits, demo.user.credits);

      await deleteUser(demoEmail);
      await deleteUser(passwordEmail);
    } finally {
      setEnv('DEMO_SIGNUP_CREDITS', previousCredits);
      setEnv('SUPER_USER_EMAIL', previousSuper);
      await deleteUser(existingEmail);
      await deleteUser(createdEmail);
      await deleteUser(blockedEmail);
      await deleteUser(otherEmail);
      env.restore();
    }
  });
});

describe('Google mobile code exchange', () => {
  test('stores only a hash and rejects a wrong verifier, an expired code, and a replay', async () => {
    const env = snapshotEnv();
    const previousClient = process.env.GOOGLE_CLIENT_ID;
    const previousSecret = process.env.GOOGLE_CLIENT_SECRET;
    const previousBase = process.env.APP_BASE_URL;
    const email = `mobile-code-${randomBytes(4).toString('hex')}@example.com`;
    const password = 'mobile-code-password';
    try {
      setEnv('NODE_ENV', 'production');
      setEnv('GOOGLE_CLIENT_ID', 'test-google-client');
      setEnv('GOOGLE_CLIENT_SECRET', 'test-google-secret');
      setEnv('APP_BASE_URL', 'https://pitchcrafter.glmlabs.io');

      const registered = await invoke(registerHandler, {
        method: 'POST',
        body: { email, password },
      });
      assert.equal(registered.status, 200);
      const userId = registered.body.user.id as string;
      const columns = await query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'google_mobile_codes'
         ORDER BY column_name`,
      );
      assert.deepEqual(columns.map((row) => row.column_name), [
        'code_challenge',
        'code_hash',
        'created_account',
        'created_at',
        'expires_at',
        'user_id',
      ]);

      const issuedAt = new Date('2026-01-01T00:00:00.000Z');
      const verifier = createPkceVerifier();
      const code = createPkceVerifier();
      await saveMobileAuthCode({
        code,
        codeChallenge: pkceChallenge(verifier),
        userId,
        created: true,
        now: issuedAt,
      });
      const stored = await query<{ code_hash: string; code_challenge: string }>(
        'SELECT code_hash, code_challenge FROM google_mobile_codes WHERE user_id = $1',
        [userId],
      );
      assert.equal(stored[0]?.code_hash, hashMobileCode(code));
      assert.notEqual(stored[0]?.code_hash, code);
      assert.equal(stored[0]?.code_challenge, pkceChallenge(verifier));
      assert.equal(JSON.stringify(stored).includes(code), false);

      const wrong = await redeemMobileAuthCode({
        code,
        verifier: createPkceVerifier(),
        now: new Date(issuedAt.getTime() + 1000),
      });
      assert.deepEqual(wrong, { ok: false, error: 'invalid_verifier' });
      assert.equal(
        (await query('SELECT code_hash FROM google_mobile_codes WHERE user_id = $1', [userId])).length,
        1,
      );

      const expired = await redeemMobileAuthCode({
        code,
        verifier,
        now: new Date(issuedAt.getTime() + 60_000),
      });
      assert.deepEqual(expired, { ok: false, error: 'expired' });
      assert.equal(
        (await query('SELECT code_hash FROM google_mobile_codes WHERE code_hash = $1', [hashMobileCode(code)])).length,
        0,
      );

      const liveVerifier = createPkceVerifier();
      const liveCode = createPkceVerifier();
      await saveMobileAuthCode({
        code: liveCode,
        codeChallenge: pkceChallenge(liveVerifier),
        userId,
        created: false,
        now: new Date(),
      });
      const httpWrong = await invoke(exchangeHandler, {
        method: 'POST',
        body: { code: liveCode, code_verifier: createPkceVerifier() },
        headers: { [MOBILE_CLIENT_HEADER]: MOBILE_CLIENT_VALUE },
      });
      assert.equal(httpWrong.status, 401);
      assert.equal(httpWrong.body.error, 'invalid_verifier');
      assert.equal(httpWrong.body.token, undefined);

      const httpOk = await invoke(exchangeHandler, {
        method: 'POST',
        body: { code: liveCode, code_verifier: liveVerifier },
        headers: { [MOBILE_CLIENT_HEADER]: MOBILE_CLIENT_VALUE },
      });
      assert.equal(httpOk.status, 200);
      assert.equal(typeof httpOk.body.token, 'string');
      assert.equal(httpOk.body.token.length > 20, true);
      assert.equal(httpOk.body.created, false);
      assert.equal(httpOk.body.user.password_hash, undefined);
      assert.equal(httpOk.body.user.id, userId);
      const me = await invoke(meHandler, {
        method: 'GET',
        headers: { authorization: `Bearer ${httpOk.body.token}` },
      });
      assert.equal(me.status, 200);
      assert.equal(me.body.user.email, email);

      const replay = await invoke(exchangeHandler, {
        method: 'POST',
        body: { code: liveCode, code_verifier: liveVerifier },
        headers: { [MOBILE_CLIENT_HEADER]: MOBILE_CLIENT_VALUE },
      });
      assert.equal(replay.status, 401);
      assert.equal(replay.body.error, 'invalid_code');
      assert.equal(replay.body.token, undefined);
      assert.equal(JSON.stringify(replay.body).includes(liveCode), false);
    } finally {
      setEnv('GOOGLE_CLIENT_ID', previousClient);
      setEnv('GOOGLE_CLIENT_SECRET', previousSecret);
      setEnv('APP_BASE_URL', previousBase);
      await deleteUser(email);
      env.restore();
    }
  });
});
