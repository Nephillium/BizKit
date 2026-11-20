import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { getApiBaseUrl } from './api';
import {
  googleButtonVisible,
  readGoogleMobileResult,
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

function outcomeFromRedirect(parsed: GoogleMobileResult): GoogleSignInOutcome {
  if (parsed.kind === 'success') return { token: parsed.token, created: parsed.created };
  if (parsed.kind === 'error') return { error: parsed.error };
  return { error: 'Google sign-in did not complete' };
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
    const result = await WebBrowser.openAuthSessionAsync(
      `${apiBaseUrl}/api/auth/google/start?client=mobile`,
      redirectUri,
    );
    if (result.type === 'cancel' || result.type === 'dismiss') return { cancelled: true };
    if (result.type !== 'success' || !result.url) {
      return { error: 'Google sign-in did not complete' };
    }
    return outcomeFromRedirect(readGoogleMobileResult(result.url));
  } catch {
    return { error: 'Google sign-in did not complete' };
  }
}
