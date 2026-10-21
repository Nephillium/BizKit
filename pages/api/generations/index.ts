import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '../../../lib/users';
import { createGeneration, listGenerations } from '../../../lib/generations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromRequest(req.headers.cookie, req.headers.authorization);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'not_authenticated' });
  }

  if (req.method === 'GET') {
    const generations = await listGenerations(user.id);
    return res.status(200).json(generations);
  }

  if (req.method === 'POST') {
    const { toolType, inputs, output } = req.body ?? {};
    const result = await createGeneration(user.id, toolType, inputs, output);
    if (result.error || !result.generation) {
      return res.status(400).json({ ok: false, error: result.error || 'save_failed' });
    }
    return res.status(201).json(result.generation);
  }

  return res.status(405).json({ ok: false, error: 'method_not_allowed' });
}
