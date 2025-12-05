import type { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import * as client from "openid-client";
import { getOidcConfig } from './auth';

export interface UserSession {
  claims: any;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

export function getSessionFromCookie(req: NextApiRequest): UserSession | null {
  const cookies = parse(req.headers.cookie || '');
  const sessionCookie = cookies.session;
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    const sessionData = Buffer.from(sessionCookie, 'base64').toString('utf-8');
    return JSON.parse(sessionData);
  } catch {
    return null;
  }
}

export async function validateSession(session: UserSession): Promise<boolean> {
  if (!session || !session.expires_at) {
    return false;
  }
  
  const now = Math.floor(Date.now() / 1000);
  if (now <= session.expires_at) {
    return true;
  }
  
  if (!session.refresh_token) {
    return false;
  }
  
  try {
    const config = await getOidcConfig();
    await client.refreshTokenGrant(config, session.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export type AuthHandler = (
  req: NextApiRequest, 
  res: NextApiResponse, 
  session: UserSession
) => Promise<void>;

export function withAuth(handler: AuthHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = getSessionFromCookie(req);
    
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const isValid = await validateSession(session);
    if (!isValid) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    return handler(req, res, session);
  };
}
