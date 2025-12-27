import type { NextApiRequest, NextApiResponse } from 'next';
import { registerUser, generateToken } from '../../../lib/users';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required' });
  }

  if (password.length < 4) {
    return res.status(400).json({ ok: false, error: 'Password must be at least 4 characters' });
  }

  const result = await registerUser(email, password);

  if ('error' in result) {
    return res.status(400).json({ ok: false, error: result.error });
  }

  const token = generateToken(result);
  
  res.setHeader('Set-Cookie', serialize('bizkit_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  }));

  const { password_hash, ...userWithoutPassword } = result;
  
  return res.status(200).json({ 
    ok: true, 
    user: userWithoutPassword,
    token: token,
  });
}
