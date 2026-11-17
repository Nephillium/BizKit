import type { NextApiRequest, NextApiResponse } from 'next';
import { sessionCookie } from '../../../lib/authResponse';
import { getSessionFromRequest } from '../../../lib/session';
import { findUserById } from '../../../lib/users';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const jwtPayload = getSessionFromRequest(req);

  if (!jwtPayload) {
    return res.status(401).json({ ok: false, user: null, error: 'Not authenticated' });
  }

  const user = await findUserById(jwtPayload.id);

  if (!user) {
    res.setHeader('Set-Cookie', sessionCookie('', 0));
    return res.status(401).json({ ok: false, user: null, error: 'Not authenticated' });
  }

  const { password_hash, ...userWithoutPassword } = user;
  
  return res.status(200).json({ 
    ok: true, 
    user: userWithoutPassword,
  });
}
