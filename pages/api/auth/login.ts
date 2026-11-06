import type { NextApiRequest, NextApiResponse } from 'next';
import { handleLogin } from '../../../lib/authHandlers';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleLogin(req, res);
}
