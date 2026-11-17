# PitchCrafter mobile app

React Native app for PitchCrafter (this repository is still BizKit). It drafts cold emails, proposals, contracts, and social posts.

## Features

- **Content Generation**: Create cold emails, proposals, contracts, and social media content
- **User Authentication**: Secure login and registration
- **Credits**: On Android, credit packs are not sold in the app. Manage the plan on the website. Other platforms can open the existing Stripe checkout. See `docs/ANDROID.md`.
- **Bilingual Support**: English and Turkish languages
- **Native Experience**: Runs on iOS and Android

## Prerequisites

Before building the app, ensure you have:

1. **Node.js** (v18 or later)
2. **npm** or **yarn**
3. **Expo CLI** (`npm install -g @expo/cli`)
4. **For iOS**: Xcode (Mac only)
5. **For Android**: Android Studio with SDK

## Setup Instructions

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure API URL

The app reads `EXPO_PUBLIC_API_BASE_URL` (no trailing slash), then `extra.apiBaseUrl` from the Expo config. Copy the example and point it at the web app:

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
```

For a phone on the same network, use the computer's LAN address instead of `localhost`. For a deployed backend, use the same origin as `APP_BASE_URL`. Expo inlines `EXPO_PUBLIC_*` when the bundle is built, so restart Expo after changing it. If the variable is unset during `expo start`, the client uses `http://localhost:5000`. EAS production and preview builds default to `https://pitchcrafter.glmlabs.io` and ignore a localhost value.

### 3. Run the App

**Development mode (Expo Go):**
```bash
npm start
```
Scan the QR code with the Expo Go app on your phone.

**iOS Simulator (Mac only):**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

## Building for Production

Android App Bundle and version-code rules are in `docs/ANDROID.md`.

### Android (Google Play closed test)

```bash
eas build -p android --profile production
```

That builds an `.aab` with EAS remote credentials. Do not commit a keystore. An internal APK uses `--profile preview`.

### iOS (App Store)

iOS signing is not configured for a store release yet. A local simulator build is `npm run ios`.

## Project Structure

```
mobile/
├── App.tsx                 # Main app entry point
├── src/
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Authentication state
│   │   └── LanguageContext.tsx # Language preferences
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   └── translations.ts     # Translations
│   └── screens/
│       ├── LoginScreen.tsx     # Login form
│       ├── RegisterScreen.tsx  # Registration form
│       ├── HomeScreen.tsx      # Main content generation
│       ├── ProfileScreen.tsx   # User profile
│       └── BuyCreditsScreen.tsx # Credit purchases
├── package.json
└── tsconfig.json
```

## Backend Requirements

The mobile app requires the BizKit web backend to be running. Login and register send `X-BizKit-Client: mobile` so the API includes the session token in JSON. The app stores that token and sends `Authorization: Bearer <token>` on later requests. The backend provides:

- `/api/auth/login` - User authentication
- `/api/auth/register` - User registration  
- `/api/auth/me` - Get current user
- `/api/generate` - Content generation
- `/api/stripe/create-checkout` - Stripe checkout

## Customization

### App Icon and Splash Screen

Update `app.json` with your own assets:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png"
    }
  }
}
```

### Colors

Edit the color values in the StyleSheet objects in each screen component.

## Troubleshooting

### Common Issues

1. **Network Error**: Ensure the backend URL is correct and accessible
2. **Auth Token Issues**: Clear app data and log in again
3. **Build Errors**: Run `npx expo doctor` to check configuration

### Expo Go Limitations

Some features require a development build:
- In-app purchases
- Push notifications
- Custom native modules

Create a development build:
```bash
npx eas build --profile development --platform ios
```

## License

Private - All rights reserved
