import { serialize } from 'cookie';

export const SESSION_COOKIE_NAME = 'bizkit_token';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * The Expo client sends this header on login and register.
 * Any other value, or a missing header, keeps the session token out of the JSON body.
 */
export const MOBILE_CLIENT_HEADER = 'x-bizkit-client';
export const MOBILE_CLIENT_VALUE = 'mobile';

type HeaderValue = string | string[] | undefined;

export function sessionCookie(token: string, maxAge = SESSION_MAX_AGE_SECONDS): string {
  return serialize(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}

function headerValues(value: HeaderValue): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function clientRequestsSessionToken(
  headers: Record<string, HeaderValue> | undefined,
): boolean {
  const values = headerValues(headers?.[MOBILE_CLIENT_HEADER]);
  return values.length === 1 && values[0].trim().toLowerCase() === MOBILE_CLIENT_VALUE;
}

export function authSuccessBody<T>(
  user: T,
  token: string,
  includeToken: boolean,
): { ok: true; user: T; token?: string } {
  if (!includeToken) {
    return { ok: true, user };
  }
  return { ok: true, user, token };
}
