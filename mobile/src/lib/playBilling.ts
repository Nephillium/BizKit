/**
 * Credits are digital goods. Google Play requires Play Billing, or an
 * approved alternative, for a purchase that starts inside the Android app.
 * Credit packs stay on Stripe in the website (`pages/buy-credits.tsx` and
 * `pages/api/stripe`). The Android client must not open that checkout.
 *
 * TODO(play-billing): When Play Console in-app products exist, sell credit
 * packs with Google Play Billing and grant the same credits on the server.
 * Do not route Android purchases through Stripe. Leave the web Stripe flow
 * in place for browsers.
 */
export function sellsCreditsInApp(os: string): boolean {
  return os !== 'android';
}
