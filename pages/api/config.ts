import type { NextApiRequest, NextApiResponse } from 'next';
import { publicRuntimeConfig } from '../../lib/runtimeConfig';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(publicRuntimeConfig());
}
