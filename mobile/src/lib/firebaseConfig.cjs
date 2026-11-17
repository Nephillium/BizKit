const fs = require('fs');
const path = require('path');

const LOCAL_GOOGLE_SERVICES = path.join(__dirname, '..', '..', 'google-services.json');

/**
 * google-services.json is optional. Release and local builds stay valid
 * without it, and Firebase Analytics stays disabled.
 * GOOGLE_SERVICES_JSON is a filesystem path (an EAS file env), not the JSON itself.
 */
function resolveGoogleServicesFile(envPath) {
  const trimmed = typeof envPath === 'string' ? envPath.trim() : '';
  if (trimmed && fs.existsSync(trimmed)) return trimmed;
  if (fs.existsSync(LOCAL_GOOGLE_SERVICES)) return './google-services.json';
  return null;
}

function googleServicesConfigured(envPath) {
  return resolveGoogleServicesFile(envPath) !== null;
}

module.exports = {
  LOCAL_GOOGLE_SERVICES,
  resolveGoogleServicesFile,
  googleServicesConfigured,
};
