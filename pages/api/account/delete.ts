import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteUserAccount, type AccountDeletionResult } from '../../../lib/accountDeletion';
import { sessionCookie } from '../../../lib/authResponse';
import { getSessionFromRequest } from '../../../lib/session';
import { verifyToken } from '../../../lib/users';

function confirmed(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  return (body as { confirm?: unknown }).confirm === true;
}

function headerValue(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' ? raw.trim() : '';
}

function originOf(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** A valid Bearer token is the mobile app. Cookie sessions are the browser. */
function hasValidBearer(req: NextApiRequest): boolean {
  const authorization = headerValue(req.headers.authorization);
  if (!authorization.toLowerCase().startsWith('bearer ')) return false;
  const token = authorization.slice(authorization.indexOf(' ') + 1).trim();
  return token.length > 0 && verifyToken(token) !== null;
}

/**
 * Cookie-authenticated deletes must come from this app when the browser
 * sends Origin, or Referer when Origin is missing. A missing header is
 * allowed. Bearer requests are not subject to this check.
 */
export function cookieDeleteOriginAllowed(req: NextApiRequest): boolean {
  if (hasValidBearer(req)) return true;

  const originHeader = headerValue(req.headers.origin);
  const refererHeader = headerValue(req.headers.referer);
  const statedHeader = originHeader || refererHeader;
  if (!statedHeader) return true;

  const stated = originOf(statedHeader);
  if (!stated) return false;

  const allowed = new Set<string>();
  const configured = (process.env.APP_BASE_URL || '').trim();
  if (configured) {
    const parsed = originOf(configured);
    if (parsed) allowed.add(parsed);
  }
  const host = headerValue(req.headers.host);
  if (host) {
    const forwarded = headerValue(req.headers['x-forwarded-proto']).split(',')[0].trim();
    const proto = forwarded || 'http';
    const parsed = originOf(`${proto}://${host}`);
    if (parsed) allowed.add(parsed);
  }
  return allowed.has(stated);
}

export async function handleDeleteAccount(
  req: NextApiRequest,
  res: NextApiResponse,
  deleteAccount: (userId: string) => Promise<AccountDeletionResult> = deleteUserAccount,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ ok: false, error: 'not_authenticated' });
  }

  if (!cookieDeleteOriginAllowed(req)) {
    return res.status(403).json({ ok: false, error: 'cross_origin' });
  }

  if (!confirmed(req.body)) {
    return res.status(400).json({ ok: false, error: 'confirmation_required' });
  }

  try {
    const result = await deleteAccount(session.id);
    res.setHeader('Set-Cookie', sessionCookie('', 0));
    if (result === 'missing') {
      return res.status(401).json({ ok: false, error: 'not_authenticated' });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Account deletion failed:', error);
    return res.status(500).json({ ok: false, error: 'delete_failed' });
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleDeleteAccount(req, res);
}
