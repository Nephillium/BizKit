import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    // Add missing columns if they don't exist (for migrations)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='usage_count') THEN
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
    await client.query('CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id)');
    
    return res.status(200).json({ ok: true, message: 'Database initialized successfully' });
  } catch (error: any) {
    console.error('Database init error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  } finally {
    client.release();
  }
}
