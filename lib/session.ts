import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest, type JWTPayload } from './users';

export function getSessionFromRequest(req: NextApiRequest): JWTPayload | null {
  return getUserFromRequest(req.headers.cookie);
}

export type AuthHandler = (
  req: NextApiRequest, 
  res: NextApiResponse, 
  user: JWTPayload
) => Promise<void>;

export function withAuth(handler: AuthHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = getSessionFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    return handler(req, res, user);
  };
}
