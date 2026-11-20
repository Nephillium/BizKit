/** Canonical return URL. The server redirects the system browser here with the bearer token. */
export const GOOGLE_MOBILE_CALLBACK = 'pitchcrafter://auth/google';

export type GoogleMobileResult =
  | { kind: 'success'; token: string; created: boolean }
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

export function readGoogleMobileResult(callbackUrl: string): GoogleMobileResult {
  const match = /^pitchcrafter:\/\/auth\/google(?:\?([^#]*))?$/.exec(callbackUrl);
  if (!match) return { kind: 'ignore' };
  const params = new URLSearchParams(match[1] ?? '');
  const error = params.get('error');
  if (error) return { kind: 'error', error: googleMobileErrorMessage(error) };
  const token = params.get('token');
  if (!token || /\s/.test(token)) {
    return { kind: 'error', error: 'Google sign-in did not return a session' };
  }
  return { kind: 'success', token, created: params.get('created') === '1' };
}
