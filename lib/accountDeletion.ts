import { pool } from './db';

export type AccountDeletionResult = 'deleted' | 'missing';

/**
 * Delete one account and the data stored for it.
 * Generations, credit balance, and credit history go away with the user row.
 * Auth is a stateless JWT, so there is no session table to delete; the route
 * clears the cookie after this commits. Payment records that Stripe already
 * holds are not stored in this database and are not deleted here.
 */
export async function deleteUserAccount(userId: string): Promise<AccountDeletionResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
    if ((existing.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK');
      return 'missing';
    }

    await client.query('DELETE FROM generations WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM credit_transactions WHERE user_id = $1', [userId]);
    const deleted = await client.query('DELETE FROM users WHERE id = $1', [userId]);
    if ((deleted.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK');
      return 'missing';
    }

    await client.query('COMMIT');
    return 'deleted';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
