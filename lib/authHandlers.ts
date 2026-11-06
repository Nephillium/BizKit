import type { NextApiRequest, NextApiResponse } from 'next';
import { authSuccessBody, clientRequestsSessionToken, sessionCookie } from './authResponse';
import { generateToken, loginUser, registerUser } from './users';

type LoginFn = typeof loginUser;
type RegisterFn = typeof registerUser;
type TokenFn = typeof generateToken;

function requestBody(req: NextApiRequest): { email?: unknown; password?: unknown } {
  if (!req.body || typeof req.body !== 'object') return {};
  return req.body as { email?: unknown; password?: unknown };
}

export async function handleLogin(
  req: NextApiRequest,
  res: NextApiResponse,
  authenticate: LoginFn = loginUser,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { email, password } = requestBody(req);

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required' });
  }

  const result = await authenticate(email, password);

  if ('error' in result) {
    return res.status(401).json({ ok: false, error: result.error });
  }

  res.setHeader('Set-Cookie', sessionCookie(result.token));

  return res.status(200).json(
    authSuccessBody(result.user, result.token, clientRequestsSessionToken(req.headers)),
  );
}

export async function handleRegister(
  req: NextApiRequest,
  res: NextApiResponse,
  deps: { registerUser: RegisterFn; generateToken: TokenFn } = { registerUser, generateToken },
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { email, password } = requestBody(req);

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required' });
  }

  if (password.length < 10) {
    return res.status(400).json({ ok: false, error: 'Password must be at least 10 characters' });
  }

  const result = await deps.registerUser(email, password);

  if ('error' in result) {
    return res.status(400).json({ ok: false, error: result.error });
  }

  const token = deps.generateToken(result);
  res.setHeader('Set-Cookie', sessionCookie(token));

  const { password_hash, ...userWithoutPassword } = result;
  void password_hash;

  return res.status(200).json(
    authSuccessBody(userWithoutPassword, token, clientRequestsSessionToken(req.headers)),
  );
}
