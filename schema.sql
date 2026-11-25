-- PitchCrafter database schema.
-- Applied by `npm run db:init` / `POST /api/init-db` (see lib/initSchema.ts).
-- This file is the SQL form of that initializer.

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
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
);

-- Credit transactions table for audit trail
CREATE TABLE IF NOT EXISTS credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One anonymous free generation per client address. The address is stored as a keyed hash, not in clear text.
CREATE TABLE IF NOT EXISTS anonymous_generations (
  subject_hash TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-user generation history
CREATE TABLE IF NOT EXISTS generations (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL,
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  output TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Waitlist addresses. PitchCrafter does not collect these yet.
-- Retention deletes a row 12 months after created_at when no users.email matches.
CREATE TABLE IF NOT EXISTS waitlist_signups (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Google sign-in link. Subject id, email, and name only. No profile photo.
CREATE TABLE IF NOT EXISTS google_accounts (
  google_sub TEXT PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One-time Android sign-in codes. The raw code and the bearer token are not stored.
-- code_hash is SHA-256 of the code. code_challenge is the app's S256 PKCE challenge.
-- expires_at is at most 60 seconds after creation.
CREATE TABLE IF NOT EXISTS google_mobile_codes (
  code_hash TEXT PRIMARY KEY,
  code_challenge TEXT NOT NULL,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_account BOOLEAN NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Existing databases: users may predate last_sign_in_at.
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;
UPDATE users SET last_sign_in_at = NOW() WHERE last_sign_in_at IS NULL;
ALTER TABLE users ALTER COLUMN last_sign_in_at SET DEFAULT NOW();
ALTER TABLE users ALTER COLUMN last_sign_in_at SET NOT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_sign_in_at ON users (last_sign_in_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_user_created ON generations (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_signups_email ON waitlist_signups (lower(btrim(email)));
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created_at ON waitlist_signups (created_at);
