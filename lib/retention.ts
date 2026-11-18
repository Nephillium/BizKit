import { deleteUserAccountDetail } from './accountDeletion';
import { query, queryOne } from './db';

export const WAITLIST_RETENTION_MONTHS = 12;
export const ACCOUNT_RETENTION_MONTHS = 24;
export const DEFAULT_RETENTION_BATCH_SIZE = 100;
export const DEFAULT_RETENTION_MAX_BATCHES = 25;

export type RetentionReport = {
  dryRun: boolean;
  waitlistDeleted: number;
  accountsDeleted: number;
  generationsDeleted: number;
  creditTransactionsDeleted: number;
  truncated: boolean;
};

type CleanupOptions = {
  dryRun?: boolean;
  now?: Date;
  batchSize?: number;
  maxBatches?: number;
};

type WaitlistProgress = {
  count: number;
  truncated: boolean;
};

type AccountProgress = {
  accountsDeleted: number;
  generationsDeleted: number;
  creditTransactionsDeleted: number;
  truncated: boolean;
};

function boundedInt(value: number | undefined, fallback: number, max: number, label: string): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new Error(`${label} must be an integer from 1 to ${max}`);
  }
  return value;
}

function asCount(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Delete expired waitlist rows and inactive accounts.
 * Idempotent: a second run deletes nothing that the first run already removed.
 * Accounts are removed with deleteUserAccountDetail so generations and credit
 * history follow the same rules as self-service deletion. Anonymous quota
 * hashes are not accounts. Stripe charges stay at Stripe; this database does
 * not store them and this job does not call Stripe.
 *
 * Dry-run reports the full set that a completed run would delete. A live run
 * stops after maxBatches and sets truncated so the next invocation continues.
 */
export async function runRetentionCleanup(options: CleanupOptions = {}): Promise<RetentionReport> {
  const dryRun = options.dryRun === true;
  const now = options.now ?? new Date();
  const batchSize = boundedInt(options.batchSize, DEFAULT_RETENTION_BATCH_SIZE, 500, 'batchSize');
  const maxBatches = boundedInt(options.maxBatches, DEFAULT_RETENTION_MAX_BATCHES, 100, 'maxBatches');

  const accounts = dryRun
    ? await countExpiredAccounts(now)
    : await deleteExpiredAccounts(now, batchSize, maxBatches);
  const waitlist = dryRun
    ? await countExpiredWaitlist(now)
    : await deleteExpiredWaitlist(now, batchSize, maxBatches);

  const report: RetentionReport = {
    dryRun,
    waitlistDeleted: waitlist.count,
    accountsDeleted: accounts.accountsDeleted,
    generationsDeleted: accounts.generationsDeleted,
    creditTransactionsDeleted: accounts.creditTransactionsDeleted,
    truncated: accounts.truncated || waitlist.truncated,
  };

  console.log(JSON.stringify({
    event: 'retention_cleanup',
    action: dryRun ? 'dry_run' : 'delete',
    waitlistMonths: WAITLIST_RETENTION_MONTHS,
    accountMonths: ACCOUNT_RETENTION_MONTHS,
    waitlistDeleted: report.waitlistDeleted,
    accountsDeleted: report.accountsDeleted,
    generationsDeleted: report.generationsDeleted,
    creditTransactionsDeleted: report.creditTransactionsDeleted,
    truncated: report.truncated,
  }));

  return report;
}

async function countExpiredAccounts(now: Date): Promise<AccountProgress> {
  const params = [now, ACCOUNT_RETENTION_MONTHS];
  const accounts = await queryOne<{ n: number }>(
    `SELECT count(*)::int AS n
     FROM users
     WHERE last_sign_in_at IS NOT NULL
       AND last_sign_in_at <= $1::timestamptz - ($2::int * interval '1 month')`,
    params,
  );
  const generations = await queryOne<{ n: number }>(
    `SELECT count(*)::int AS n
     FROM generations g
     WHERE EXISTS (
       SELECT 1 FROM users u
       WHERE u.id = g.user_id
         AND u.last_sign_in_at IS NOT NULL
         AND u.last_sign_in_at <= $1::timestamptz - ($2::int * interval '1 month')
     )`,
    params,
  );
  const credits = await queryOne<{ n: number }>(
    `SELECT count(*)::int AS n
     FROM credit_transactions c
     WHERE EXISTS (
       SELECT 1 FROM users u
       WHERE u.id = c.user_id
         AND u.last_sign_in_at IS NOT NULL
         AND u.last_sign_in_at <= $1::timestamptz - ($2::int * interval '1 month')
     )`,
    params,
  );
  return {
    accountsDeleted: asCount(accounts?.n),
    generationsDeleted: asCount(generations?.n),
    creditTransactionsDeleted: asCount(credits?.n),
    truncated: false,
  };
}

async function deleteExpiredAccounts(
  now: Date,
  batchSize: number,
  maxBatches: number,
): Promise<AccountProgress> {
  const progress: AccountProgress = {
    accountsDeleted: 0,
    generationsDeleted: 0,
    creditTransactionsDeleted: 0,
    truncated: false,
  };

  for (let batch = 0; batch < maxBatches; batch += 1) {
    const ids = await query<{ id: string }>(
      `SELECT id
       FROM users
       WHERE last_sign_in_at IS NOT NULL
         AND last_sign_in_at <= $1::timestamptz - ($2::int * interval '1 month')
       ORDER BY last_sign_in_at, id
       LIMIT $3`,
      [now, ACCOUNT_RETENTION_MONTHS, batchSize],
    );
    if (ids.length === 0) return progress;

    let deletedThisBatch = 0;
    for (const row of ids) {
      const detail = await deleteUserAccountDetail(row.id, {
        now,
        months: ACCOUNT_RETENTION_MONTHS,
      });
      if (detail.result !== 'deleted') continue;
      deletedThisBatch += 1;
      progress.accountsDeleted += 1;
      progress.generationsDeleted += detail.generationsDeleted;
      progress.creditTransactionsDeleted += detail.creditTransactionsDeleted;
    }

    if (ids.length < batchSize || deletedThisBatch === 0) return progress;
  }

  const more = await queryOne<{ n: number }>(
    `SELECT count(*)::int AS n
     FROM users
     WHERE last_sign_in_at IS NOT NULL
       AND last_sign_in_at <= $1::timestamptz - ($2::int * interval '1 month')`,
    [now, ACCOUNT_RETENTION_MONTHS],
  );
  progress.truncated = asCount(more?.n) > 0;
  return progress;
}

async function countExpiredWaitlist(now: Date): Promise<WaitlistProgress> {
  const row = await queryOne<{ n: number }>(
    `SELECT count(*)::int AS n
     FROM waitlist_signups w
     WHERE w.created_at <= $1::timestamptz - ($2::int * interval '1 month')
       AND NOT EXISTS (
         SELECT 1 FROM users u
         WHERE lower(btrim(u.email)) = lower(btrim(w.email))
           AND u.last_sign_in_at IS NOT NULL
           AND u.last_sign_in_at > $1::timestamptz - ($3::int * interval '1 month')
       )`,
    [now, WAITLIST_RETENTION_MONTHS, ACCOUNT_RETENTION_MONTHS],
  );
  return { count: asCount(row?.n), truncated: false };
}

async function deleteExpiredWaitlist(
  now: Date,
  batchSize: number,
  maxBatches: number,
): Promise<WaitlistProgress> {
  let count = 0;
  for (let batch = 0; batch < maxBatches; batch += 1) {
    const rows = await query<{ id: string }>(
      `WITH doomed AS (
         SELECT w.id
         FROM waitlist_signups w
         WHERE w.created_at <= $1::timestamptz - ($2::int * interval '1 month')
           AND NOT EXISTS (
             SELECT 1 FROM users u
             WHERE lower(btrim(u.email)) = lower(btrim(w.email))
           )
         ORDER BY w.created_at, w.id
         LIMIT $3
       )
       DELETE FROM waitlist_signups
       WHERE id IN (SELECT id FROM doomed)
       RETURNING id`,
      [now, WAITLIST_RETENTION_MONTHS, batchSize],
    );
    count += rows.length;
    if (rows.length < batchSize) return { count, truncated: false };
  }

  const more = await queryOne<{ n: number }>(
    `SELECT count(*)::int AS n
     FROM waitlist_signups w
     WHERE w.created_at <= $1::timestamptz - ($2::int * interval '1 month')
       AND NOT EXISTS (
         SELECT 1 FROM users u
         WHERE lower(btrim(u.email)) = lower(btrim(w.email))
       )`,
    [now, WAITLIST_RETENTION_MONTHS],
  );
  return { count, truncated: asCount(more?.n) > 0 };
}
