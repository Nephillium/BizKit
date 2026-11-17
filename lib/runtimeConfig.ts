import { demoSeedConfig, demoSeedRefusal } from './demoSeedPolicy';

export type ProviderId = 'demo' | 'huggingface' | 'lmstudio' | 'openai-compatible' | 'unconfigured';

export type LiveProviderId = 'huggingface' | 'lmstudio' | 'openai-compatible';

/** Hugging Face model used when AI_MODEL is unset. */
export const DEFAULT_HUGGINGFACE_MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';

/** LM Studio model used when AI_MODEL and LMSTUDIO_MODEL are unset. */
export const DEFAULT_LMSTUDIO_MODEL = 'local-model';

export const AI_NOT_CONFIGURED_ERROR = 'ai_not_configured';

export const AI_NOT_CONFIGURED_MESSAGE =
  'AI generation is unavailable in production until HUGGINGFACE_API_KEY or LMSTUDIO_API_URL is set. Set DEMO_MODE=1 to serve labelled sample output. No credit was deducted.';

export function demoModeRequested(): boolean {
  const flag = (process.env.DEMO_MODE || '').trim().toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'yes';
}

function explicitAiProvider(): LiveProviderId | 'invalid' | null {
  const raw = (process.env.AI_PROVIDER || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw === 'huggingface' || raw === 'hugging-face' || raw === 'hf') return 'huggingface';
  if (raw === 'lmstudio' || raw === 'lm-studio') return 'lmstudio';
  if (raw === 'openai' || raw === 'openai-compatible') return 'openai-compatible';
  return 'invalid';
}

function credentialsReady(provider: LiveProviderId): boolean {
  if (provider === 'lmstudio') return Boolean(process.env.LMSTUDIO_API_URL);
  if (provider === 'huggingface') return Boolean(process.env.HUGGINGFACE_API_KEY);
  return Boolean(
    (process.env.AI_BASE_URL || '').trim() &&
      (process.env.AI_API_KEY || '').trim() &&
      (process.env.AI_MODEL || '').trim(),
  );
}

/**
 * Single server-side choice of AI brand and model.
 * Leave AI_PROVIDER unset to keep the historical default: LM Studio when
 * LMSTUDIO_API_URL is set, otherwise Hugging Face. Set AI_PROVIDER and
 * AI_MODEL to switch brands without a code change. openai-compatible calls
 * AI_BASE_URL/chat/completions with AI_API_KEY. An unknown AI_PROVIDER is
 * not configured.
 */
function selectedLiveProvider(): LiveProviderId | null {
  const explicit = explicitAiProvider();
  if (explicit === 'invalid') return null;
  if (explicit) return credentialsReady(explicit) ? explicit : null;
  if (process.env.LMSTUDIO_API_URL) return 'lmstudio';
  if (process.env.HUGGINGFACE_API_KEY) return 'huggingface';
  return null;
}

export function modelForProvider(provider: LiveProviderId): string {
  const override = (process.env.AI_MODEL || '').trim();
  if (override) return override;
  if (provider === 'lmstudio') {
    return (process.env.LMSTUDIO_MODEL || '').trim() || DEFAULT_LMSTUDIO_MODEL;
  }
  if (provider === 'huggingface') return DEFAULT_HUGGINGFACE_MODEL;
  return '';
}

export function aiProviderConfigured(): boolean {
  const explicit = explicitAiProvider();
  if (explicit === 'invalid') return false;
  if (explicit) return credentialsReady(explicit);
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
      provider: LiveProviderId;
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
  const live = selectedLiveProvider();
  if (live) {
    return { outcome: 'provider', provider: live, chargesCredit: true };
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
      detail: modelForProvider('lmstudio'),
    };
  }
  if (gate.provider === 'openai-compatible') {
    return {
      id: 'openai-compatible',
      label: 'OpenAI-compatible',
      detail: modelForProvider('openai-compatible'),
    };
  }
  return {
    id: 'huggingface',
    label: 'Hugging Face',
    detail: modelForProvider('huggingface'),
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
