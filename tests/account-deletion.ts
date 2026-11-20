import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ACCOUNT_DELETION_EMAIL, ACCOUNT_DELETION_PATH, ACCOUNT_DELETION_URL } from '../lib/accountDeletionCopy';
import { handleDeleteAccount } from '../pages/api/account/delete';
import { generateToken } from '../lib/users';

const require = createRequire(import.meta.url);
const { resolveGoogleServicesFile, googleServicesConfigured } = require('../mobile/src/lib/firebaseConfig.cjs') as typeof import('../mobile/src/lib/firebaseConfig.cjs');
const { canLogAnalyticsEvent } = require('../mobile/src/lib/analyticsPolicy.ts') as typeof import('../mobile/src/lib/analyticsPolicy');
const { ANDROID_CREDITS_UNAVAILABLE_MESSAGE } = require('../mobile/src/lib/playBilling.ts') as typeof import('../mobile/src/lib/playBilling');

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
      return { statusCode, jsonBody, setCookie: headers.get('set-cookie') };
    },
  };
}

function createRequest(
  method: string,
  body?: unknown,
  headers: Record<string, string> = {},
): NextApiRequest {
  return { method, body, headers } as NextApiRequest;
}

const token = generateToken({ id: 'user-1', email: 'ada@example.com', role: 'user' });

async function testDeleteRequiresAuthAndConfirmation() {
  let calls = 0;
  const deleteAccount = async (userId: string) => {
    calls += 1;
    assert.equal(userId, 'user-1');
    return 'deleted' as const;
  };

  const wrongMethod = createResponse();
  await handleDeleteAccount(createRequest('GET'), wrongMethod.res, deleteAccount);
  assert.equal(wrongMethod.result().statusCode, 405);
  assert.equal(calls, 0);

  const anonymous = createResponse();
  await handleDeleteAccount(
    createRequest('POST', { confirm: true }),
    anonymous.res,
    deleteAccount,
  );
  assert.equal(anonymous.result().statusCode, 401);
  assert.equal(calls, 0);

  const unconfirmed = createResponse();
  await handleDeleteAccount(
    createRequest('POST', {}, { authorization: `Bearer ${token}` }),
    unconfirmed.res,
    deleteAccount,
  );
  assert.equal(unconfirmed.result().statusCode, 400);
  assert.equal((unconfirmed.result().jsonBody as { error: string }).error, 'confirmation_required');
  assert.equal(calls, 0);

  const deleted = createResponse();
  await handleDeleteAccount(
    createRequest('POST', { confirm: true }, { authorization: `Bearer ${token}` }),
    deleted.res,
    deleteAccount,
  );
  assert.equal(deleted.result().statusCode, 200);
  assert.equal((deleted.result().jsonBody as { ok: boolean }).ok, true);
  assert.match(String(deleted.result().setCookie), /bizkit_token=/);
  assert.match(String(deleted.result().setCookie), /Max-Age=0/);
  assert.equal(calls, 1);

  const missing = createResponse();
  await handleDeleteAccount(
    createRequest('POST', { confirm: true }, { authorization: `Bearer ${token}` }),
    missing.res,
    async () => 'missing',
  );
  assert.equal(missing.result().statusCode, 401);
  assert.match(String(missing.result().setCookie), /Max-Age=0/);

  const failed = createResponse();
  await handleDeleteAccount(
    createRequest('POST', { confirm: true }, { authorization: `Bearer ${token}` }),
    failed.res,
    async () => {
      throw new Error('database unavailable');
    },
  );
  assert.equal(failed.result().statusCode, 500);
  assert.equal(failed.result().setCookie, undefined);
}

async function testCookieOrigin() {
  const previousBase = process.env.APP_BASE_URL;
  delete (process.env as Record<string, string | undefined>).APP_BASE_URL;
  let calls = 0;
  const deleteAccount = async () => {
    calls += 1;
    return 'deleted' as const;
  };
  const cookie = `bizkit_token=${token}`;
  const hostHeaders = {
    cookie,
    host: 'pitchcrafter.glmlabs.io',
    'x-forwarded-proto': 'https',
  };

  try {
    const cross = createResponse();
    await handleDeleteAccount(
      createRequest('POST', { confirm: true }, {
        ...hostHeaders,
        origin: 'https://evil.example',
      }),
      cross.res,
      deleteAccount,
    );
    assert.equal(cross.result().statusCode, 403);
    assert.equal((cross.result().jsonBody as { error: string }).error, 'cross_origin');
    assert.equal(calls, 0);

    const foreignReferer = createResponse();
    await handleDeleteAccount(
      createRequest('POST', { confirm: true }, {
        ...hostHeaders,
        referer: 'https://evil.example/account/delete',
      }),
      foreignReferer.res,
      deleteAccount,
    );
    assert.equal(foreignReferer.result().statusCode, 403);
    assert.equal(calls, 0);

    const bearer = createResponse();
    await handleDeleteAccount(
      createRequest('POST', { confirm: true }, {
        authorization: `Bearer ${token}`,
        origin: 'https://evil.example',
      }),
      bearer.res,
      deleteAccount,
    );
    assert.equal(bearer.result().statusCode, 200);
    assert.equal(calls, 1);

    const same = createResponse();
    await handleDeleteAccount(
      createRequest('POST', { confirm: true }, {
        ...hostHeaders,
        origin: 'https://pitchcrafter.glmlabs.io',
      }),
      same.res,
      deleteAccount,
    );
    assert.equal(same.result().statusCode, 200);
    assert.equal((same.result().jsonBody as { ok: boolean }).ok, true);
    assert.equal(calls, 2);
  } finally {
    if (previousBase === undefined) {
      delete (process.env as Record<string, string | undefined>).APP_BASE_URL;
    } else {
      process.env.APP_BASE_URL = previousBase;
    }
  }
}

