import { Pool, type PoolConfig } from 'pg';

let connectionString = process.env.DATABASE_URL || '';
if (connectionString.startsWith('psql ')) {
  connectionString = connectionString.replace(/^psql\s+/, '').replace(/^'|'$/g, '');
}

/** Local Postgres has no TLS. Hosted providers usually require it. */
export function databaseSsl(connectionString: string): PoolConfig['ssl'] {
  if (!connectionString) return undefined;
  let host = '';
  let sslmode: string | null = null;
  try {
    const url = new URL(connectionString);
    host = url.hostname;
    sslmode = url.searchParams.get('sslmode');
  } catch {
    return undefined;
  }
  if (sslmode === 'disable') return false;
  if (
    sslmode === 'require' ||
    sslmode === 'verify-ca' ||
    sslmode === 'verify-full' ||
    sslmode === 'no-verify'
  ) {
    return { rejectUnauthorized: sslmode === 'verify-ca' || sslmode === 'verify-full' };
  }
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
  return { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: databaseSsl(connectionString),
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export async function execute(text: string, params?: any[]): Promise<number> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rowCount || 0;
  } finally {
    client.release();
  }
}

export { pool };
