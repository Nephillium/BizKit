import crypto from 'crypto';

/**
 * CRON_SECRET must be sent as `Authorization: Bearer <CRON_SECRET>`.
 * A missing, empty, or mismatched secret is rejected. The secret is never logged.
 */
export function requestHasCronSecret(
  authorization: string | string[] | undefined,
  secret: string | undefined,
): boolean {
  const expected = secret ?? '';
  if (expected.length === 0) return false;
  if (Array.isArray(authorization)) {
    if (authorization.length !== 1) return false;
  }
  const header = Array.isArray(authorization) ? authorization[0] ?? '' : authorization ?? '';
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!match) return false;
  const supplied = match[1];
  const expectedBuf = Buffer.from(expected);
  const suppliedBuf = Buffer.from(supplied);
  if (expectedBuf.length !== suppliedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, suppliedBuf);
}
