import type { NextApiRequest, NextApiResponse } from 'next';
import { handleGoogleCallback } from '../../../../lib/googleAuthHandlers';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleGoogleCallback(req, res);
}
