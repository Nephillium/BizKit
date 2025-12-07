import type { NextApiRequest, NextApiResponse } from 'next';
import { loginUser } from '../../../lib/users';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required' });
  }

  const result = await loginUser(email, password);

  if ('error' in result) {
    return res.status(401).json({ ok: false, error: result.error });
  }

  res.setHeader('Set-Cookie', serialize('bizkit_token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  }));

  return res.status(200).json({ 
    ok: true, 
    user: result.user,
  });
}
