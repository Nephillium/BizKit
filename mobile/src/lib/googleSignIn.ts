import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { getApiBaseUrl } from './api';
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
  expoConfig?: { extra?: { googleAuthEnabled?: unknown } } | null;
};

export type GoogleSignInOutcome =
  | { cancelled: true }
  | { token: string; created: boolean }
  | { error: string };

function appFlag(): boolean {
  try {
    const constants = require('expo-constants');
    return constants.expoConfig?.extra?.googleAuthEnabled === true;
  } catch {
    return false;
  }
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
  if (!appFlag()) return false;
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

/** Opens the web OAuth flow in the system browser and returns the app session token. */
export async function startGoogleSignIn(apiBaseUrl = getApiBaseUrl()): Promise<GoogleSignInOutcome> {
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
