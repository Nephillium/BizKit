import assert from 'node:assert/strict';
import { randomBytes, randomInt } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import type { NextApiRequest } from 'next';
import { anonymousSubject } from '../../lib/anonymousQuota';
import { pool, query } from '../../lib/db';
import { initSchema } from '../../lib/initSchema';
import { MOBILE_CLIENT_HEADER, MOBILE_CLIENT_VALUE } from '../../lib/authResponse';
import {
  AI_NOT_CONFIGURED_ERROR,
  AI_NOT_CONFIGURED_MESSAGE,
} from '../../lib/runtimeConfig';
import loginHandler from '../../pages/api/auth/login';
import logoutHandler from '../../pages/api/auth/logout';
import meHandler from '../../pages/api/auth/me';
import registerHandler from '../../pages/api/auth/register';
import generateHandler from '../../pages/api/generate';
import generationByIdHandler from '../../pages/api/generations/[id]';
import generationsHandler from '../../pages/api/generations/index';
import checkoutHandler from '../../pages/api/stripe/create-checkout';
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
