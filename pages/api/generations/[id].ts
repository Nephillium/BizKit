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

  const id = req.query.id;
  if (typeof id !== 'string') {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const generationId = parseInt(id, 10);
  if (isNaN(generationId)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  if (req.method === 'DELETE') {
    try {
      const generation = await storage.getGeneration(generationId);
      if (!generation) {
        return res.status(404).json({ message: "Generation not found" });
      }
      if (generation.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteGeneration(generationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting generation:", error);
      res.status(500).json({ message: "Failed to delete generation" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export default withAuth(handler);
