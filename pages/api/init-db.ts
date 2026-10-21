import type { NextApiRequest, NextApiResponse } from 'next';
import { initSchema } from '../../lib/initSchema';
import { provisionSuperUser } from '../../lib/users';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (process.env.NODE_ENV === 'production') {
    const expected = process.env.DB_INIT_TOKEN;
    const supplied = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!expected || !supplied) {
      return res.status(404).json({ error: 'Not found' });
    }
    const expectedBuf = Buffer.from(expected);
    const suppliedBuf = Buffer.from(supplied);
    if (expectedBuf.length !== suppliedBuf.length || !crypto.timingSafeEqual(expectedBuf, suppliedBuf)) {
      return res.status(404).json({ error: 'Not found' });
    }
  }

  try {
    await initSchema();
    const admin = await provisionSuperUser();

    return res.status(200).json({
      ok: true,
      message: 'Database initialized successfully',
      admin: admin.status,
    });
  } catch (error: any) {
    console.error('Database init error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
