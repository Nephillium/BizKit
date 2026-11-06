import type { NextApiRequest, NextApiResponse } from 'next';
import { handleRegister } from '../../../lib/authHandlers';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleRegister(req, res);
}
