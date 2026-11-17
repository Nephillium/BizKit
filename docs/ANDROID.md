# PitchCrafter Android builds

PitchCrafter is the public name of the Expo app in `mobile/`. The repository is still BizKit. The company is GLM Labs (`glmlabs.io`). The planned web origin is `https://pitchcrafter.glmlabs.io`. The Android application id is `com.glmlabs.pitchcrafter`.

Store builds use EAS remote credentials. Do not commit a keystore, `.jks`, upload certificate, or Play service-account JSON.

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

Use this when filling in the Play Data safety form. The Android app does not ship an ads SDK, crash reporter, or analytics SDK.

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

Not collected by this Android app:

- Location, contacts, photos, microphone, advertising id, health or financial data, and payment card data.
- In-app purchases. Credit packs are sold with Stripe on the website. The Android UI does not start checkout. See the Play Billing TODO in `mobile/src/lib/playBilling.ts`.

The only Android permission the app keeps is `android.permission.INTERNET`. Storage, vibrate, and system-alert-window permissions that the Expo template adds are blocked in `app.json`.

## Privacy policy

Placeholder, not a published page yet:

`https://pitchcrafter.glmlabs.io/privacy`

Play Console requires a public privacy policy URL before a closed test can be rolled out. Replace this placeholder after the page exists, and paste that same URL into the store listing. Do not mark the closed test ready until that page answers the data-safety notes above.
