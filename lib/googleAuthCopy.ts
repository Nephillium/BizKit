/** User-facing text for a Google redirect error code. Unknown codes stay generic. */
export function googleSignInErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case 'access_denied':
      return 'Google sign-in was cancelled.';
    case 'email_not_verified':
      return 'Google has not verified this email address.';
    case 'signup_blocked':
      return 'This email cannot be registered.';
    case 'identity_conflict':
      return 'This email is already linked to a different Google account.';
    case 'invalid_state':
      return 'Google sign-in expired. Try again.';
    default:
      return 'Google sign-in failed. Try again.';
  }
}
