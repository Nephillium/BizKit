# BizKit AI Mobile App

React Native mobile application for BizKit AI - your client-winning content generator.

## Features

- **Content Generation**: Create cold emails, proposals, contracts, and social media content
- **User Authentication**: Secure login and registration
- **Credits System**: Purchase credits via Stripe
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

Edit `src/lib/api.ts` and update the `API_BASE_URL` to point to your backend:

```typescript
const API_BASE_URL = 'https://your-app-url.replit.app';
```

For local development:
```typescript
const API_BASE_URL = 'http://localhost:5000';
```

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

### iOS (App Store)

1. Create an Apple Developer account
2. Configure app in App Store Connect
3. Build with EAS:
```bash
npx eas build --platform ios
```

### Android (Google Play)

1. Create a Google Play Developer account
2. Configure app in Play Console
3. Build with EAS:
```bash
npx eas build --platform android
```

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

The mobile app requires the BizKit AI backend to be running. The backend provides:

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
