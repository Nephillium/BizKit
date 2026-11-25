import { GOOGLE_FAILED_MESSAGE, googleFailureWithCode } from './googleNative';

/** Canonical return URL. The server redirects the system browser here with a one-time code. */
export const GOOGLE_MOBILE_CALLBACK = 'pitchcrafter://auth/google';

export type GoogleMobileResult =
  | { kind: 'success'; code: string; created: boolean }
  | { kind: 'error'; error: string }
  | { kind: 'ignore' };

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Google sign-in was cancelled.',
  email_not_verified: 'Google has not verified this email address.',
  signup_blocked: 'This email cannot be registered.',
  identity_conflict: 'This email is already linked to a different Google account.',
  invalid_state: 'Google sign-in expired. Try again.',
  exchange_failed: 'Google sign-in failed. Try again.',
  token_invalid: 'Google sign-in failed. Try again.',
  google_sign_in_failed: 'Google sign-in failed. Try again.',
};

export function googleMobileErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? 'Google sign-in failed. Try again.';
}

export function appGoogleAuthEnabled(envValue: string | undefined): boolean {
  return (envValue || '').trim() === '1';
}

/** The button is shown only when this build opts in and the server has Google configured. */
export function googleButtonVisible(appEnabled: boolean, serverEnabled: boolean): boolean {
  return appEnabled === true && serverEnabled === true;
}

/**
 * Expo Go may report an exp:// URL. The server only redirects to the app scheme,
 * so the session always listens for pitchcrafter://auth/google.
 */
export function resolveGoogleRedirectUri(made: string): string {
  if (made === GOOGLE_MOBILE_CALLBACK || made.startsWith(`${GOOGLE_MOBILE_CALLBACK}?`)) {
    return GOOGLE_MOBILE_CALLBACK;
  }
  return GOOGLE_MOBILE_CALLBACK;
}

const MOBILE_CODE_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

export function base64ToBase64Url(value: string): string {
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function bytesToBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0;
    const b = index + 1 < bytes.length ? bytes[index + 1] ?? 0 : 0;
    const c = index + 2 < bytes.length ? bytes[index + 2] ?? 0 : 0;
    const triple = (a << 16) | (b << 8) | c;
    out += alphabet[(triple >> 18) & 63];
    out += alphabet[(triple >> 12) & 63];
    out += index + 1 < bytes.length ? alphabet[(triple >> 6) & 63] : '=';
    out += index + 2 < bytes.length ? alphabet[triple & 63] : '=';
  }
  return out;
}

/** Start path. The challenge is public. The verifier stays on the device. */
export function mobileGoogleStartPath(codeChallenge: string): string {
  const params = new URLSearchParams({
    client: 'mobile',
    code_challenge: codeChallenge,
  });
  return `/api/auth/google/start?${params.toString()}`;
}

export function readGoogleMobileResult(callbackUrl: string): GoogleMobileResult {
  const match = /^pitchcrafter:\/\/auth\/google(?:\?([^#]*))?$/.exec(callbackUrl);
  if (!match) return { kind: 'ignore' };
  const params = new URLSearchParams(match[1] ?? '');
  const error = params.get('error');
  if (error) return { kind: 'error', error: googleMobileErrorMessage(error) };
  const code = params.get('code');
  if (!code || !MOBILE_CODE_PATTERN.test(code)) {
    return { kind: 'error', error: 'Google sign-in did not return a session' };
  }
  return { kind: 'success', code, created: params.get('created') === '1' };
}

export async function requestMobileSession(
  apiBaseUrl: string,
  code: string,
  verifier: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ token: string; created: boolean } | { error: string }> {
  try {
    const response = await fetchImpl(`${apiBaseUrl}/api/auth/google/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BizKit-Client': 'mobile',
      },
      body: JSON.stringify({ code, code_verifier: verifier }),
    });
    const data = (await response.json()) as { ok?: unknown; token?: unknown; created?: unknown; error?: unknown };
    if (!response.ok || data.ok !== true || typeof data.token !== 'string' || data.token.length === 0) {
      const code = typeof data.error === 'string' ? data.error : '';
      return { error: googleFailureWithCode(GOOGLE_FAILED_MESSAGE, code) };
    }
    return { token: data.token, created: data.created === true };
  } catch {
    return { error: 'Google sign-in failed. Try again.' };
  }
}
