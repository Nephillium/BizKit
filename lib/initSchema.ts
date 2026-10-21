import { pool } from './db';

export const GENERATIONS_DDL = `
  CREATE TABLE IF NOT EXISTS generations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool_type TEXT NOT NULL,
    inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
    output TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

export async function initSchema(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        credits INTEGER DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'usage_count'
        ) THEN
          ALTER TABLE users ADD COLUMN usage_count INTEGER DEFAULT 0;
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id)'
    );

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS anonymous_generations (
        subject_hash TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(GENERATIONS_DDL);
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_generations_user_created ON generations (user_id, created_at DESC)'
    );
  } finally {
    client.release();
  }
}
