import type { ConfigContext, ExpoConfig } from 'expo/config';
import { resolveConfigApiBaseUrl } from './src/lib/apiBaseUrl.cjs';

function isReleaseConfig(): boolean {
  if (process.env.EAS_BUILD === 'true') return true;
  if (process.env.NODE_ENV === 'production') return true;
  const profile = (process.env.EAS_BUILD_PROFILE || '').trim();
  return profile === 'production' || profile === 'preview';
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'PitchCrafter',
  slug: config.slug ?? 'pitchcrafter',
  extra: {
    ...(config.extra ?? {}),
    apiBaseUrl: resolveConfigApiBaseUrl(
      process.env.EXPO_PUBLIC_API_BASE_URL,
      isReleaseConfig(),
    ),
  },
});
