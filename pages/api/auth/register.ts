import type { NextApiRequest, NextApiResponse } from 'next';
import { createUser, loginUser } from '../../../lib/users';
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

  try {
    const result = await createUser(email, password, 'user');

    if ('error' in result) {
      return res.status(400).json({ ok: false, error: result.error });
    }

    const loginResult = await loginUser(email, password);
    
    if ('error' in loginResult) {
      return res.status(500).json({ ok: false, error: 'Registration succeeded but login failed' });
    }

    res.setHeader('Set-Cookie', serialize('bizkit_token', loginResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    }));

    return res.status(201).json({ 
      ok: true, 
      user: loginResult.user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
