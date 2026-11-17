import type { ConfigContext, ExpoConfig } from 'expo/config';
import { resolveConfigApiBaseUrl } from './src/lib/apiBaseUrl.cjs';
import { resolveGoogleServicesFile } from './src/lib/firebaseConfig.cjs';

function isReleaseConfig(): boolean {
  if (process.env.EAS_BUILD === 'true') return true;
  if (process.env.NODE_ENV === 'production') return true;
  const profile = (process.env.EAS_BUILD_PROFILE || '').trim();
  return profile === 'production' || profile === 'preview';
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesFile = resolveGoogleServicesFile(process.env.GOOGLE_SERVICES_JSON);
  const plugins = [...(config.plugins ?? [])];
  if (googleServicesFile) {
    plugins.push('@react-native-firebase/app', '@react-native-firebase/analytics');
  }

  return {
    ...config,
    name: config.name ?? 'PitchCrafter',
    slug: config.slug ?? 'pitchcrafter',
    plugins,
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
    extra: {
      ...(config.extra ?? {}),
      apiBaseUrl: resolveConfigApiBaseUrl(
        process.env.EXPO_PUBLIC_API_BASE_URL,
        isReleaseConfig(),
      ),
      firebaseAnalytics: Boolean(googleServicesFile),
    },
  };
};
