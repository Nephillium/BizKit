import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, UserSession } from '../../../lib/session';
import { storage } from '../../../server/storage';

async function handler(
  req: NextApiRequest, 
  res: NextApiResponse,
  session: UserSession
) {
  const userId = session.claims?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === 'GET') {
    try {
      const generations = await storage.getGenerations(userId);
      res.json(generations);
    } catch (error) {
      console.error("Error fetching generations:", error);
      res.status(500).json({ message: "Failed to fetch generations" });
    }
  } else if (req.method === 'POST') {
    try {
      const { toolType, inputs, output } = req.body;
      const generation = await storage.createGeneration({
        userId,
        toolType,
        inputs,
        output,
      });
      res.json(generation);
    } catch (error) {
      console.error("Error creating generation:", error);
      res.status(500).json({ message: "Failed to save generation" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export default withAuth(handler);
