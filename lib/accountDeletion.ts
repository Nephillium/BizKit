import { pool } from './db';

export type AccountDeletionResult = 'deleted' | 'missing';

export type AccountDeletionDetail = {
  result: 'deleted' | 'missing' | 'skipped';
  generationsDeleted: number;
  creditTransactionsDeleted: number;
};

export type RetentionGuard = {
  now: Date;
  months: number;
};

/**
 * Delete one account and the data stored for it.
 * Generations, credit balance, and credit history go away with the user row.
 * Auth is a stateless JWT, so there is no session table to delete; the route
 * clears the cookie after this commits. Payment records that Stripe already
 * holds are not stored in this database and are not deleted here.
 *
 * Pass a retention guard to skip the delete when last_sign_in_at is newer
 * than the cutoff. The check runs in the same transaction as the delete, so
 * a sign-in that lands after the cleanup selected this id is kept.
 */
export async function deleteUserAccountDetail(
  userId: string,
  guard?: RetentionGuard,
): Promise<AccountDeletionDetail> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const params: unknown[] = [userId];
    let dueSql = 'TRUE';
    if (guard) {
      params.push(guard.now, guard.months);
      dueSql = `(last_sign_in_at IS NOT NULL AND last_sign_in_at <= $2::timestamptz - ($3::int * interval '1 month'))`;
    }
    const existing = await client.query<{ due: boolean }>(
      `SELECT ${dueSql} AS due FROM users WHERE id = $1 FOR UPDATE`,
      params,
    );
    if ((existing.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK');
      return { result: 'missing', generationsDeleted: 0, creditTransactionsDeleted: 0 };
    }
    if (guard && existing.rows[0]?.due !== true) {
      await client.query('ROLLBACK');
      return { result: 'skipped', generationsDeleted: 0, creditTransactionsDeleted: 0 };
    }

    const generations = await client.query('DELETE FROM generations WHERE user_id = $1', [userId]);
    const credits = await client.query('DELETE FROM credit_transactions WHERE user_id = $1', [userId]);
    const deleted = await client.query('DELETE FROM users WHERE id = $1', [userId]);
    if ((deleted.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK');
      return { result: 'missing', generationsDeleted: 0, creditTransactionsDeleted: 0 };
    }

    await client.query('COMMIT');
    return {
      result: 'deleted',
      generationsDeleted: generations.rowCount ?? 0,
      creditTransactionsDeleted: credits.rowCount ?? 0,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteUserAccount(userId: string): Promise<AccountDeletionResult> {
  const detail = await deleteUserAccountDetail(userId);
  return detail.result === 'deleted' ? 'deleted' : 'missing';
}
