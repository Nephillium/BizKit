import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteUserAccount, type AccountDeletionResult } from '../../../lib/accountDeletion';
import { sessionCookie } from '../../../lib/authResponse';
import { getSessionFromRequest } from '../../../lib/session';

function confirmed(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  return (body as { confirm?: unknown }).confirm === true;
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
