import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest, findUserById } from '../../../lib/users';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const jwtPayload = getUserFromRequest(req.headers.cookie, req.headers.authorization);

  if (!jwtPayload) {
    return res.status(401).json({ ok: false, user: null, error: 'Not authenticated' });
  }

  const user = await findUserById(jwtPayload.id);

  if (!user) {
    return res.status(200).json({ 
      ok: true, 
      user: {
        id: jwtPayload.id,
        email: jwtPayload.email,
        role: jwtPayload.role,
      }
    });
  }

  const { password_hash, ...userWithoutPassword } = user;
  
  return res.status(200).json({ 
    ok: true, 
    user: userWithoutPassword,
  });
}
