import bcrypt from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { pool } from './db';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  password_hash: string | null;
  role: UserRole;
  credits: number;
  is_admin: boolean;
  usage_count: number;
  stripe_customer_id: string | null;
  created_at: Date;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  role: UserRole;
  credits: number;
  is_admin: boolean;
  usage_count: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'bizkit-dev-secret';
const SUPER_USER_EMAIL = process.env.SUPER_USER_EMAIL;
const BCRYPT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isUserSuperUser(email: string): boolean {
  if (!SUPER_USER_EMAIL) return false;
  return email.toLowerCase().trim() === SUPER_USER_EMAIL.toLowerCase().trim();
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const result = await pool.query(
    'SELECT * FROM users WHERE LOWER(email) = $1',
    [normalizedEmail]
  );
  return result.rows[0] || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function getUserWithCredits(userId: string): Promise<UserWithoutPassword | null> {
  const result = await pool.query(
    'SELECT id, email, role, credits, is_admin, usage_count FROM users WHERE id = $1',
    [userId]
  );
  if (!result.rows[0]) return null;
  
  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    role: user.is_admin ? 'admin' : (user.role || 'user'),
    credits: user.credits || 0,
    is_admin: user.is_admin || false,
    usage_count: user.usage_count || 0,
  };
}

export async function createUser(
  email: string, 
  password: string, 
  role: UserRole = 'user'
): Promise<User | { error: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    return { error: 'User already exists' };
  }
  
  const passwordHash = await hashPassword(password);
  const isSuperUser = isUserSuperUser(normalizedEmail);
  const finalRole = isSuperUser ? 'admin' : role;
  
  try {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, credits, is_admin, usage_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 0, NOW(), NOW())
       RETURNING *`,
      [normalizedEmail, passwordHash, finalRole, 0, isSuperUser]
    );
    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') {
      return { error: 'User already exists' };
    }
    throw error;
  }
}

export async function validatePassword(user: User, password: string): Promise<boolean> {
  if (!user.password_hash) return false;
  return comparePassword(password, user.password_hash);
}

export async function loginUser(
  email: string, 
  password: string
): Promise<{ token: string; user: UserWithoutPassword } | { error: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const user = await getUserByEmail(normalizedEmail);
  if (!user) {
    return { error: 'Invalid email or password' };
  }
  
  if (!user.password_hash) {
    return { error: 'Invalid email or password' };
  }
  
  const isValid = await validatePassword(user, password);
  if (!isValid) {
    return { error: 'Invalid email or password' };
  }
  
  const isSuperUser = isUserSuperUser(normalizedEmail);
  const finalRole: UserRole = isSuperUser || user.is_admin ? 'admin' : (user.role as UserRole || 'user');
  
  if (isSuperUser && !user.is_admin) {
    await pool.query('UPDATE users SET is_admin = true, role = $1 WHERE id = $2', ['admin', user.id]);
  }
  
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: finalRole,
  });
  
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: finalRole,
      credits: user.credits || 0,
      is_admin: isSuperUser || user.is_admin || false,
      usage_count: user.usage_count || 0,
    },
  };
}

export function generateToken(payload: JWTPayload): string {
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

export function getUserFromRequest(cookieHeader: string | undefined): JWTPayload | null {
  const token = getTokenFromCookie(cookieHeader);
  if (!token) return null;
  return verifyToken(token);
}

export async function addCredits(
  userId: string, 
  amount: number, 
  reason: string
): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      'UPDATE users SET credits = credits + $1 WHERE id = $2',
      [amount, userId]
    );
    
    await client.query(
      'INSERT INTO credit_transactions (user_id, amount, reason, created_at) VALUES ($1, $2, $3, NOW())',
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
  const result = await pool.query(
    'UPDATE users SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = $1 RETURNING usage_count',
    [userId]
  );
  return result.rows[0]?.usage_count || 0;
}
