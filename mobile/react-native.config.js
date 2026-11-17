const { googleServicesConfigured } = require('./src/lib/firebaseConfig.cjs');

const enabled = googleServicesConfigured(process.env.GOOGLE_SERVICES_JSON);
const unlinked = { platforms: { android: null, ios: null } };

// Without google-services.json the native SDK is not linked, so the Android
// build does not require that file and analytics cannot start.
module.exports = {
  dependencies: enabled
    ? {}
    : {
        '@react-native-firebase/app': unlinked,
        '@react-native-firebase/analytics': unlinked,
      },
};
