import type { NextApiRequest, NextApiResponse } from 'next';
import { getUncachableStripeClient } from '../../../lib/stripeClient';
import { getUserFromRequest, findUserById } from '../../../lib/users';

const PACKS: Record<string, { credits: number; amount: number; name: string }> = {
  'credits_10': { credits: 10, amount: 500, name: 'BizKit AI - 10 Credit Pack' },
  'credits_50': { credits: 50, amount: 2000, name: 'BizKit AI - 50 Credit Pack' },
  'credits_100': { credits: 100, amount: 3500, name: 'BizKit AI - 100 Credit Pack' },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    const jwtPayload = getUserFromRequest(req.headers.cookie);
    if (!jwtPayload) {
      return res.status(401).json({ error: 'not_authenticated' });
    }

    const user = await findUserById(jwtPayload.id);
    if (!user) {
      return res.status(401).json({ error: 'user_not_found' });
    }

    const { packageId } = req.body as { packageId?: string };
    const pack = packageId ? PACKS[packageId] : undefined;

    if (!pack) {
      return res.status(400).json({ error: 'invalid_package' });
    }

    let stripe;
    try {
      stripe = await getUncachableStripeClient();
    } catch (stripeError: any) {
      console.error('Stripe client error:', stripeError?.message);
      return res.status(500).json({ 
        error: 'stripe_not_configured',
        message: stripeError?.message || 'Stripe is not properly configured'
      });
    }

    const origin =
      (req.headers.origin as string) ||
      `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: pack.amount,
            product_data: {
              name: pack.name,
              description: `${pack.credits} AI generation credits for BizKit AI`,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      success_url: `${origin}/buy-credits?success=true&packageId=${encodeURIComponent(packageId || '')}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/buy-credits?canceled=true`,
      metadata: {
        userId: user.id.toString(),
        credits: pack.credits.toString(),
        packageId: packageId || '',
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe create-checkout error:', error);
    return res.status(500).json({
      error: 'stripe_error',
      message: error?.message || 'Unknown error',
    });
  }
}
