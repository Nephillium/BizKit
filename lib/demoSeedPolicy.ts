export const DEFAULT_DEMO_EMAIL = 'demo@bizkit.local';
export const DEFAULT_DEMO_PASSWORD = 'demo-only-password';
export const DEFAULT_DEMO_CREDITS = 25;

export interface DemoSeedConfig {
  email: string;
  password: string;
  credits: number;
}

function parseCredits(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

export function demoSeedConfig(): DemoSeedConfig {
  return {
    email: (process.env.DEMO_USER_EMAIL || DEFAULT_DEMO_EMAIL).toLowerCase().trim(),
    password: process.env.DEMO_USER_PASSWORD || DEFAULT_DEMO_PASSWORD,
    credits: parseCredits(process.env.DEMO_USER_CREDITS, DEFAULT_DEMO_CREDITS),
  };
}

/**
 * Demo credentials are local-only. The seed script must refuse in production
 * so this password cannot become a live account.
 */
export function demoSeedRefusal(): string | null {
  if (process.env.NODE_ENV === 'production') {
    return 'Demo seed refuses to run when NODE_ENV=production';
  }
  const { email, password, credits } = demoSeedConfig();
  const superEmail = (process.env.SUPER_USER_EMAIL || '').toLowerCase().trim();
  if (superEmail && email === superEmail) {
    return 'DEMO_USER_EMAIL must not be SUPER_USER_EMAIL';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'DEMO_USER_EMAIL must be an email address';
  }
  if (password.length < 10) {
    return 'DEMO_USER_PASSWORD must be at least 10 characters';
  }
  if (!Number.isInteger(credits) || credits < 1 || credits > 100) {
    return 'DEMO_USER_CREDITS must be an integer from 1 to 100';
  }
  return null;
}
