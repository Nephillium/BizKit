import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../server/db'
import { users } from '../../../shared/schema'
import { eq } from 'drizzle-orm'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const adminSecret = process.env.ADMIN_SECRET
  const { secret, email } = req.body

  if (!adminSecret) {
    return res.status(500).json({ error: 'ADMIN_SECRET not configured' })
  }

  if (secret !== adminSecret) {
    return res.status(401).json({ error: 'Invalid secret' })
  }

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    const [updated] = await db
      .update(users)
      .set({ isAdmin: true, isSubscribed: true })
      .where(eq(users.email, email))
      .returning()

    if (!updated) {
      return res.status(404).json({ error: 'User not found. Please login first to create your account.' })
    }

    return res.status(200).json({ 
      ok: true, 
      message: `User ${email} is now an admin with unlimited access.`,
      user: { email: updated.email, isAdmin: updated.isAdmin, isSubscribed: updated.isSubscribed }
    })
  } catch (error) {
    console.error('Error making admin:', error)
    return res.status(500).json({ error: 'Database error' })
  }
}