function testPublicDeletionCopy() {
  assert.equal(ACCOUNT_DELETION_PATH, '/account/delete');
  assert.equal(ACCOUNT_DELETION_EMAIL, 'admin@glmlabs.io');
  assert.equal(ACCOUNT_DELETION_URL, 'https://pitchcrafter.glmlabs.io/account/delete');
  const page = readFileSync('pages/account/delete.tsx', 'utf8');
  assert.match(page, /ACCOUNT_DELETION_EMAIL/);
  assert.match(page, /confirm/);
  const docs = readFileSync('docs/ANDROID.md', 'utf8');
  assert.match(docs, /\/account\/delete/);
  assert.match(docs, /admin@glmlabs\.io/);
  assert.match(docs, /google-services\.json/);
  assert.match(docs, /consent/i);
  assert.match(docs, /automatic session events/);
  const sql = readFileSync('lib/accountDeletion.ts', 'utf8');
  assert.match(sql, /DELETE FROM generations/);
  assert.match(sql, /DELETE FROM credit_transactions/);
  assert.match(sql, /DELETE FROM google_accounts/);
  assert.match(sql, /DELETE FROM users/);
  assert.doesNotMatch(sql, /stripe\.(customers|charges)/);
}

function testAnalyticsStaysOffUntilConsent() {
  assert.equal(canLogAnalyticsEvent({ consent: null, eventName: 'sign_up', configured: true }), false);
  assert.equal(canLogAnalyticsEvent({ consent: 'denied', eventName: 'sign_up', configured: true }), false);
  assert.equal(canLogAnalyticsEvent({ consent: 'granted', eventName: 'sign_up', configured: false }), false);
  assert.equal(canLogAnalyticsEvent({ consent: 'granted', eventName: 'sign_up', configured: true }), true);
  assert.equal(canLogAnalyticsEvent({ consent: 'granted', eventName: 'purchase', configured: true }), true);
  assert.equal(canLogAnalyticsEvent({ consent: 'granted', eventName: 'screen_view', configured: true }), false);
  assert.equal(canLogAnalyticsEvent({ consent: 'granted', eventName: 'login', configured: true }), false);

  const directory = mkdtempSync(path.join(tmpdir(), 'pitchcrafter-gs-'));
  try {
    assert.equal(googleServicesConfigured(path.join(directory, 'missing.json')), false);
    const file = path.join(directory, 'google-services.json');
    writeFileSync(file, '{}\n');
    assert.equal(resolveGoogleServicesFile(file), file);
    assert.equal(googleServicesConfigured(file), true);
    assert.equal(resolveGoogleServicesFile(''), null);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function testAndroidDoesNotSteerToWebCredits() {
  assert.equal(
    ANDROID_CREDITS_UNAVAILABLE_MESSAGE,
    "Credit purchases aren't available in this version",
  );
  assert.doesNotMatch(ANDROID_CREDITS_UNAVAILABLE_MESSAGE, /https?:|www\.|website|\$|price|glmlabs/i);
  const translations = readFileSync('mobile/src/lib/translations.ts', 'utf8');
  const buy = readFileSync('mobile/src/screens/BuyCreditsScreen.tsx', 'utf8');
  const profile = readFileSync('mobile/src/screens/ProfileScreen.tsx', 'utf8');
  assert.doesNotMatch(translations, /managePlanOnWeb|PitchCrafter website|web üzerinden/);
  assert.match(translations, /Credit purchases aren't available in this version/);
  assert.doesNotMatch(buy, /managePlanOnWeb|pitchcrafter\.glmlabs\.io|buy-credits/);
  assert.doesNotMatch(profile, /managePlanOnWeb|pitchcrafter\.glmlabs\.io|buy-credits/);
  assert.match(profile, /deleteAccount/);
  assert.match(profile, /creditsUnavailable/);
}

await testDeleteRequiresAuthAndConfirmation();
await testCookieOrigin();
testPublicDeletionCopy();
testAnalyticsStaysOffUntilConsent();
testAndroidDoesNotSteerToWebCredits();
console.log('account deletion tests passed');
