/**
 * Credits are digital goods. On Android this app must not sell credit packs,
 * show pack prices, or link to a website checkout.
 *
 * iOS may still open the existing Stripe checkout. Web Stripe
 * (`pages/buy-credits.tsx` and `pages/api/stripe`) is unchanged.
 *
 * TODO(play-billing): When Play Console in-app products exist, sell credit
 * packs with Google Play Billing and grant the same credits on the server.
 * After a completed purchase, call logCreditPurchase in
 * mobile/src/lib/analytics.ts. Do not log any other analytics event, and do
 * not send Android purchases through Stripe or a browser.
 */
export const ANDROID_CREDITS_UNAVAILABLE_MESSAGE =
  "Credit purchases aren't available in this version";

export function sellsCreditsInApp(os: string): boolean {
  return os !== 'android';
}
