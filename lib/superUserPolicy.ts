function superUserEmail(): string {
  return (process.env.SUPER_USER_EMAIL || '').toLowerCase().trim();
}

export function isUserSuperUser(email: string): boolean {
  const allowlisted = superUserEmail();
  if (!allowlisted) return false;
  return email.toLowerCase().trim() === allowlisted;
}

/** Public signup cannot claim the allowlisted admin email. */
export function publicSignupBlockReason(email: string): string | null {
  if (isUserSuperUser(email)) {
    return 'This email cannot be registered';
  }
  return null;
}

/**
 * Login never changes role. Admin is granted only by server-side provisioning
 * (SUPER_USER_EMAIL plus SUPER_USER_PASSWORD during database bootstrap).
 */
export function roleAfterAuthentication(storedRole: 'user' | 'admin', _email: string): 'user' | 'admin' {
  return storedRole;
}

export { superUserEmail };
