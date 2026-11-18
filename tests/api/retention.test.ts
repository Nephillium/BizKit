import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { after, before, describe, test } from 'node:test';
import { deleteUserAccountDetail } from '../../lib/accountDeletion';
import { requestHasCronSecret } from '../../lib/cronAuth';
import { pool, query } from '../../lib/db';
import { initSchema } from '../../lib/initSchema';
import {
  ACCOUNT_RETENTION_MONTHS,
  WAITLIST_RETENTION_MONTHS,
  runRetentionCleanup,
  type RetentionReport,
} from '../../lib/retention';
import { recordSignIn } from '../../lib/signInTracking';
import loginHandler from '../../pages/api/auth/login';
import registerHandler from '../../pages/api/auth/register';
import retentionHandler from '../../pages/api/cron/retention';
import { invoke } from './invoke';

const MONTHS_12 = 12;
const MONTHS_24 = 24;

function setEnv(name: string, value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[name];
  else env[name] = value;
}

function address(label: string): string {
  return `retention-${label}-${randomBytes(4).toString('hex')}@example.com`;
}

function lastSignInSql(boundary: 'exact' | 'older' | 'younger' | 'recent'): string {
  if (boundary === 'exact') return `$2::timestamptz - ($3::int * interval '1 month')`;
  if (boundary === 'older') return `$2::timestamptz - ($3::int * interval '1 month') - interval '1 second'`;
  if (boundary === 'younger') return `$2::timestamptz - ($3::int * interval '1 month') + interval '1 second'`;
  return `$2::timestamptz - interval '1 day' + ($3::int * interval '0')`;
}

function createdAtSql(boundary: 'exact' | 'older' | 'younger' | 'recent'): string {
  if (boundary === 'exact') return `$2::timestamptz - ($3::int * interval '1 month')`;
  if (boundary === 'older') return `$2::timestamptz - ($3::int * interval '1 month') - interval '1 second'`;
  if (boundary === 'younger') return `$2::timestamptz - ($3::int * interval '1 month') + interval '1 second'`;
  return `$2::timestamptz - interval '1 day' + ($3::int * interval '0')`;
}

async function insertUser(email: string, boundary: 'exact' | 'older' | 'younger' | 'recent', now: Date, months: number) {
  const rows = await query<{ id: string }>(
    `INSERT INTO users (
       email, password_hash, role, credits, usage_count, email_verified, created_at, last_sign_in_at
     )
     VALUES (
       $1, 'retention-test-hash', 'user', 4, 2, TRUE,
       $2::timestamptz - interval '36 months',
       ${lastSignInSql(boundary)}
     )
     RETURNING id`,
    [email, now, months],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error('failed to insert retention user');
  return id;
}

async function insertWaitlist(email: string, boundary: 'exact' | 'older' | 'younger' | 'recent', now: Date, months: number) {
  await query(
    `INSERT INTO waitlist_signups (email, created_at)
     VALUES ($1, ${createdAtSql(boundary)})`,
    [email, now, months],
  );
}

async function insertGeneration(userId: string, output: string) {
  await query(
    `INSERT INTO generations (user_id, tool_type, inputs, output)
     VALUES ($1, 'cold_email', '{}'::jsonb, $2)`,
    [userId, output],
  );
}

async function insertCredit(userId: string) {
  await query(
    `INSERT INTO credit_transactions (user_id, amount, reason)
     VALUES ($1, 10, 'Purchased 10 credits via Stripe')`,
    [userId],
  );
}

async function protectPreexistingRows(now: Date) {
  await query(
    `UPDATE users
     SET last_sign_in_at = $1::timestamptz
     WHERE email NOT LIKE 'retention-%'
       AND last_sign_in_at <= $1::timestamptz - ($2::int * interval '1 month')`,
    [now, MONTHS_24],
  );
  await query(
    `UPDATE waitlist_signups
     SET created_at = $1::timestamptz
     WHERE lower(email) NOT LIKE 'retention-%'
       AND created_at <= $1::timestamptz - ($2::int * interval '1 month')`,
    [now, MONTHS_12],
  );
}

async function deleteFixtures() {
  await query(`DELETE FROM users WHERE email LIKE 'retention-%'`);
  await query(`DELETE FROM waitlist_signups WHERE lower(email) LIKE 'retention-%'`);
  await query(`DELETE FROM anonymous_generations WHERE subject_hash LIKE 'retention-%'`);
}

async function prepare(now: Date) {
  await deleteFixtures();
  await protectPreexistingRows(now);
}

async function countWhere(sql: string, params: unknown[]): Promise<number> {
  const rows = await query<{ n: number }>(sql, params);
  return Number(rows[0]?.n ?? 0);
}

async function captureLogs(run: () => Promise<void>): Promise<string[]> {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    lines.push(args.map((arg) => String(arg)).join(' '));
  };
  try {
    await run();
    return lines;
  } finally {
    console.log = original;
  }
}

