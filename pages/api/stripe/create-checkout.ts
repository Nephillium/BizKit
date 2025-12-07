import type { NextApiRequest, NextApiResponse } from 'next';
import { getUncachableStripeClient } from '../../../lib/stripeClient';
import { getUserFromRequest, findUserById } from '../../../lib/users';

const CREDIT_PACKAGES = [
  { id: 'credits_10', credits: 10, price: 500, name: '10 Credits' },
  { id: 'credits_50', credits: 50, price: 2000, name: '50 Credits' },
  { id: 'credits_100', credits: 100, price: 3500, name: '100 Credits' },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set cache headers to prevent caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const jwtPayload = getUserFromRequest(req.headers.cookie);
  if (!jwtPayload) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await findUserById(jwtPayload.id);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const { packageId } = req.body;
  const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId);

  if (!creditPackage) {
    return res.status(400).json({ error: 'Invalid package' });
  }

  try {
    const stripe = await getUncachableStripeClient();
    
    const host = req.headers.host || 'localhost:5000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: creditPackage.name,
              description: `${creditPackage.credits} AI generation credits for BizKit AI`,
            },
            unit_amount: creditPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/buy-credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/buy-credits?canceled=true`,
      metadata: {
        userId: user.id.toString(),
        credits: creditPackage.credits.toString(),
        packageId: creditPackage.id,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
