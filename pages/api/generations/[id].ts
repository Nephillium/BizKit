import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '../../../lib/session';
import { deleteGeneration } from '../../../lib/generations';

// Deletes only the signed-in user's row. A matching id owned by someone else
// is reported as not_found so the route does not reveal that it exists.
// Auth is the shared session helper: httpOnly cookie or Authorization: Bearer.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const user = getSessionFromRequest(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'not_authenticated' });
  }

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ ok: false, error: 'invalid_id' });
  }

  const removed = await deleteGeneration(user.id, id);
  if (!removed) {
    return res.status(404).json({ ok: false, error: 'not_found' });
  }
  return res.status(200).json({ ok: true });
}
