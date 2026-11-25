import { pool } from './db';

/**
 * Additive Google tables and the sign-in timestamp, matching lib/initSchema.ts.
 * Existing rows keep a last_sign_in_at that is already set. Only nulls are filled.
 */
export const GOOGLE_SCHEMA_STATEMENTS = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ`,
  `UPDATE users SET last_sign_in_at = NOW() WHERE last_sign_in_at IS NULL`,
  `ALTER TABLE users ALTER COLUMN last_sign_in_at SET DEFAULT NOW()`,
  `ALTER TABLE users ALTER COLUMN last_sign_in_at SET NOT NULL`,
  `CREATE INDEX IF NOT EXISTS idx_users_last_sign_in_at ON users (last_sign_in_at)`,
  `CREATE TABLE IF NOT EXISTS google_accounts (
        google_sub TEXT PRIMARY KEY,
        user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
  `CREATE TABLE IF NOT EXISTS google_mobile_codes (
        code_hash TEXT PRIMARY KEY,
        code_challenge TEXT NOT NULL,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_account BOOLEAN NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
] as const;

export type SchemaCache = { current: Promise<void> | null };

export function cachedOnce(cache: SchemaCache, start: () => Promise<void>): Promise<void> {
  if (!cache.current) {
    const task = start().catch((error: unknown) => {
      if (cache.current === task) cache.current = null;
      throw error;
    });
    cache.current = task;
  }
  return cache.current;
}

const cache: SchemaCache = { current: null };

export function resetGoogleSchemaCache(): void {
  cache.current = null;
}

/** Postgres duplicate_table. Concurrent IF NOT EXISTS can still raise this. */
export function isAlreadyExistsError(error: unknown): boolean {
  return Boolean(
    error
    && typeof error === 'object'
    && (error as { code?: unknown }).code === '42P07',
  );
}

export async function applyGoogleSchema(exec: (sql: string) => Promise<unknown>): Promise<void> {
  for (const statement of GOOGLE_SCHEMA_STATEMENTS) {
    try {
      await exec(statement);
    } catch (error) {
      if (!isAlreadyExistsError(error)) throw error;
    }
  }
}

/** Create the Google tables once per process. A failed attempt can run again. */
export function ensureGoogleSchema(): Promise<void> {
  return cachedOnce(cache, () => applyGoogleSchema((sql) => pool.query(sql)));
}
