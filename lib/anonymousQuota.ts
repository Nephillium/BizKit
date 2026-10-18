import { createHash, createHmac } from 'crypto';
import type { NextApiRequest } from 'next';
import { query } from './db';

export const FREE_GENERATION_TTL_DAYS = 365;

export type QuotaClaim = 'claimed' | 'used' | 'unavailable';

const memoryClaims = new Map<string, number>();
let tableReady: Promise<void> | null = null;

export function resolveClientAddress(options: {
  remoteAddress?: string | null;
  forwardedFor?: string | string[] | null;
  trustProxy: boolean;
}): string {
  const remote = normalizeAddress(options.remoteAddress || '');
  if (!options.trustProxy) {
    return remote || 'unknown';
  }

  const header = Array.isArray(options.forwardedFor)
    ? options.forwardedFor.join(',')
    : options.forwardedFor;
  if (!header) {
    return remote || 'unknown';
  }

  const parts = header
    .split(',')
    .map((part) => normalizeAddress(part))
    .filter(Boolean);
  // Trust exactly one proxy: the address it appended is the rightmost entry.
  // Values the client prepended are ignored.
  return parts[parts.length - 1] || remote || 'unknown';
}

export function quotaDecision(
  existingCreatedAtMs: number | null,
  nowMs: number,
  ttlDays: number = FREE_GENERATION_TTL_DAYS
): 'claim' | 'used' {
  if (existingCreatedAtMs === null) return 'claim';
  const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
  return nowMs - existingCreatedAtMs >= ttlMs ? 'claim' : 'used';
}

function normalizeAddress(address: string): string {
  const trimmed = address.trim().toLowerCase();
  if (trimmed.startsWith('::ffff:')) return trimmed.slice('::ffff:'.length);
  return trimmed;
}

function trustProxy(): boolean {
  const value = (process.env.TRUST_PROXY || '').toLowerCase();
  return value === '1' || value === 'true';
}

function subjectHash(address: string): string {
  const salt = process.env.QUOTA_IP_SALT || process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (salt) {
    return createHmac('sha256', salt).update(address).digest('hex');
  }
  return createHash('sha256').update(`bizkit-anonymous-quota|${address}`).digest('hex');
}

function requestSubject(req: NextApiRequest): string {
  const address = resolveClientAddress({
    remoteAddress: req.socket?.remoteAddress,
    forwardedFor: req.headers['x-forwarded-for'],
    trustProxy: trustProxy(),
  });
  return subjectHash(address);
}

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = query(
      `CREATE TABLE IF NOT EXISTS anonymous_generations (
         subject_hash TEXT PRIMARY KEY,
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`
    ).then(() => undefined).catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  return tableReady;
}

async function claimInDatabase(subject: string): Promise<'claimed' | 'used'> {
  await ensureTable();
  // TTL is a code constant, interpolated only after an integer check so the
  // interval does not depend on node-pg parameter typing.
  if (!Number.isInteger(FREE_GENERATION_TTL_DAYS) || FREE_GENERATION_TTL_DAYS < 1) {
    throw new Error('Invalid free-generation TTL');
  }
  const rows = await query<{ subject_hash: string }>(
    `INSERT INTO anonymous_generations (subject_hash)
     VALUES ($1)
     ON CONFLICT (subject_hash) DO UPDATE
     SET created_at = NOW()
     WHERE anonymous_generations.created_at < NOW() - INTERVAL '${FREE_GENERATION_TTL_DAYS} days'
     RETURNING subject_hash`,
    [subject]
  );
  return rows.length > 0 ? 'claimed' : 'used';
}

function claimInMemory(subject: string): QuotaClaim {
  const now = Date.now();
  const decision = quotaDecision(memoryClaims.get(subject) ?? null, now);
  if (decision === 'used') return 'used';
  memoryClaims.set(subject, now);
  return 'claimed';
}

function releaseInMemory(subject: string): void {
  memoryClaims.delete(subject);
}

/**
 * Reserve one anonymous generation for a subject hash.
 * Production fails closed when the database quota cannot be recorded.
 * Development falls back to process memory so a local run without Postgres
 * still enforces the limit for the life of the process.
 */
export async function enforceAnonymousClaim(
  subject: string,
  persist: (subject: string) => Promise<'claimed' | 'used'>
): Promise<QuotaClaim> {
  try {
    return await persist(subject);
  } catch {
    console.error('Anonymous quota store failed');
    if (process.env.NODE_ENV === 'production') {
      return 'unavailable';
    }
    return claimInMemory(subject);
  }
}

export function anonymousSubject(req: NextApiRequest): string {
  return requestSubject(req);
}

/**
 * Reserve the single anonymous generation before calling the model.
 */
export async function claimAnonymousGeneration(req: NextApiRequest): Promise<QuotaClaim> {
  return enforceAnonymousClaim(requestSubject(req), claimInDatabase);
}

export async function releaseAnonymousGeneration(req: NextApiRequest): Promise<void> {
  const subject = requestSubject(req);
  releaseInMemory(subject);
  try {
    await ensureTable();
    await query('DELETE FROM anonymous_generations WHERE subject_hash = $1', [subject]);
  } catch {
    console.error('Anonymous quota release failed');
  }
}
