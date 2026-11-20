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
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_sign_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

    // Existing accounts had no sign-in history. Stamp them at migration time
    // so the 24-month job does not treat "unknown" as "inactive for years".
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ
    `);
    await client.query(`
      UPDATE users SET last_sign_in_at = NOW() WHERE last_sign_in_at IS NULL
    `);
    await client.query(`
      ALTER TABLE users ALTER COLUMN last_sign_in_at SET DEFAULT NOW()
    `);
    await client.query(`
      ALTER TABLE users ALTER COLUMN last_sign_in_at SET NOT NULL
    `);
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_users_last_sign_in_at ON users (last_sign_in_at)'
    );

    // No waitlist form exists yet. Rows land here when one is added.
    // Retention deletes an address 12 months after created_at if it never became an account.
    await client.query(`
      CREATE TABLE IF NOT EXISTS waitlist_signups (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_signups_email
      ON waitlist_signups (lower(btrim(email)))
    `);
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created_at ON waitlist_signups (created_at)'
    );

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
