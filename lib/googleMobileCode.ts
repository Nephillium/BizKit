import { createHash, randomBytes } from 'node:crypto';
import { pool, query } from './db';
import {
  mobileAuthCode,
  mobileCodeChallenge,
  mobilePkceVerifier,
  pkceChallenge,
  safeEqualString,
} from './googleOAuth';

/** A deep-link code is valid for at most 60 seconds. */
export const MOBILE_CODE_TTL_MS = 60_000;

export function hashMobileCode(code: string): string {
  return createHash('sha256').update(code).digest('base64url');
}

export function createMobileAuthCode(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Store only the hash of the one-time code, bound to the app's PKCE challenge.
 * The bearer token is not stored and is not put in the redirect.
 */
export async function saveMobileAuthCode(input: {
  code: string;
  codeChallenge: string;
  userId: string;
  created: boolean;
  now?: Date;
}): Promise<void> {
  const code = mobileAuthCode(input.code);
  const codeChallenge = mobileCodeChallenge(input.codeChallenge);
  if (!code || !codeChallenge) {
    throw new Error('invalid_mobile_code');
  }
  const now = input.now ?? new Date();
  const expiresAt = new Date(now.getTime() + MOBILE_CODE_TTL_MS);
  await query(
    `INSERT INTO google_mobile_codes (code_hash, code_challenge, user_id, created_account, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [hashMobileCode(code), codeChallenge, input.userId, input.created, expiresAt],
  );
}

export type RedeemMobileCodeResult =
  | { ok: true; userId: string; created: boolean }
  | { ok: false; error: 'invalid_code' | 'expired' | 'invalid_verifier' };

/**
 * Redeem a mobile code once. A wrong verifier does not grant a session.
 * A successful redeem deletes the row, so a replay fails. An expired row is deleted.
 */
export async function redeemMobileAuthCode(input: {
  code: string;
  verifier: string;
  now?: Date;
}): Promise<RedeemMobileCodeResult> {
  const code = mobileAuthCode(input.code);
  if (!code) return { ok: false, error: 'invalid_code' };
  const verifier = mobilePkceVerifier(input.verifier);
  if (!verifier) return { ok: false, error: 'invalid_verifier' };

  const now = input.now ?? new Date();
  const codeHash = hashMobileCode(code);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query<{
      code_challenge: string;
      user_id: string;
      created_account: boolean;
      expires_at: Date | string;
    }>(
      `SELECT code_challenge, user_id, created_account, expires_at
       FROM google_mobile_codes
       WHERE code_hash = $1
       FOR UPDATE`,
      [codeHash],
    );
    const row = found.rows[0];
    if (!row) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'invalid_code' };
    }
    const expiresAt = row.expires_at instanceof Date ? row.expires_at : new Date(row.expires_at);
    if (expiresAt.getTime() <= now.getTime()) {
      await client.query('DELETE FROM google_mobile_codes WHERE code_hash = $1', [codeHash]);
      await client.query('COMMIT');
      return { ok: false, error: 'expired' };
    }
    if (!safeEqualString(pkceChallenge(verifier), row.code_challenge)) {
      await client.query('ROLLBACK');
      return { ok: false, error: 'invalid_verifier' };
    }
    const deleted = await client.query(
      'DELETE FROM google_mobile_codes WHERE code_hash = $1',
      [codeHash],
    );
    await client.query('COMMIT');
    if ((deleted.rowCount ?? 0) !== 1) {
      return { ok: false, error: 'invalid_code' };
    }
    return { ok: true, userId: row.user_id, created: row.created_account === true };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // The transaction is already closed.
    }
    throw error;
  } finally {
    client.release();
  }
}
