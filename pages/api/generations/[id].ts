import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../../../lib/users';
import { deleteGeneration } from '../../../lib/generations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const user = getUserFromRequest(req.headers.cookie, req.headers.authorization);
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
