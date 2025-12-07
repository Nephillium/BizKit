import type { NextApiRequest, NextApiResponse } from 'next';
import { getUncachableStripeClient } from '../../../lib/stripeClient';
import { addCredits, findUserById } from '../../../lib/users';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = await getUncachableStripeClient();
  const buf = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature' });
  }

  let event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
    } else {
      const payload = JSON.parse(buf.toString());
      event = payload;
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || '0', 10);

    if (userId && credits > 0) {
      try {
        const user = await findUserById(userId);
        if (user) {
          await addCredits(userId, credits, `Purchased ${credits} credits via Stripe`);
          console.log(`Added ${credits} credits to user ${userId}`);
        }
      } catch (error) {
        console.error('Failed to add credits:', error);
      }
    }
  }

  return res.status(200).json({ received: true });
}
