/** Events the Android app is allowed to send. Everything else stays unlogged. */
export const ANALYTICS_EVENT_NAMES = ['sign_up', 'purchase'] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type AnalyticsConsent = 'granted' | 'denied';

/**
 * Analytics is off unless this build was configured with Firebase and the
 * person has accepted the consent prompt. A missing choice is denied.
 */
export function canLogAnalyticsEvent(input: {
  consent: AnalyticsConsent | null;
  eventName: string;
  configured: boolean;
}): boolean {
  if (!input.configured) return false;
  if (input.consent !== 'granted') return false;
  return (ANALYTICS_EVENT_NAMES as readonly string[]).includes(input.eventName);
}
