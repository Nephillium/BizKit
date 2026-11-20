import type { NextApiRequest, NextApiResponse } from 'next';
import { handleGoogleMobileExchange } from '../../../../lib/googleAuthHandlers';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleGoogleMobileExchange(req, res);
}
