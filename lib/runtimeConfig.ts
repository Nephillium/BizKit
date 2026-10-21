import { demoSeedConfig, demoSeedRefusal } from './demoSeedPolicy';

export type ProviderId = 'demo' | 'huggingface' | 'lmstudio';

export function demoModeRequested(): boolean {
  const flag = (process.env.DEMO_MODE || '').trim().toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'yes';
}

export function isDemoMode(): boolean {
  if (demoModeRequested()) return true;
  return !process.env.LMSTUDIO_API_URL && !process.env.HUGGINGFACE_API_KEY;
}

export function resolveProvider(): { id: ProviderId; label: string; detail: string } {
  if (isDemoMode()) {
    return {
      id: 'demo',
      label: 'Demo sample',
      detail: 'Sample output for every generator. No paid AI key is used.',
    };
  }
  if (process.env.LMSTUDIO_API_URL) {
    return {
      id: 'lmstudio',
      label: 'LM Studio',
      detail: process.env.LMSTUDIO_MODEL || 'local-model',
    };
  }
  return {
    id: 'huggingface',
    label: 'Hugging Face',
    detail: 'mistralai/Mistral-7B-Instruct-v0.3',
  };
}

export function stripeSecretConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Shown only outside production, and only when the demo seed would accept the values. */
export function publicDemoLogin(): { email: string; password: string } | null {
  if (process.env.NODE_ENV === 'production') return null;
  if (demoSeedRefusal()) return null;
  const { email, password } = demoSeedConfig();
  return { email, password };
}

export function publicRuntimeConfig() {
  const provider = resolveProvider();
  return {
    demoMode: provider.id === 'demo',
    provider: provider.id,
    providerLabel: provider.label,
    providerDetail: provider.detail,
    stripeEnabled: stripeSecretConfigured(),
    demoLogin: publicDemoLogin(),
  };
}