function retentionLogs(lines: string[]): Array<Record<string, unknown>> {
  return lines
    .filter((line) => line.includes('"event":"retention_cleanup"'))
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

before(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Start Postgres and run npm run test:api.');
  }
  await initSchema();
});

after(async () => {
  await deleteFixtures();
  await pool.end();
});

describe('retention policy files', () => {
  test('locks the 12-month and 24-month periods and a closed cron route', () => {
    assert.equal(WAITLIST_RETENTION_MONTHS, MONTHS_12);
    assert.equal(ACCOUNT_RETENTION_MONTHS, MONTHS_24);

    const secret = 'retention-test-secret';
    assert.equal(requestHasCronSecret(undefined, secret), false);
    assert.equal(requestHasCronSecret('Bearer wrong-secret', secret), false);
    assert.equal(requestHasCronSecret('Bearer retention-test-secret-extra', secret), false);
    assert.equal(requestHasCronSecret(secret, secret), false);
    assert.equal(requestHasCronSecret(`Bearer ${secret}`, ''), false);
    assert.equal(requestHasCronSecret(`Bearer ${secret}`, undefined), false);
    assert.equal(requestHasCronSecret([`Bearer ${secret}`, `Bearer ${secret}`], secret), false);
    assert.equal(requestHasCronSecret(`bearer ${secret}`, secret), true);
    assert.equal(requestHasCronSecret(`Bearer ${secret}`, secret), true);

    const example = readFileSync('.env.example', 'utf8');
    assert.match(example, /^CRON_SECRET=\s*$/m);
    assert.match(example, /^RETENTION_DRY_RUN=\s*$/m);
    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      crons?: Array<{ path?: string; schedule?: string }>;
    };
    assert.ok(vercel.crons?.some((cron) => (
      cron.path === '/api/cron/retention' && cron.schedule === '15 4 * * *'
    )));

    const retentionSource = readFileSync('lib/retention.ts', 'utf8');
    assert.match(retentionSource, /deleteUserAccountDetail/);
    assert.doesNotMatch(retentionSource, /from ['"][^'"]*stripe|stripe\.(customers|charges|invoices)/i);
    const usersSource = readFileSync('lib/users.ts', 'utf8');
    assert.match(usersSource, /recordSignIn\(result\.id\)/);
    assert.match(usersSource, /recordSignIn\(user\.id\)/);
  });
});

describe('retention boundaries', () => {
  test('deletes the 12-month waitlist and 24-month account boundaries and leaves the rest', async () => {
    const now = new Date();
    await prepare(now);

    const expired = address('expired');
    const older = address('older');
    const younger = address('younger');
    const recent = address('recent');
    const holder = address('holder');
    const expiredId = await insertUser(expired, 'exact', now, MONTHS_24);
    const olderId = await insertUser(older, 'older', now, MONTHS_24);
    const youngerId = await insertUser(younger, 'younger', now, MONTHS_24);
    const recentId = await insertUser(recent, 'recent', now, MONTHS_24);
    await insertUser(holder, 'recent', now, MONTHS_24);

    await insertGeneration(expiredId, 'expired draft');
    await insertGeneration(olderId, 'older draft');
    await insertGeneration(youngerId, 'younger draft');
    await insertGeneration(recentId, 'recent draft');
    await insertCredit(expiredId);
    await insertCredit(youngerId);

    const waitlistExact = address('wait-exact');
    const waitlistOlder = address('wait-older');
    const waitlistYounger = address('wait-younger');
    const waitlistFresh = address('wait-fresh');
    const waitlistHeld = `  ${holder.replace('retention-', 'Retention-').replace('@example.com', '@Example.com')}  `;
    await insertWaitlist(waitlistExact, 'exact', now, MONTHS_12);
    await insertWaitlist(waitlistOlder, 'older', now, MONTHS_12);
    await insertWaitlist(waitlistYounger, 'younger', now, MONTHS_12);
    await insertWaitlist(waitlistFresh, 'recent', now, MONTHS_12);
    await insertWaitlist(waitlistHeld, 'exact', now, MONTHS_12);

    const anon = `retention-anon-${randomBytes(4).toString('hex')}`;
    await query(
      'INSERT INTO anonymous_generations (subject_hash) VALUES ($1)',
      [anon],
    );

    const skipped = await deleteUserAccountDetail(youngerId, { now, months: MONTHS_24 });
    assert.equal(skipped.result, 'skipped');
    assert.equal(await countWhere('SELECT count(*)::int AS n FROM generations WHERE user_id = $1', [youngerId]), 1);

    const lines = await captureLogs(async () => {
      const first = await runRetentionCleanup({ now });
      assert.deepEqual(counts(first), {
        dryRun: false,
        waitlistDeleted: 2,
        accountsDeleted: 2,
        generationsDeleted: 2,
        creditTransactionsDeleted: 1,
        truncated: false,
      });
      const second = await runRetentionCleanup({ now });
      assert.deepEqual(counts(second), {
        dryRun: false,
        waitlistDeleted: 0,
        accountsDeleted: 0,
        generationsDeleted: 0,
        creditTransactionsDeleted: 0,
        truncated: false,
      });
    });
    const logs = retentionLogs(lines);
    assert.equal(logs.length, 2);
    assert.equal(logs[0]?.action, 'delete');
    assert.equal(logs[0]?.waitlistMonths, MONTHS_12);
    assert.equal(logs[0]?.accountMonths, MONTHS_24);
    assert.equal(lines.join('\n').includes('@'), false);

    for (const gone of [expiredId, olderId]) {
      assert.equal(await countWhere('SELECT count(*)::int AS n FROM users WHERE id = $1', [gone]), 0);
      assert.equal(await countWhere('SELECT count(*)::int AS n FROM generations WHERE user_id = $1', [gone]), 0);
      assert.equal(await countWhere('SELECT count(*)::int AS n FROM credit_transactions WHERE user_id = $1', [gone]), 0);
    }
    assert.equal(await countWhere('SELECT count(*)::int AS n FROM users WHERE id = $1', [youngerId]), 1);
    assert.equal(await countWhere('SELECT count(*)::int AS n FROM users WHERE id = $1', [recentId]), 1);
    assert.equal(await countWhere('SELECT count(*)::int AS n FROM generations WHERE user_id = $1', [youngerId]), 1);
    assert.equal(await countWhere('SELECT count(*)::int AS n FROM generations WHERE output = $1', ['recent draft']), 1);
    assert.equal(await countWhere('SELECT count(*)::int AS n FROM credit_transactions WHERE user_id = $1', [youngerId]), 1);
    assert.equal(await countWhere('SELECT count(*)::int AS n FROM anonymous_generations WHERE subject_hash = $1', [anon]), 1);

    const remainingWaitlist = await query<{ email: string }>(
      `SELECT email FROM waitlist_signups WHERE lower(btrim(email)) = ANY($1::text[]) ORDER BY lower(btrim(email))`,
      [[waitlistExact, waitlistOlder, waitlistYounger, waitlistFresh, holder]],
    );
    assert.deepEqual(
      remainingWaitlist.map((row) => row.email.trim().toLowerCase()).sort(),
      [waitlistFresh, waitlistYounger, holder].sort(),
    );
  });

  test('dry-run reports an expired account and its old waitlist email without deleting either', async () => {
    const now = new Date();
    await prepare(now);
    const email = address('dry');
    const userId = await insertUser(email, 'exact', now, MONTHS_24);
    await insertGeneration(userId, 'dry draft');
    await insertCredit(userId);
    await insertWaitlist(email.toUpperCase(), 'exact', now, MONTHS_12);
    await insertWaitlist(address('dry-fresh'), 'recent', now, MONTHS_12);

    const lines = await captureLogs(async () => {
      const report = await runRetentionCleanup({ now, dryRun: true });
      assert.equal(report.dryRun, true);
      assert.equal(report.waitlistDeleted, 1);
      assert.equal(report.accountsDeleted, 1);
      assert.equal(report.generationsDeleted, 1);
      assert.equal(report.creditTransactionsDeleted, 1);
      assert.equal(report.truncated, false);
    });
    assert.equal(retentionLogs(lines)[0]?.action, 'dry_run');
    assert.equal(lines.join('\n').includes(email), false);
    assert.equal(await countWhere('SELECT count(*)::int AS n FROM users WHERE id = $1', [userId]), 1);
    assert.equal(await countWhere('SELECT count(*)::int AS n FROM generations WHERE user_id = $1', [userId]), 1);
    assert.equal(await countWhere(
      'SELECT count(*)::int AS n FROM waitlist_signups WHERE lower(btrim(email)) = $1',
      [email],
    ), 1);

    const live = await runRetentionCleanup({ now });
    assert.equal(live.accountsDeleted, 1);
    assert.equal(live.waitlistDeleted, 1);
    assert.equal(await countWhere('SELECT count(*)::int AS n FROM users WHERE id = $1', [userId]), 0);
    assert.equal(await countWhere(
      'SELECT count(*)::int AS n FROM waitlist_signups WHERE lower(btrim(email)) = $1',
      [email],
    ), 0);
  });

  test('waits for the next run when a batch is full', async () => {
    const now = new Date();
    await prepare(now);
    const first = await insertUser(address('batch-a'), 'exact', now, MONTHS_24);
    const second = await insertUser(address('batch-b'), 'exact', now, MONTHS_24);
    await insertGeneration(first, 'batch a');
    await insertGeneration(second, 'batch b');
    await insertWaitlist(address('batch-w1'), 'older', now, MONTHS_12);
    await insertWaitlist(address('batch-w2'), 'older', now, MONTHS_12);
    await insertWaitlist(address('batch-w3'), 'older', now, MONTHS_12);

    const pass1 = await runRetentionCleanup({ now, batchSize: 1, maxBatches: 1 });
    assert.equal(pass1.accountsDeleted, 1);
    assert.equal(pass1.generationsDeleted, 1);
    assert.equal(pass1.waitlistDeleted, 1);
    assert.equal(pass1.truncated, true);
    assert.equal(await countWhere(
      'SELECT count(*)::int AS n FROM users WHERE id = ANY($1::text[])',
      [[first, second]],
    ), 1);

    const pass2 = await runRetentionCleanup({ now, batchSize: 1, maxBatches: 1 });
    assert.equal(pass2.accountsDeleted, 1);
    assert.equal(pass2.generationsDeleted, 1);
    assert.equal(pass2.waitlistDeleted, 1);
    assert.equal(pass2.truncated, true);

    const pass3 = await runRetentionCleanup({ now, batchSize: 1, maxBatches: 1 });
    assert.equal(pass3.accountsDeleted, 0);
    assert.equal(pass3.generationsDeleted, 0);
    assert.equal(pass3.waitlistDeleted, 1);
    assert.equal(pass3.truncated, false);
    assert.equal(await countWhere(
      'SELECT count(*)::int AS n FROM users WHERE id = ANY($1::text[])',
      [[first, second]],
    ), 0);
    assert.equal(await countWhere(
      'SELECT count(*)::int AS n FROM generations WHERE user_id = ANY($1::text[])',
      [[first, second]],
    ), 0);

    const pass4 = await runRetentionCleanup({ now, batchSize: 1, maxBatches: 1 });
    assert.equal(pass4.waitlistDeleted, 0);
    assert.equal(pass4.accountsDeleted, 0);
    assert.equal(pass4.truncated, false);
  });
});

describe('POST and GET /api/cron/retention', () => {
  test('rejects public callers, honors dry-run, and deletes only with the cron secret', async () => {
    const now = new Date();
    await prepare(now);
    const email = address('http');
    const userId = await insertUser(email, 'older', now, MONTHS_24);
    await insertGeneration(userId, 'http draft');
    await insertWaitlist(address('http-wait'), 'exact', now, MONTHS_12);
    const secret = randomBytes(24).toString('hex');
    const previousSecret = process.env.CRON_SECRET;
    const previousDry = process.env.RETENTION_DRY_RUN;

    try {
      setEnv('CRON_SECRET', undefined);
      const closed = await invoke(retentionHandler, { method: 'GET' });
      assert.equal(closed.status, 404);
      assert.equal(closed.body.ok, false);

      setEnv('CRON_SECRET', secret);
      const lines = await captureLogs(async () => {
        const anonymous = await invoke(retentionHandler, { method: 'GET' });
        assert.equal(anonymous.status, 404);
        const wrong = await invoke(retentionHandler, {
          method: 'GET',
          headers: { authorization: 'Bearer not-the-secret' },
        });
        assert.equal(wrong.status, 404);
        const wrongMethod = await invoke(retentionHandler, {
          method: 'PUT',
          headers: { authorization: `Bearer ${secret}` },
        });
        assert.equal(wrongMethod.status, 405);

        const postDry = await invoke(retentionHandler, {
          method: 'POST',
          headers: { authorization: `Bearer ${secret}` },
          body: { dryRun: true },
        });
        assert.equal(postDry.status, 200);
        assert.equal(postDry.body.dryRun, true);
        assert.equal(postDry.body.accountsDeleted, 1);
        assert.equal(postDry.body.waitlistDeleted, 1);
        assert.equal(JSON.stringify(postDry.body).includes('@'), false);

        const getDry = await invoke(retentionHandler, {
          method: 'GET',
          query: { dryRun: 'yes' },
          headers: { authorization: `Bearer ${secret}` },
        });
        assert.equal(getDry.status, 200);
        assert.equal(getDry.body.dryRun, true);

        setEnv('RETENTION_DRY_RUN', '1');
        const forced = await invoke(retentionHandler, {
          method: 'GET',
          headers: { authorization: `Bearer ${secret}` },
        });
        assert.equal(forced.status, 200);
        assert.equal(forced.body.dryRun, true);
        assert.equal(await countWhere('SELECT count(*)::int AS n FROM users WHERE id = $1', [userId]), 1);

        setEnv('RETENTION_DRY_RUN', undefined);
        const live = await invoke(retentionHandler, {
          method: 'GET',
          headers: { authorization: `Bearer ${secret}` },
        });
        assert.equal(live.status, 200);
        assert.equal(live.body.ok, true);
        assert.equal(live.body.dryRun, false);
        assert.equal(live.body.accountsDeleted, 1);
        assert.equal(live.body.generationsDeleted, 1);
        assert.equal(live.body.waitlistDeleted, 1);
        assert.equal(JSON.stringify(live.body).includes(email), false);
      });

      assert.equal(lines.join('\n').includes(email), false);
      assert.equal(lines.join('\n').includes(secret), false);
      assert.equal(await countWhere('SELECT count(*)::int AS n FROM users WHERE id = $1', [userId]), 0);
      assert.equal(await countWhere('SELECT count(*)::int AS n FROM generations WHERE user_id = $1', [userId]), 0);
      const logged = retentionLogs(lines);
      assert.ok(logged.length >= 2);
      assert.equal(logged.some((entry) => entry.action === 'dry_run'), true);
      assert.equal(logged.some((entry) => entry.action === 'delete'), true);
    } finally {
      setEnv('CRON_SECRET', previousSecret);
      setEnv('RETENTION_DRY_RUN', previousDry);
    }
  });
});

describe('sign-in stamp', () => {
  test('registration, login, and recordSignIn update last_sign_in_at', async () => {
    const email = address('login');
    const password = 'retention-login-password';
    const registered = await invoke(registerHandler, {
      method: 'POST',
      body: { email, password },
    });
    assert.equal(registered.status, 200);
    const userId = registered.body.user.id as string;
    const created = await query<{ last_sign_in_at: Date | string }>(
      'SELECT last_sign_in_at FROM users WHERE id = $1',
      [userId],
    );
    const createdAt = new Date(created[0]?.last_sign_in_at ?? 0).getTime();
    assert.ok(Math.abs(createdAt - Date.now()) < 60_000);

    await query(
      `UPDATE users SET last_sign_in_at = '2020-01-01T00:00:00.000Z' WHERE id = $1`,
      [userId],
    );
    const loggedIn = await invoke(loginHandler, {
      method: 'POST',
      body: { email, password },
    });
    assert.equal(loggedIn.status, 200);
    const refreshed = await query<{ last_sign_in_at: Date | string }>(
      'SELECT last_sign_in_at FROM users WHERE id = $1',
      [userId],
    );
    const refreshedAt = new Date(refreshed[0]?.last_sign_in_at ?? 0).getTime();
    assert.ok(refreshedAt > Date.parse('2021-01-01T00:00:00.000Z'));
    assert.ok(Math.abs(refreshedAt - Date.now()) < 60_000);

    const signedInAt = new Date('2024-05-01T00:00:00.000Z');
    await recordSignIn(userId, signedInAt);
    const stamped = await query<{ last_sign_in_at: Date | string }>(
      'SELECT last_sign_in_at FROM users WHERE id = $1',
      [userId],
    );
    assert.equal(new Date(stamped[0]?.last_sign_in_at ?? 0).toISOString(), signedInAt.toISOString());
    await assert.rejects(() => recordSignIn('missing-retention-user'));
    await assert.rejects(() => recordSignIn(''));
  });
});

function counts(report: RetentionReport) {
  return {
    dryRun: report.dryRun,
    waitlistDeleted: report.waitlistDeleted,
    accountsDeleted: report.accountsDeleted,
    generationsDeleted: report.generationsDeleted,
    creditTransactionsDeleted: report.creditTransactionsDeleted,
    truncated: report.truncated,
  };
}
