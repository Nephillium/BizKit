# PitchCrafter Android builds

PitchCrafter is the public name of the Expo app in `mobile/` and of the web app. The GitHub repository is still named BizKit. The company is GLM Labs (`glmlabs.io`). The planned web origin is `https://pitchcrafter.glmlabs.io`. The Android application id is `com.glmlabs.pitchcrafter`.

Store builds use EAS remote credentials. Do not commit a keystore, `.jks`, upload certificate, Play service-account JSON, or `google-services.json`.

## Build

The EAS project is glm-labs/pitchcrafter.

From `mobile/`, after `npx eas login` and a one-time `npx eas init` that links this app to the Expo project:

```sh
eas build -p android --profile production
```

That production profile builds an Android App Bundle (`.aab`) for Google Play. Download the artifact from the EAS build page and upload it in Play Console to a closed test. Nothing in this repo submits the bundle or publishes a release.

An internal APK, for sideload checks and not for Play, uses the preview profile:

```sh
eas build -p android --profile preview
```

`eas.json` sets `credentialsSource` to `remote` and `appVersionSource` to `local`. The first time a production or preview build runs, EAS will create and store the upload key. Leave that key on EAS.

Both Android profiles set `"image": "sdk-54"`. That alias is the SDK 54 builder `ubuntu-24.04-jdk-17-ndk-r27b`, which has Java 17. SDK 54's Android Gradle Plugin does not start on Java 11. Do not remove the pin and do not switch it to `latest`. With no `image`, EAS uses `auto`. `latest` currently tracks a newer SDK image, not the SDK 54 toolchain.

`mobile/android` and `mobile/ios` stay gitignored. EAS generates them with `expo prebuild` during the build. They are not a committed native project, so the workflow stays managed (Continuous Native Generation). Do not check in a generated `android/` directory to work around a builder image. A checked-in tree would switch EAS to the bare workflow and can drift from the SDK in `package.json`.

`app.json` does not set `sdkVersion`. Expo reads the SDK from the installed `expo` package. If that package cannot be resolved when `eas build` starts, the managed-workflow check has no SDK version and warns that it does not support SDK < 41. `auto` then boots an old Java 11 image. Prebuild still writes an SDK 54 `android/app/build.gradle`, and Gradle stops on the first line because the Android Gradle plugin requires Java 17. The pinned image does not depend on that detection. Run `eas build` from `mobile/` after `npm ci`.

A production build of this managed app also warns that development uses Expo Go, because `expo-dev-client` is not installed. That warning does not select the builder image. The Play artifact is still the prebuilt app, not Expo Go.

Release builds call `https://pitchcrafter.glmlabs.io` unless `EXPO_PUBLIC_API_BASE_URL` is a public origin set on the EAS build. `mobile/.env` with `http://localhost:5000` is for `expo start` only. A localhost value is not used as the release API.

## Version bump

`mobile/app.json` is the source of truth.

Before every Play upload:

1. Increase `expo.android.versionCode` by 1. Play rejects an upload whose version code is less than or equal to one already used on any track. The first closed test is version code `1`.
2. Set `expo.version` to the version users see. The first upload is `1.0.0`. Change it when the release notes describe a new version. Play does not require it to change on every upload, but the version code must.

Do not enable EAS `autoIncrement` while version code is committed in git. Commit the bump, then build.

## Data safety

Use this when filling in the Play Data safety form. The Android app does not ship an ads SDK or a crash reporter.

Firebase Analytics is optional and off by default. A build without `google-services.json` does not link the Firebase SDK, so that build collects no analytics. When the file is present, collection stays off until the person accepts the in-app consent prompt. The default is denied. This app logs only `sign_up` (account created) and `purchase` (a credit purchase). It does not log screen views, and advertising-id collection is turned off. After consent, Firebase may also send its automatic session events (such as `session_start`) while collection is on. Android does not sell credits in this version, so a purchase event is not sent until Play Billing exists. Change the choice later under Settings. Declining or dismissing the prompt keeps analytics off.

Collected and sent to the PitchCrafter API over HTTPS:

| Data | What happens to it |
| --- | --- |
| Email address | Account identifier. Stored on the server. |
| Google subject id and name | Stored only when the person uses Continue with Google. The profile photo is not stored. The Android app sends Google's ID token to the API over HTTPS and does not keep that token on the device. |
| Password | Sent only to register or log in with a password. The server stores a hash. The app does not keep the password. Google sign-in does not send a password. |
| Account id, role, and credit balance | Returned by the API and shown in the app. |
| Session token | Stored on the device in Expo SecureStore under `auth_token`. Sent as `Authorization: Bearer` on later requests. The `expo-secure-store` config plugin excludes that store from Android backup and device transfer. |
| Generator text | Prompts the person types, and the generated draft. Signed-in generations are stored in Postgres for that account (history). |
| IP address, anonymous use only | The server stores an HMAC of the client address to enforce one free generation. It does not store the raw address in that table. The app does not read the IP itself. |

Stored only on the device:

- UI language (`en` or `tr`) in AsyncStorage.
- Analytics consent (`granted` or `denied`) in AsyncStorage. An unset choice is treated as denied.

Not collected by this Android app:

- Location, contacts, photos, microphone, advertising id, health data, and payment card data.
- Credit purchases. Android hides the buy-credits entry points. The screen does not show prices or a link to the website. It can say that credit purchases are not available in this version. The credit balance is still shown. See `mobile/src/lib/playBilling.ts`. Web Stripe and iOS checkout are unchanged.

Account deletion for the Play Console “Delete account URL” field:

`https://pitchcrafter.glmlabs.io/account/delete`

