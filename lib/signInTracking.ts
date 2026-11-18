import { query } from './db';

/**
 * Stamp a successful sign-in on the account.
 *
 * Email/password login and registration call this. Continue with Google
 * should call it after the user row exists and before it issues a session:
 *
 *   import { recordSignIn } from './signInTracking';
 *   await recordSignIn(user.id);
 *
 * Skip it and an existing account keeps its previous stamp, so the 24-month
 * retention job can delete someone who is still signing in with Google.
 * Inserts also default last_sign_in_at to NOW() when the column is omitted.
 */
export async function recordSignIn(userId: string, signedInAt: Date = new Date()): Promise<void> {
  if (typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('recordSignIn requires a user id');
  }
  const rows = await query<{ id: string }>(
    'UPDATE users SET last_sign_in_at = $2 WHERE id = $1 RETURNING id',
    [userId, signedInAt],
  );
  if (rows.length === 0) {
    throw new Error('recordSignIn: account not found');
  }
}
