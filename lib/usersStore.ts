import { createHash } from 'crypto';
import { sign, verify } from 'jsonwebtoken';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  usageCount: number;
  createdAt: Date;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
}

const users: Map<string, User> = new Map();

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'bizkit-dev-secret';
const SUPER_USER_EMAIL = process.env.SUPER_USER_EMAIL;

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function registerUser(email: string, password: string, role: UserRole = 'user'): User | { error: string } {
  const normalizedEmail = email.toLowerCase().trim();
  
  if (users.has(normalizedEmail)) {
    return { error: 'User already exists' };
  }
  
  const user: User = {
    id: generateId(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role,
    usageCount: 0,
    createdAt: new Date(),
  };
  
  users.set(normalizedEmail, user);
  return user;
}

export function findUserByEmail(email: string): User | undefined {
  return users.get(email.toLowerCase().trim());
}

export function findUserById(id: string): User | undefined {
  for (const user of users.values()) {
    if (user.id === id) {
      return user;
    }
  }
  return undefined;
}

export function validatePassword(user: User, password: string): boolean {
  return user.passwordHash === hashPassword(password);
}

export function incrementUserUsage(email: string): number {
  const user = findUserByEmail(email);
  if (user) {
    user.usageCount += 1;
    return user.usageCount;
  }
  return 0;
}

export function isUserSuperUser(email: string): boolean {
  if (!SUPER_USER_EMAIL) return false;
  return email.toLowerCase().trim() === SUPER_USER_EMAIL.toLowerCase().trim();
}

export function loginUser(email: string, password: string): { token: string; user: Omit<User, 'passwordHash'> } | { error: string } {
  const normalizedEmail = email.toLowerCase().trim();
  
  const user = findUserByEmail(normalizedEmail);
  if (!user) {
    return { error: 'Invalid email or password' };
  }
  
  if (!validatePassword(user, password)) {
    return { error: 'Invalid email or password' };
  }
  
  if (isUserSuperUser(normalizedEmail)) {
    user.role = 'admin';
  }
  
  const token = generateToken(user);
  const { passwordHash, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
}

export function generateToken(user: User): string {
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

export function getUserFromRequest(cookieHeader: string | undefined): JWTPayload | null {
  const token = getTokenFromCookie(cookieHeader);
  if (!token) return null;
  return verifyToken(token);
}
