const PRODUCTION_API_BASE_URL = 'https://pitchcrafter.glmlabs.io';
const LOCAL_API_BASE_URL = 'http://localhost:5000';

function stripTrailingSlash(url) {
  return url.replace(/\/$/, '');
}

/** Hosts that belong to a developer machine, not the public PitchCrafter origin. */
function isLocalApiUrl(value) {
  try {
    const host = new URL(value).hostname.replace(/^\[|\]$/g, '').toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1'
    );
  } catch {
    return false;
  }
}

/**
 * Release builds default to the public origin. A localhost env or extra value
 * is ignored outside dev so a laptop .env cannot be baked into a Play build.
 * Local Metro still honors EXPO_PUBLIC_API_BASE_URL, including localhost.
 */
function resolveApiBaseUrl(input) {
  const envValue = input.envValue?.trim();
  if (envValue && (input.dev || !isLocalApiUrl(envValue))) {
    return stripTrailingSlash(envValue);
  }

  const extraValue = input.extraValue?.trim();
  if (extraValue && (input.dev || !isLocalApiUrl(extraValue))) {
    return stripTrailingSlash(extraValue);
  }

  return input.dev ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL;
}

/** Value stored on the Expo extra field when the config is evaluated. */
function resolveConfigApiBaseUrl(envValue, release) {
  return resolveApiBaseUrl({
    envValue,
    dev: !release,
  });
}

module.exports = {
  PRODUCTION_API_BASE_URL,
  LOCAL_API_BASE_URL,
  stripTrailingSlash,
  isLocalApiUrl,
  resolveApiBaseUrl,
  resolveConfigApiBaseUrl,
};
