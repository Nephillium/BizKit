-- BizKit AI Database Schema
-- This file documents the database structure (already applied to existing DB)

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table (using existing structure with new columns added)
-- Note: The existing table uses VARCHAR id with gen_random_uuid() default
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_subscribed BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR,
  usage_count INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  -- New columns for auth and credits
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  credits INTEGER DEFAULT 0
);

-- Credit transactions table for audit trail
CREATE TABLE IF NOT EXISTS credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
