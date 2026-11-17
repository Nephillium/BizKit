# PitchCrafter Android builds

PitchCrafter is the public name of the Expo app in `mobile/`. The repository is still BizKit. The company is GLM Labs (`glmlabs.io`). The planned web origin is `https://pitchcrafter.glmlabs.io`. The Android application id is `com.glmlabs.pitchcrafter`.

Store builds use EAS remote credentials. Do not commit a keystore, `.jks`, upload certificate, Play service-account JSON, or `google-services.json`.

## Build

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
| Password | Sent only to register or log in. The server stores a hash. The app does not keep the password. |
| Account id, role, and credit balance | Returned by the API and shown in the app. |
| Session token | Stored on the device in Expo SecureStore under `auth_token`. Sent as `Authorization: Bearer` on later requests. |
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

That page explains deletion, lets a signed-in person confirm and delete, and lists `admin@glmlabs.io` when they cannot sign in. The Android app deletes from Settings on the profile screen, with a confirmation step, by calling `POST /api/account/delete`. Deletion removes the account, saved generations, credit balance, and credit history, and signs the person out. PitchCrafter does not store card numbers. Payment records Stripe already holds for a completed purchase stay in Stripe when tax or accounting rules require that record. This app does not delete those Stripe records.

The only Android permission the app keeps is `android.permission.INTERNET`. Storage, vibrate, and system-alert-window permissions that the Expo template adds are blocked in `app.json`.

## Firebase Analytics

Analytics stays disabled unless both of these are true: the person has accepted the consent prompt, and this build included a Firebase Android config.

1. In the Firebase console, register Android app id `com.glmlabs.pitchcrafter` and download `google-services.json`.
2. For a local build, put that file at `mobile/google-services.json`. It is gitignored.
3. For EAS, create a file environment variable named `GOOGLE_SERVICES_JSON` whose value is that file. Do not commit the JSON or paste it into the repo.
4. Rebuild. `mobile/app.config.ts` links `@react-native-firebase/app` and `@react-native-firebase/analytics` only when that file is present, and sets `extra.firebaseAnalytics`. `mobile/react-native.config.js` leaves those native modules unlinked when the file is absent, so `eas build` still succeeds and analytics cannot start.

No Firebase API secret belongs in the app. `mobile/firebase.json` keeps collection off until consent, turns off automatic screen reporting, and turns off advertising-id collection. After the person consents, Firebase's automatic session events may still be sent. The app itself only logs `sign_up` and `purchase`.

## Privacy policy

Placeholder, not a published page yet:

`https://pitchcrafter.glmlabs.io/privacy`

Play Console requires a public privacy policy URL before a closed test can be rolled out. Replace this placeholder after the page exists, and paste that same URL into the store listing. Do not mark the closed test ready until that page answers the data-safety notes above.
