import type { NextApiRequest } from 'next';
import { resolveClientAddress } from './anonymousQuota';

/**
 * Per client address, per route, inside one server process.
 * The address is the socket peer unless TRUST_PROXY is `1` or `true`.
 * On Vercel that peer is the platform proxy, so every visitor would share
 * one bucket. TRUST_PROXY=1 uses the rightmost X-Forwarded-For entry, which
 * is the visitor when Vercel is the only trusted hop. Leave it unset when
 * the process is reached directly.
 */
export const AUTH_RATE_LIMIT = 20;
export const AUTH_RATE_WINDOW_MS = 60_000;

type Bucket = { start: number; count: number };

const buckets = new Map<string, Bucket>();

function trustProxy(): boolean {
  const value = (process.env.TRUST_PROXY || '').toLowerCase();
  return value === '1' || value === 'true';
}

export function clientAddressFromRequest(req: NextApiRequest): string {
  return resolveClientAddress({
    remoteAddress: req.socket?.remoteAddress,
    forwardedFor: req.headers['x-forwarded-for'],
    trustProxy: trustProxy(),
  });
}

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now - bucket.start >= AUTH_RATE_WINDOW_MS) buckets.delete(key);
  }
}

/** True when this attempt is still inside the window. Expired buckets are removed. */
export function allowAuthAttempt(
  route: string,
  address: string,
  now = Date.now(),
  limit = AUTH_RATE_LIMIT,
): boolean {
  pruneExpired(now);
  const key = `${route}\n${address}`;
  const existing = buckets.get(key);
  if (!existing) {
    buckets.set(key, { start: now, count: 1 });
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

export function authRateLimitBucketCount(): number {
  return buckets.size;
}

export function resetAuthRateLimits(): void {
  buckets.clear();
}
