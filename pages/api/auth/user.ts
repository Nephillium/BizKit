import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, UserSession } from '../../../lib/session';
import { storage } from '../../../server/storage';

async function handler(
  req: NextApiRequest, 
  res: NextApiResponse,
  session: UserSession
) {
  try {
    const userId = session.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(userId);
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
}

export default withAuth(handler);
