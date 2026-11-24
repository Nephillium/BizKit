import type { NextApiRequest, NextApiResponse } from 'next';
import { handleGoogleNative } from '../../../../lib/googleAuthHandlers';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleGoogleNative(req, res);
}
