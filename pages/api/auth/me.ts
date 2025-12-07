import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest, getUserWithCredits } from '../../../lib/users';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const jwtPayload = getUserFromRequest(req.headers.cookie);

    if (!jwtPayload) {
      return res.status(200).json({ ok: true, user: null });
    }

    const user = await getUserWithCredits(jwtPayload.userId);

    if (!user) {
      return res.status(200).json({ 
        ok: true, 
        user: {
          id: jwtPayload.userId,
          email: jwtPayload.email,
          role: jwtPayload.role,
          credits: 0,
        }
      });
    }

    return res.status(200).json({ 
      ok: true, 
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
