/**
 * Pure decisions for native Android Google sign-in.
 * This file does not import the native module, so tests can load it in Node.
 *
 * Status numbers are Google Play services constants used by
 * @react-native-google-signin/google-signin:
 * SIGN_IN_CANCELLED 12501, SIGN_IN_REQUIRED 4, DEVELOPER_ERROR 10,
 * SIGN_IN_FAILED 12500, NETWORK_ERROR 7.
 */

export const GOOGLE_SIGN_IN_CANCELLED = '12501';
export const GOOGLE_SIGN_IN_REQUIRED = '4';
export const GOOGLE_DEVELOPER_ERROR = '10';
export const GOOGLE_SIGN_IN_FAILED = '12500';
export const GOOGLE_NETWORK_ERROR = '7';
export const GOOGLE_PLAY_SERVICES_NOT_AVAILABLE = 'PLAY_SERVICES_NOT_AVAILABLE';
export const GOOGLE_SIGN_IN_IN_PROGRESS = 'ASYNC_OP_IN_PROGRESS';
export const GOOGLE_NO_SAVED_CREDENTIAL = 'NO_SAVED_CREDENTIAL_FOUND';
export const GOOGLE_NULL_PRESENTER = 'NULL_PRESENTER';

export const GOOGLE_CANCELLED_MESSAGE = 'Google sign-in was cancelled.';
export const GOOGLE_NO_ACCOUNT_MESSAGE =
  'No Google account is on this device. Add a Google account in Android settings, then try again.';
export const GOOGLE_PLAY_SERVICES_MESSAGE =
  'Google Play services is missing or out of date on this device.';
export const GOOGLE_IN_PROGRESS_MESSAGE = 'Google sign-in is already in progress.';
export const GOOGLE_NETWORK_MESSAGE = 'Google sign-in failed. Check the network and try again.';
export const GOOGLE_FAILED_MESSAGE = 'Google sign-in failed. Try again.';
export const GOOGLE_RATE_LIMIT_MESSAGE = 'Too many Google sign-in attempts. Wait a minute and try again.';

export type NativeGoogleDecision =
  | { action: 'cancelled'; message: string }
  | { action: 'message'; message: string }
  | { action: 'fallback' };

export function nativeGoogleAuthEnabled(
  authFlag: string | undefined,
  webClientId: string | undefined,
): boolean {
  return (authFlag || '').trim() === '1' && (webClientId || '').trim().length > 0;
}

/** Native sign-in runs on Android only, and only when both public flags are set. */
export function shouldUseNativeGoogleSignIn(input: {
  platform: string;
  authFlag: string | undefined;
  webClientId: string | undefined;
}): boolean {
  return input.platform === 'android'
    && nativeGoogleAuthEnabled(input.authFlag, input.webClientId);
}

function looksLikeNoAccount(message: string): boolean {
  return /no google account|no accounts? (?:is )?on this device|no saved credential|no credential|sign_in_required/i.test(message);
}

function looksLikeDeveloperError(message: string): boolean {
  return /DEVELOPER_ERROR|developer_error|\bcode:? 10\b|sha-?1|oauth client/i.test(message);
}

function looksLikePlayServices(message: string): boolean {
  return /play services/i.test(message);
}

/**
 * User-facing results stay on screen. A missing native module or a Google
 * developer/config error (SHA-1, OAuth client) falls back to the browser flow.
 */
/** A short status code safe to show in an alert. Anything else could be an email or a token. */
export function publicErrorCode(code: string | null | undefined): string | null {
  if (typeof code !== 'string') return null;
  const trimmed = code.trim();
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(trimmed)) return null;
  return trimmed;
}

/** Keep the explanation and add the code, for example "Google sign-in failed (bad_audience). Try again." */
export function googleFailureWithCode(message: string, code: string | null | undefined): string {
  const safe = publicErrorCode(code);
  if (!safe) return message;
  if (message === GOOGLE_FAILED_MESSAGE) return `Google sign-in failed (${safe}). Try again.`;
  if (message.includes(`(${safe})`)) return message;
  return `${message.replace(/\.$/, '')} (${safe}).`;
}

export function classifyNativeGoogleError(input: {
  code?: string | null;
  message?: string | null;
}): NativeGoogleDecision {
  const code = (input.code || '').trim();
  const message = input.message || '';
  if (
    code === GOOGLE_SIGN_IN_CANCELLED
    || code === '-5'
  ) {
    return { action: 'cancelled', message: GOOGLE_CANCELLED_MESSAGE };
  }
  if (
    code === GOOGLE_PLAY_SERVICES_NOT_AVAILABLE
    || looksLikePlayServices(message)
  ) {
    return { action: 'message', message: googleFailureWithCode(GOOGLE_PLAY_SERVICES_MESSAGE, code) };
  }
  if (
    code === GOOGLE_SIGN_IN_REQUIRED
    || code === GOOGLE_NO_SAVED_CREDENTIAL
    || looksLikeNoAccount(message)
  ) {
    return { action: 'message', message: googleFailureWithCode(GOOGLE_NO_ACCOUNT_MESSAGE, code) };
  }
  if (code === GOOGLE_SIGN_IN_IN_PROGRESS) {
    return { action: 'message', message: googleFailureWithCode(GOOGLE_IN_PROGRESS_MESSAGE, code) };
  }
  if (code === GOOGLE_NETWORK_ERROR) {
    return { action: 'message', message: googleFailureWithCode(GOOGLE_NETWORK_MESSAGE, code) };
  }
  if (
    code === GOOGLE_DEVELOPER_ERROR
    || code === GOOGLE_SIGN_IN_FAILED
    || code === GOOGLE_NULL_PRESENTER
    || looksLikeDeveloperError(message)
    || !code
  ) {
    return { action: 'fallback' };
  }
  return { action: 'message', message: googleFailureWithCode(GOOGLE_FAILED_MESSAGE, code) };
}

export async function requestNativeGoogleSession(
  apiBaseUrl: string,
  idToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ token: string; created: boolean } | { error: string }> {
  try {
    const response = await fetchImpl(`${apiBaseUrl}/api/auth/google/native`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BizKit-Client': 'mobile',
      },
      body: JSON.stringify({ id_token: idToken }),
    });
    const data = (await response.json()) as { ok?: unknown; token?: unknown; created?: unknown; error?: unknown };
    if (!response.ok || data.ok !== true || typeof data.token !== 'string' || data.token.length === 0) {
      const code = typeof data.error === 'string' ? data.error : '';
      if (code === 'rate_limited') {
        return { error: googleFailureWithCode(GOOGLE_RATE_LIMIT_MESSAGE, code) };
      }
      if (code === 'email_not_verified') {
        return { error: googleFailureWithCode('Google has not verified this email address.', code) };
      }
      if (code === 'signup_blocked') {
        return { error: googleFailureWithCode('This email cannot be registered.', code) };
      }
      if (code === 'identity_conflict') {
        return { error: googleFailureWithCode('This email is already linked to a different Google account.', code) };
      }
      return { error: googleFailureWithCode(GOOGLE_FAILED_MESSAGE, code) };
    }
    return { token: data.token, created: data.created === true };
  } catch {
    return { error: googleFailureWithCode(GOOGLE_FAILED_MESSAGE, 'network') };
  }
}
