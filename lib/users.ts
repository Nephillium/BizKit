import bcrypt from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { query, queryOne, pool } from './db';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  credits: number;
  usage_count: number;
  created_at: Date;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'bizkit-dev-secret';
const SUPER_USER_EMAIL = process.env.SUPER_USER_EMAIL;
const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isUserSuperUser(email: string): boolean {
  if (!SUPER_USER_EMAIL) return false;
  return email.toLowerCase().trim() === SUPER_USER_EMAIL.toLowerCase().trim();
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return queryOne<User>(
    'SELECT id, email, password_hash, role, credits, usage_count, created_at FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
}

export async function findUserById(id: string): Promise<User | null> {
  return queryOne<User>(
    'SELECT id, email, password_hash, role, credits, usage_count, created_at FROM users WHERE id = $1',
    [id]
  );
}

export async function registerUser(
  email: string, 
  password: string
): Promise<User | { error: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return { error: 'User already exists' };
  }
  
  const passwordHash = await hashPassword(password);
  const role: UserRole = isUserSuperUser(normalizedEmail) ? 'admin' : 'user';
  
  const result = await queryOne<User>(
    `INSERT INTO users (email, password_hash, role, credits, usage_count) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, email, password_hash, role, credits, usage_count, created_at`,
    [normalizedEmail, passwordHash, role, 0, 0]
  );
  
  if (!result) {
    return { error: 'Failed to create user' };
  }
  
  return result;
}

export async function loginUser(
  email: string, 
  password: string
): Promise<{ token: string; user: Omit<User, 'password_hash'> } | { error: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    return { error: 'Invalid email or password' };
  }
  
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { error: 'Invalid email or password' };
  }
  
  let role = user.role;
  if (isUserSuperUser(normalizedEmail) && role !== 'admin') {
    await query('UPDATE users SET role = $1 WHERE id = $2', ['admin', user.id]);
    role = 'admin';
  }
  
  const token = generateToken({ ...user, role });
  const { password_hash, ...userWithoutPassword } = { ...user, role };
  return { token, user: userWithoutPassword };
}

export function generateToken(user: { id: string; email: string; role: UserRole }): string {
  const payload: JWTPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  return sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies.bizkit_token || null;
}

export function getUserFromRequest(cookieHeader: string | undefined, authHeader?: string | undefined): JWTPayload | null {
  // First try Authorization header (for mobile apps)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload) return payload;
  }
  
  // Fall back to cookie (for web app)
  const token = getTokenFromCookie(cookieHeader);
  if (!token) return null;
  return verifyToken(token);
}

export async function getUserCredits(userId: string): Promise<number> {
  const user = await findUserById(userId);
  return user?.credits ?? 0;
}

export async function addCredits(
  userId: string, 
  amount: number, 
  reason: string
): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      'UPDATE users SET credits = credits + $1 WHERE id = $2 RETURNING credits',
      [amount, userId]
    );
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return false;
    }
    
    await client.query(
      'INSERT INTO credit_transactions (user_id, amount, reason) VALUES ($1, $2, $3)',
      [userId, amount, reason]
    );
    
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to add credits:', error);
    return false;
  } finally {
    client.release();
  }
}

export async function incrementUserUsage(userId: string): Promise<number> {
  const result = await queryOne<{ usage_count: number }>(
    'UPDATE users SET usage_count = usage_count + 1 WHERE id = $1 RETURNING usage_count',
    [userId]
  );
  return result?.usage_count ?? 0;
}
