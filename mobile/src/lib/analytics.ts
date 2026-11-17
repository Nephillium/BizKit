import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  canLogAnalyticsEvent,
  type AnalyticsConsent,
  type AnalyticsEventName,
} from './analyticsPolicy';

declare function require(moduleName: string): {
  default?: AnalyticsClient;
  expoConfig?: { extra?: { firebaseAnalytics?: unknown } } | null;
};

const CONSENT_KEY = 'analytics_consent';

type AnalyticsClient = () => {
  setAnalyticsCollectionEnabled: (enabled: boolean) => Promise<void>;
  setConsent: (consent: Record<string, boolean>) => Promise<void>;
  logEvent: (name: string, params?: Record<string, string | number>) => Promise<void>;
};

export function isAnalyticsConfigured(): boolean {
  if (Platform.OS !== 'android') return false;
  try {
    const constants = require('expo-constants');
    return constants.expoConfig?.extra?.firebaseAnalytics === true;
  } catch {
    return false;
  }
}

function nativeAnalytics(): AnalyticsClient | null {
  if (!isAnalyticsConfigured()) return null;
  try {
    const moduleName = '@react-native-firebase/analytics';
    const loaded = require(moduleName);
    return loaded.default ?? (loaded as unknown as AnalyticsClient);
  } catch {
    return null;
  }
}

export async function readAnalyticsConsent(): Promise<AnalyticsConsent | null> {
  try {
    const value = await AsyncStorage.getItem(CONSENT_KEY);
    if (value === 'granted' || value === 'denied') return value;
    return null;
  } catch {
    return null;
  }
}

async function applyNativeConsent(consent: AnalyticsConsent): Promise<void> {
  const analytics = nativeAnalytics();
  if (!analytics) return;
  const granted = consent === 'granted';
  try {
    await analytics().setConsent({
      analytics_storage: granted,
      ad_storage: false,
      ad_user_data: false,
      ad_personalization: false,
    });
    await analytics().setAnalyticsCollectionEnabled(granted);
  } catch {
    // A missing native SDK stays off.
  }
}

export async function writeAnalyticsConsent(consent: AnalyticsConsent): Promise<void> {
  await AsyncStorage.setItem(CONSENT_KEY, consent);
  await applyNativeConsent(consent);
}

export async function applyStoredAnalyticsConsent(): Promise<void> {
  const consent = await readAnalyticsConsent();
  await applyNativeConsent(consent === 'granted' ? 'granted' : 'denied');
}

async function logAnalyticsEvent(
  eventName: AnalyticsEventName,
  params: Record<string, string | number>,
): Promise<void> {
  const consent = await readAnalyticsConsent();
  if (!canLogAnalyticsEvent({
    consent,
    eventName,
    configured: isAnalyticsConfigured(),
  })) {
    return;
  }
  const analytics = nativeAnalytics();
  if (!analytics) return;
  try {
    await analytics().setAnalyticsCollectionEnabled(true);
    await analytics().logEvent(eventName, params);
  } catch {
    // Analytics must not block sign-up or the rest of the app.
  }
}

export async function logSignUp(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await logAnalyticsEvent('sign_up', { method: 'email' });
}

/** Credit pack purchase. Android does not sell credits in this version, so nothing is sent. */
export async function logCreditPurchase(credits: number, valueUsd: number): Promise<void> {
  if (Platform.OS !== 'android') return;
  await logAnalyticsEvent('purchase', {
    currency: 'USD',
    value: valueUsd,
    credits,
  });
}
