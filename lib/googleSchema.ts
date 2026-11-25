import { pool } from './db';

/**
 * Additive Google tables. Same statements as lib/initSchema.ts.
 * IF NOT EXISTS only: a fresh database gains the tables, an existing one is left alone.
 */
export const GOOGLE_SCHEMA_STATEMENTS = [
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

async function runGoogleSchema(exec: (sql: string) => Promise<unknown>): Promise<void> {
  for (const statement of GOOGLE_SCHEMA_STATEMENTS) {
    await exec(statement);
  }
}

/** Create the Google tables once per process. A failed attempt can run again. */
export function ensureGoogleSchema(): Promise<void> {
  return cachedOnce(cache, () => runGoogleSchema((sql) => pool.query(sql)));
}
