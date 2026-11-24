import type { NextApiRequest } from 'next';
import { resolveClientAddress } from './anonymousQuota';

/** Per client address, per route, inside one server process. */
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

/** True when this attempt is still inside the window. */
export function allowAuthAttempt(
  route: string,
  address: string,
  now = Date.now(),
  limit = AUTH_RATE_LIMIT,
): boolean {
  const key = `${route}\n${address}`;
  const existing = buckets.get(key);
  if (!existing || now - existing.start >= AUTH_RATE_WINDOW_MS) {
    buckets.set(key, { start: now, count: 1 });
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

export function resetAuthRateLimits(): void {
  buckets.clear();
}
