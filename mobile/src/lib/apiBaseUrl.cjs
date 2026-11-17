const PRODUCTION_API_BASE_URL = 'https://pitchcrafter.glmlabs.io';
const LOCAL_API_BASE_URL = 'http://localhost:5000';

function stripTrailingSlash(url) {
  return url.replace(/\/$/, '');
}

/** 10.0.0.0/8 (includes the emulator alias 10.0.2.2), 192.168.0.0/16, and 172.16.0.0/12. */
function isPrivateLanHost(host) {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!match) return false;
  const octets = match.slice(1).map((part) => Number(part));
  if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const a = octets[0];
  const b = octets[1];
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

/** Hosts that belong to a developer machine, not the public PitchCrafter origin. */
function isLocalApiUrl(value) {
  try {
    const host = new URL(value).hostname.replace(/^\[|\]$/g, '').toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      isPrivateLanHost(host)
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
  isPrivateLanHost,
  resolveApiBaseUrl,
  resolveConfigApiBaseUrl,
};
