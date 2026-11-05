import { demoSeedConfig, demoSeedRefusal } from './demoSeedPolicy';

export type ProviderId = 'demo' | 'huggingface' | 'lmstudio' | 'unconfigured';

export const AI_NOT_CONFIGURED_ERROR = 'ai_not_configured';

export const AI_NOT_CONFIGURED_MESSAGE =
  'AI generation is unavailable in production until HUGGINGFACE_API_KEY or LMSTUDIO_API_URL is set. Set DEMO_MODE=1 to serve labelled sample output. No credit was deducted.';

export function demoModeRequested(): boolean {
  const flag = (process.env.DEMO_MODE || '').trim().toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'yes';
}

export function aiProviderConfigured(): boolean {
  return Boolean(process.env.LMSTUDIO_API_URL || process.env.HUGGINGFACE_API_KEY);
}

/**
 * Labelled samples stay on in development when no provider is configured,
 * and in every environment when DEMO_MODE is explicitly enabled.
 * Production without a provider and without DEMO_MODE does not use samples.
 */
export function isDemoMode(): boolean {
  if (demoModeRequested()) return true;
  if (process.env.NODE_ENV === 'production') return false;
  return !aiProviderConfigured();
}

export type GenerationGate =
  | {
      outcome: 'sample';
      provider: 'demo';
      chargesCredit: true;
    }
  | {
      outcome: 'provider';
      provider: 'lmstudio' | 'huggingface';
      chargesCredit: true;
    }
  | {
      outcome: 'unavailable';
      provider: 'unconfigured';
      status: 503;
      error: typeof AI_NOT_CONFIGURED_ERROR;
      message: string;
      chargesCredit: false;
    };

/** Production with no AI provider and without DEMO_MODE must fail closed. */
export function generationGate(): GenerationGate {
  if (
    process.env.NODE_ENV === 'production' &&
    !demoModeRequested() &&
    !aiProviderConfigured()
  ) {
    return {
      outcome: 'unavailable',
      provider: 'unconfigured',
      status: 503,
      error: AI_NOT_CONFIGURED_ERROR,
      message: AI_NOT_CONFIGURED_MESSAGE,
      chargesCredit: false,
    };
  }
  if (isDemoMode()) {
    return { outcome: 'sample', provider: 'demo', chargesCredit: true };
  }
  if (process.env.LMSTUDIO_API_URL) {
    return { outcome: 'provider', provider: 'lmstudio', chargesCredit: true };
  }
  return { outcome: 'provider', provider: 'huggingface', chargesCredit: true };
}

/**
 * Credits removed after a successful logged-in generation.
 * Admins are not charged. The production 503 gate charges nothing.
 */
export function creditDeltaAfterGeneration(options: {
  gate: GenerationGate;
  isLoggedIn: boolean;
  isAdmin: boolean;
}): number {
  if (options.gate.chargesCredit === false) return 0;
  if (!options.isLoggedIn || options.isAdmin) return 0;
  return -1;
}

export function resolveProvider(): { id: ProviderId; label: string; detail: string } {
  const gate = generationGate();
  if (gate.outcome === 'unavailable') {
    return {
      id: 'unconfigured',
      label: 'Not configured',
      detail:
        'Production generation returns 503 and does not spend credits until an AI provider or DEMO_MODE=1 is set.',
    };
  }
  if (gate.outcome === 'sample') {
    return {
      id: 'demo',
      label: 'Demo sample',
      detail: 'Sample output for every generator. No paid AI key is used.',
    };
  }
  if (gate.provider === 'lmstudio') {
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
