import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '../../../lib/session';
import { createGeneration, listGenerations, parseGenerationListFilter } from '../../../lib/generations';

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getSessionFromRequest(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'not_authenticated' });
  }

  if (req.method === 'GET') {
    const parsed = parseGenerationListFilter({
      tool: firstQueryValue(req.query.tool),
      query: firstQueryValue(req.query.q),
    });
    if (!parsed.ok) {
      return res.status(400).json({ ok: false, error: parsed.error });
    }
    const generations = await listGenerations(user.id, parsed.filter);
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
