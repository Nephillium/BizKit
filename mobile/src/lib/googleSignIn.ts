import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { getApiBaseUrl } from './api';
import {
  GOOGLE_CANCELLED_MESSAGE,
  classifyNativeGoogleError,
  requestNativeGoogleSession,
  shouldUseNativeGoogleSignIn,
} from './googleNative';
import {
  base64ToBase64Url,
  bytesToBase64,
  googleButtonVisible,
  mobileGoogleStartPath,
  readGoogleMobileResult,
  requestMobileSession,
  resolveGoogleRedirectUri,
  type GoogleMobileResult,
} from './googleRedirect';

declare function require(moduleName: string): {
  expoConfig?: { extra?: { googleAuthEnabled?: unknown; googleWebClientId?: unknown } } | null;
};

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

export type GoogleSignInOutcome =
  | { cancelled: true }
  | { token: string; created: boolean }
  | { error: string };

type NativeAttempt = { fallback: true } | GoogleSignInOutcome;

function readExtra(): { googleAuthEnabled?: unknown; googleWebClientId?: unknown } {
  try {
    const constants = require('expo-constants');
    return constants.expoConfig?.extra ?? {};
  } catch {
    return {};
  }
}

function appFlag(): boolean {
  return readExtra().googleAuthEnabled === true;
}

function currentAuthFlag(): string | undefined {
  if ((process.env.EXPO_PUBLIC_GOOGLE_AUTH || '').trim() === '1') return '1';
  return appFlag() ? '1' : process.env.EXPO_PUBLIC_GOOGLE_AUTH;
}

function currentWebClientId(): string {
  const fromEnv = (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '').trim();
  if (fromEnv) return fromEnv;
  const extra = readExtra().googleWebClientId;
  return typeof extra === 'string' ? extra.trim() : '';
}

export async function serverGoogleAuthEnabled(apiBaseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/config`);
    if (!response.ok) return false;
    const data = (await response.json()) as { googleAuth?: unknown };
    return data?.googleAuth === true;
  } catch {
    return false;
  }
}

export async function resolveGoogleButtonVisible(apiBaseUrl = getApiBaseUrl()): Promise<boolean> {
  if (!appFlag() && currentAuthFlag() !== '1') return false;
  return googleButtonVisible(true, await serverGoogleAuthEnabled(apiBaseUrl));
}

function outcomeFromRedirect(parsed: GoogleMobileResult): { code: string } | GoogleSignInOutcome {
  if (parsed.kind === 'success') return { code: parsed.code };
  if (parsed.kind === 'error') return { error: parsed.error };
  return { error: 'Google sign-in did not complete' };
}

/** 32 random bytes, then S256. The verifier never leaves the device until the code exchange. */
export async function createMobilePkce(): Promise<{ verifier: string; challenge: string }> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  const verifier = base64ToBase64Url(bytesToBase64(bytes));
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  return { verifier, challenge: base64ToBase64Url(digest) };
}

async function loadGoogleSignIn(): Promise<GoogleSignInModule | null> {
  try {
    return await import('@react-native-google-signin/google-signin');
  } catch {
    return null;
  }
}

function thrownGoogleError(
  error: unknown,
  isErrorWithCode: (value: unknown) => value is { code: string },
): { code?: string; message?: string } {
  if (isErrorWithCode(error)) {
    return {
      code: error.code,
      message: error instanceof Error ? error.message : undefined,
    };
  }
  if (error instanceof Error) return { message: error.message };
  return {};
}

/** Account picker. Falls back when the native module or its Google config is missing. */
async function attemptNativeGoogleSignIn(apiBaseUrl: string): Promise<NativeAttempt> {
  const webClientId = currentWebClientId();
  if (!shouldUseNativeGoogleSignIn({
    platform: Platform.OS,
    authFlag: currentAuthFlag(),
    webClientId,
  })) {
    return { fallback: true };
  }

  const loaded = await loadGoogleSignIn();
  if (!loaded) return { fallback: true };
  const { GoogleSignin, isErrorWithCode, isSuccessResponse } = loaded;

  try {
    GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
    });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  } catch (error) {
    const decision = classifyNativeGoogleError(thrownGoogleError(error, isErrorWithCode));
    if (decision.action === 'fallback') return { fallback: true };
    if (decision.action === 'cancelled') return { error: decision.message };
    return { error: decision.message };
  }

  try {
    await GoogleSignin.signOut();
  } catch {
    // The device account picker still opens when this app has no Google session.
  }

  try {
    const response = await GoogleSignin.signIn();
    if (isSuccessResponse(response)) {
      const idToken = response.data.idToken;
      if (!idToken) return { fallback: true };
      const session = await requestNativeGoogleSession(apiBaseUrl, idToken);
      if ('error' in session) return { error: session.error };
      return { token: session.token, created: session.created };
    }
    return { error: GOOGLE_CANCELLED_MESSAGE };
  } catch (error) {
    const decision = classifyNativeGoogleError(thrownGoogleError(error, isErrorWithCode));
    if (decision.action === 'fallback') return { fallback: true };
    return { error: decision.message };
  }
}

/** Opens the web OAuth flow in the system browser and returns the app session token. */
export async function startBrowserGoogleSignIn(apiBaseUrl = getApiBaseUrl()): Promise<GoogleSignInOutcome> {
  WebBrowser.maybeCompleteAuthSession();
  const made = AuthSession.makeRedirectUri({
    native: 'pitchcrafter://auth/google',
    scheme: 'pitchcrafter',
    path: 'auth/google',
  });
  const redirectUri = resolveGoogleRedirectUri(made);
  try {
    const { verifier, challenge } = await createMobilePkce();
    const result = await WebBrowser.openAuthSessionAsync(
      `${apiBaseUrl}${mobileGoogleStartPath(challenge)}`,
      redirectUri,
    );
    if (result.type === 'cancel' || result.type === 'dismiss') return { cancelled: true };
    if (result.type !== 'success' || !result.url) {
      return { error: 'Google sign-in did not complete' };
    }
    const parsed = outcomeFromRedirect(readGoogleMobileResult(result.url));
    if (!('code' in parsed)) return parsed;
    const session = await requestMobileSession(apiBaseUrl, parsed.code, verifier);
    if ('error' in session) return { error: session.error };
    return { token: session.token, created: session.created };
  } catch {
    return { error: 'Google sign-in did not complete' };
  }
}

/**
 * Prefer the Android account picker. The browser PKCE flow runs when native
 * sign-in is off, the module is missing, or Google reports a developer error.
 */
export async function startGoogleSignIn(apiBaseUrl = getApiBaseUrl()): Promise<GoogleSignInOutcome> {
  const native = await attemptNativeGoogleSignIn(apiBaseUrl);
  if (!('fallback' in native)) return native;
  return startBrowserGoogleSignIn(apiBaseUrl);
}
