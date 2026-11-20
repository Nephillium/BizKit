import type { NextApiRequest, NextApiResponse } from 'next';
import { handleGoogleStart } from '../../../../lib/googleAuthHandlers';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleGoogleStart(req, res);
}