That page explains deletion, lets a signed-in person confirm and delete, and lists `admin@glmlabs.io` when they cannot sign in. The Android app deletes from Settings on the profile screen, with a confirmation step, by calling `POST /api/account/delete`. Deletion removes the account, saved generations, credit balance, credit history, and the Google sign-in link, and signs the person out. PitchCrafter does not store card numbers. Payment records Stripe already holds for a completed purchase stay in Stripe when tax or accounting rules require that record. This app does not delete those Stripe records.

The only Android permission the app keeps is `android.permission.INTERNET`. Storage, vibrate, and system-alert-window permissions that the Expo template adds are blocked in `app.json`.

## Firebase Analytics

Analytics stays disabled unless both of these are true: the person has accepted the consent prompt, and this build included a Firebase Android config.

1. In the Firebase console, register Android app id `com.glmlabs.pitchcrafter` and download `google-services.json`.
2. For a local build, put that file at `mobile/google-services.json`. It is gitignored.
3. For EAS, create a file environment variable named `GOOGLE_SERVICES_JSON` whose value is that file. Do not commit the JSON or paste it into the repo.
4. Rebuild. `mobile/app.config.ts` links `@react-native-firebase/app` and `@react-native-firebase/analytics` only when that file is present, and sets `extra.firebaseAnalytics`. `mobile/react-native.config.js` leaves those native modules unlinked when the file is absent, so `eas build` still succeeds and analytics cannot start.

No Firebase API secret belongs in the app. `mobile/firebase.json` keeps collection off until consent, turns off automatic screen reporting, and turns off advertising-id collection. After the person consents, Firebase's automatic session events may still be sent. The app itself only logs `sign_up` and `purchase`.

## Continue with Google

The Android button is hidden unless both of these are true:

1. The EAS build (or `mobile/.env` for a local build) sets `EXPO_PUBLIC_GOOGLE_AUTH=1`.
2. The API reports `googleAuth: true`, which happens only when `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and an https `APP_BASE_URL` are set on the server.

The label is the English string "Continue with Google", using Google's button colors (white fill, `#747775` border, `#1f1f1f` label, four-color G). The session is still the bearer token in SecureStore under `auth_token`.

### Native account picker

Native sign-in is on only when `EXPO_PUBLIC_GOOGLE_AUTH=1` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set. That second value is the Web client id, the same string as the server's `GOOGLE_CLIENT_ID`. It is public. Do not commit a real value.

The app uses `@react-native-google-signin/google-signin` (config plugin in `mobile/app.config.ts`, so EAS prebuild links it). `GoogleSignin.configure({ webClientId })` requests an ID token for that Web client. The button asks Android for the account picker. On success the app POSTs `{ id_token }` to `/api/auth/google/native` with `X-PitchCrafter-Client: mobile`. The server also accepts `X-BizKit-Client: mobile` from older builds. The server checks the signature with Google's certificates, `iss`, `aud == GOOGLE_CLIENT_ID`, `exp`, and `email_verified`, then links or creates the user the same way as the browser callback. The response is the same bearer shape as `/api/auth/google/exchange`. The Google ID token is not stored and is not logged.

Cancelling the account picker returns without an error, the same as dismissing the browser. A device with no Google account, and missing or outdated Play services, show a message and do not open the browser.

The browser PKCE flow is the automatic fallback when the native module is missing (Expo Go), the platform is not Android, or Google returns a developer/config error (`DEVELOPER_ERROR`, including a SHA-1 that is not registered). That flow opens the system browser (`expo-web-browser` / `expo-auth-session`) on `GET /api/auth/google/start?client=mobile&code_challenge=...`. The challenge is the S256 hash of a verifier that stays on the device. Google redirects to the web callback. The server then redirects to `pitchcrafter://auth/google` with a single-use code that expires in 60 seconds, not the session token. The app POSTs the code and its verifier to `/api/auth/google/exchange`. Another app that registers the same scheme can see the code, but it cannot redeem the code without the verifier. Expo Go does not register that scheme, so the browser return path needs an EAS or development build that includes `scheme: pitchcrafter`.

### Android OAuth clients

Create these in the same Google Cloud project as the Web client. Nothing new goes on Vercel. An Android OAuth client has no secret.

1. Play Console → Test and release → App integrity → App signing key certificate. Copy the SHA-1.
2. From `mobile/`, run `eas credentials` and copy the SHA-1 of the EAS upload key.
3. Google Cloud → APIs & Services → Credentials → Create credentials → OAuth client ID → Android.
4. Package name: `com.glmlabs.pitchcrafter`.
5. Google Cloud accepts one SHA-1 on each Android client. Create one client with the Play App Signing SHA-1 and a second client with the EAS upload-key SHA-1. Use the same package name on both.
6. Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` on the EAS build to the Web client id (`GOOGLE_CLIENT_ID`).

A build signed by a different certificate (a local debug keystore, for example) gets `DEVELOPER_ERROR` from Google and falls back to the browser. Play-installed builds are signed by the Play App Signing key, so that SHA-1 is the one those installs use. The upload-key SHA-1 covers an APK or AAB that is still signed by EAS, before Play re-signs it.

The config plugin also writes an iOS URL scheme `com.googleusercontent.apps.pitchcrafter`. That string is not an OAuth client id. Android does not read it. The plugin requires some scheme value even for an Android build. Replace it with the reversed iOS client id before shipping native Google sign-in on iOS. iOS keeps the browser flow.

## Privacy policy

`https://pitchcrafter.glmlabs.io/privacy`

Play Console requires this public privacy policy URL before a closed test can be rolled out. Paste that same URL into the store listing.
