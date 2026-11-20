# BizKit

Web and mobile app that drafts cold emails, proposals, contracts, and social packs. Accounts use email and password. Credits are purchased with Stripe when it is configured. Anonymous visitors get one free generation.

The web app is Next.js (Pages Router). Postgres is accessed with `pg`. Schema changes live in `lib/initSchema.ts` (and `schema.sql`).

## Run the demo

Needs Node.js 22+ and Docker.

```sh
cp .env.example .env
npm ci
npm run db:up
npm run db:setup
npm run dev
```

Open http://localhost:5000.

`npm run db:up` starts Postgres from `docker-compose.yml` (`postgres://bizkit:bizkit@localhost:5432/bizkit`, local only). `npm run db:setup` creates the tables and the demo user.

Demo login (also on the sign-in dialog outside production):

- Email: `demo@bizkit.local`
- Password: `demo-only-password`
- 25 credits

The password and email come from `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`, and `DEMO_USER_CREDITS`. `npm run db:seed` refuses when `NODE_ENV=production`, and it never creates an admin. Do not use this password on a public server.

Leave `HUGGINGFACE_API_KEY` and `LMSTUDIO_API_URL` empty. Outside production, each generator then returns labelled sample text. A banner on the home page says demo mode is on. Production does not do this unless `DEMO_MODE=1`.

Signed-in generations are stored in Postgres and show up under History. History can be searched, filtered by tool, copied, and deleted. Delete asks for confirmation, and the API removes a row only when it belongs to the signed-in user. `npm run db:setup` and `npm run db:seed` add four sample generations when that account has none, so the local demo has something to search. Buy Credits stays disabled, with an explanation, until `STRIPE_SECRET_KEY` is set.

`npm ci` and `npm run dev` start without Docker. Login, generation, and history need the database from `db:up` and `db:setup`.

Other checks: `npm run lint`, `npm run check`, `npm test`, `npm run build`. Production start: `npm start` (port `PORT` or 5000).

## Configuration

Copy `.env.example` to `.env`. Never commit `.env`.

| Variable | Demo | Production |
| --- | --- | --- |
| `DATABASE_URL` | Required. The compose URL above. | Required. Hosted Postgres. |
| `JWT_SECRET` | Optional. Dev uses an insecure fallback if unset. | Required. 32+ random characters. The example placeholder is rejected. |
| `APP_BASE_URL` | `http://localhost:5000` | Required. Public origin. Stripe return URLs and the Google redirect URI use it. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Leave empty. "Continue with Google" stays hidden. | Optional. Both must be set, with `APP_BASE_URL` on https, or the button stays hidden. Web application client only. |
| `DEMO_MODE` | Optional. `1` forces sample output. Empty AI keys also use samples. | Leave unset for live generation. `1` keeps samples (the private `bizkit-demo` preview does this). Unset, with no AI key, `POST /api/generate` returns 503 and does not spend credits. |
| `OPENAI_API_KEY` | Leave empty for the demo. | Official OpenAI key. With `AI_PROVIDER` unset, this selects OpenAI. |
| `HUGGINGFACE_API_KEY` | Leave empty for the demo. | One of this, `OPENAI_API_KEY`, or `LMSTUDIO_API_URL`. |
| `LMSTUDIO_API_URL` / `LMSTUDIO_MODEL` | Leave empty for the demo. | Local OpenAI-compatible server. Used after OpenAI and before Hugging Face when `AI_PROVIDER` is unset. |
| `AI_PROVIDER`, `AI_MODEL`, `AI_BASE_URL`, `AI_API_KEY` | Leave empty. The default provider rule stays. | Optional. Set `AI_PROVIDER` to switch the live brand without a code change. `openai` uses `OPENAI_API_KEY` and defaults to `gpt-5-mini`. `openai-compatible` also needs `AI_BASE_URL` and `AI_API_KEY`. |
| `DEMO_USER_*` | Seed only. Refused in production. | Do not rely on these. |
| `DEMO_SIGNUP_CREDITS` | Starter credits for local signups. Default 5. | Ignored. New accounts start at 0. |
| `DB_INIT_TOKEN` | Optional. | Required for `POST /api/init-db`. |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Leave empty. Checkout is disabled. | Required for live purchases. |
| `SUPER_USER_EMAIL`, `SUPER_USER_PASSWORD` | Optional. | Optional. See Authentication. |
| `TRUST_PROXY` | Leave empty. | `1` only behind exactly one trusted proxy. |
| `QUOTA_IP_SALT` | Optional. | Set a dedicated random value. |
| `CRON_SECRET` | Optional. The retention route stays closed. | Required for the daily retention cron. A long random value, for example `openssl rand -hex 32`. |
| `RETENTION_DRY_RUN` | Optional. `1` counts rows and deletes nothing. | Same. Leave unset so the cron deletes. |

`ADMIN_SECRET` is unused. Do not set it, and do not reuse an older value from git history.

### AI

`POST /api/generate` uses labelled demo samples when `DEMO_MODE` is `1`, `true`, or `yes`. It also uses samples when `NODE_ENV` is not `production` and no AI provider is configured. In production, if no provider is configured and `DEMO_MODE` is not enabled, the route returns HTTP 503 with `ai_not_configured` and does not deduct a credit or record a generation. With `AI_PROVIDER` unset, OpenAI wins when `OPENAI_API_KEY` is set (`AI_MODEL` defaults to `gpt-5-mini`). Otherwise LM Studio wins when `LMSTUDIO_API_URL` is set (`LMSTUDIO_MODEL` defaults to `local-model`). Otherwise the route calls Hugging Face Inference (`mistralai/Mistral-7B-Instruct-v0.3`).

`AI_PROVIDER` is the single switch for the live brand. Leave it unset to keep the rule above. `AI_PROVIDER` may be `openai`, `huggingface`, `lmstudio`, or `openai-compatible`. `AI_MODEL` overrides the model id. `openai` calls `https://api.openai.com/v1/chat/completions` with `OPENAI_API_KEY`. `openai-compatible` calls `${AI_BASE_URL}/chat/completions` with `AI_API_KEY`, so another chat-completions brand does not require a code change. An unknown `AI_PROVIDER` is treated as not configured. Live provider failures return HTTP 502 without provider details. The home page shows the active provider. There is no in-app model picker.

### Stripe

Checkout and webhooks use `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` only. If the secret key is missing, Buy Credits is disabled and `POST /api/stripe/create-checkout` returns 503 with a message. The webhook returns 503 instead of throwing. Point a live webhook at `https://<your-host>/api/stripe/webhook`. In production, `APP_BASE_URL` supplies the success and cancel URLs.

### Database

`npm run db:init` (also `npm run db:push`) applies the schema. `npm run db:seed` upserts the demo user. `npm run db:setup` runs both.

`POST /api/init-db` applies the same schema. In production it requires `Authorization: Bearer <DB_INIT_TOKEN>`. That request creates `users`, `credit_transactions`, `anonymous_generations`, `generations`, and `waitlist_signups`, and adds `users.last_sign_in_at` when it is missing. If `SUPER_USER_EMAIL` and `SUPER_USER_PASSWORD` are set, it creates the admin on first run only.

### Authentication

Sign-in is email and password. A successful `POST /api/auth/login` or `POST /api/auth/register` sets an httpOnly cookie named `bizkit_token` (7 days, `SameSite=Lax`, `Secure` in production). The JSON body is `{ ok: true, user }` and does not include the session token.

The Expo app cannot read that cookie. On login and register it sends `X-BizKit-Client: mobile`. The value must be exactly `mobile` (capitalization and surrounding spaces are ignored; a list of values is ignored). Only then does the JSON also include `token`. The app stores that value and sends `Authorization: Bearer <token>` on later requests. `/api/auth/me`, `/api/generate`, `/api/generations`, and `/api/stripe/create-checkout` accept either the cookie or that bearer token. Any other client, including the web app, omits the header and receives `{ ok: true, user }` only. A field in the JSON body is ignored.

Routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/logout`.

Google sign-in is off unless `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `APP_BASE_URL` are all set. Production also requires `APP_BASE_URL` to be https. The button is labeled "Continue with Google" and is hidden when that config is missing. The flow is the authorization-code grant with PKCE and a state cookie. The server checks the ID token signature, `aud`, `iss`, `exp`, and `email_verified`. Scopes are `openid email profile` only. A verified email links to the existing account; otherwise a new account is created with the same starting credits as a password signup. The Google row stores the subject id, email, and name. The profile photo is not stored. The session is the same `bizkit_token` cookie (and, for the Android app, the same bearer token). Account deletion removes the Google link. After deploying the schema change, call `POST /api/init-db` so `google_accounts` exists.

The redirect URI is `${APP_BASE_URL}/api/auth/google/callback`. For production that is `https://pitchcrafter.glmlabs.io/api/auth/google/callback`. The Android app does not use a separate Google client. It opens the system browser on `/api/auth/google/start?client=mobile` and receives the bearer token at `pitchcrafter://auth/google`. Set `EXPO_PUBLIC_GOOGLE_AUTH=1` on the app build or the mobile button stays hidden. See `docs/ANDROID.md`.

Public registration always creates a normal user. Admin is created only when `SUPER_USER_EMAIL` and `SUPER_USER_PASSWORD` are set and `POST /api/init-db` (or `npm run db:init`) runs. Login does not promote accounts. If that email already exists as a non-admin, it is left unchanged. `SUPER_USER_PASSWORD` is read only for that first create. After the admin row exists, remove the password. Keep `SUPER_USER_EMAIL` so public signup keeps rejecting that address.

The admin role is copied into the JWT, which lasts 7 days. API checks use the role inside that token. Demoting an account takes effect after the token expires, or immediately if `JWT_SECRET` is rotated. Rotation invalidates every outstanding token.

### Data retention

`GET /api/cron/retention` deletes personal data on a schedule. Vercel Cron calls that path daily at 04:15 UTC (`vercel.json`). The route also accepts `POST`, so Render or a manual check can use the same URL.

`CRON_SECRET` is a long random value and is never committed. The route requires `Authorization: Bearer <CRON_SECRET>` and answers 404 when the secret is missing or wrong. Vercel sends that header on cron runs when `CRON_SECRET` is set on the project. Until it is set, the schedule hits a closed route and deletes nothing.

The job is idempotent. It deletes in batches of 100, at most 25 batches per call, then stops. The next run continues. Each run writes one JSON log line with `event` `retention_cleanup` and the counts. It does not log email addresses. `?dryRun=1` (also `dry_run=1`, a JSON body `{ "dryRun": true }`, or `RETENTION_DRY_RUN=1`) counts rows and does not delete them. Dry-run reports the full set. A live call that hits the batch cap sets `truncated` and finishes on a later call.

Rules, measured from the time the job runs:

- Waitlist: a `waitlist_signups` row 12 months old or older is deleted when that email has no account that this run will keep. PitchCrafter does not collect waitlist sign-ups yet. The schema creates the table so a future form can insert `email` and `created_at`. The match is case-insensitive and ignores surrounding spaces. An email that already belongs to an account younger than 24 months is kept.
- Accounts: a user whose `last_sign_in_at` is 24 months old or older is deleted with their generations and credit transactions. That is the same deletion as Settings → delete account (`lib/accountDeletion.ts`). There was no sign-in timestamp before this change. The migration sets `last_sign_in_at` to the migration time for existing rows, because earlier sign-ins were not stored. Treating `created_at` as the last sign-in would delete accounts that people still use.

`recordSignIn` in `lib/signInTracking.ts` writes the timestamp. Email/password login and registration call it. Continue with Google should call `recordSignIn(userId)` after the user row exists and before it issues a session. A new row also defaults the column to `NOW()` if the insert omits it. Skip the call when Google signs in an existing account, and the old timestamp stays in place.

Kept on purpose: charges, customers, and invoices that Stripe already holds. This database does not copy Stripe customer or charge ids, and the job does not call Stripe. The credit-transaction rows in Postgres are the in-app balance ledger, not tax invoices, and they are deleted with the account, same as a person deleting their own account. Anonymous free-generation hashes are not tied to an account and are left in place.

Check a dry run after the schema is applied (`POST /api/init-db` or `npm run db:init`):

```sh
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://<your-host>/api/cron/retention?dryRun=1"
```

### Anonymous free generation

Anonymous callers get one free generation. The limit is stored in Postgres, keyed by an HMAC of the client address. Set `QUOTA_IP_SALT` to its own random value. If it is unset, the HMAC falls back to `JWT_SECRET` and then `SESSION_SECRET`, so rotating `JWT_SECRET` resets anonymous limits. Set `TRUST_PROXY=1` (or `true`) only behind exactly one trusted reverse proxy (Vercel, Render, or a single Nginx hop). That uses the rightmost `X-Forwarded-For` address. Leave `TRUST_PROXY` unset when the process is reached directly, and when more than one proxy appends to the header. In production the free tier fails closed if the quota cannot be recorded.

Confirm the hop on the public URL before relying on the limit:

1. From a network whose public address you know, request the app and do not send `X-Forwarded-For`.
2. In deployment logs, record the socket remote address and the full `X-Forwarded-For` list. Do not leave raw client addresses in lasting logs.
3. One entry equal to your public address means one hop is correct.
4. Several entries when you sent none, with your address not rightmost, means more than one proxy appended. Unset `TRUST_PROXY` until only one trusted proxy remains.
5. Repeat with `X-Forwarded-For: 203.0.113.50`. The rightmost value should stay your public address. If it becomes `203.0.113.50`, `TRUST_PROXY=1` is unsafe.
6. Check the public URL, not a preview URL. Another proxy such as Cloudflare with proxied DNS is an extra hop. Keep that DNS record DNS-only when the host already terminates TLS.

## Mobile

The Expo app is in `mobile/`. It is not part of the root TypeScript project or the web build.

```sh
cd mobile
cp .env.example .env
npm install
npm start
```

Set `EXPO_PUBLIC_API_BASE_URL` to the web origin (`APP_BASE_URL`) with no trailing slash. Restart Expo after changing it. Local development uses `http://localhost:5000` from `mobile/.env.example`. An EAS Android build defaults to `https://pitchcrafter.glmlabs.io`. The public app name is PitchCrafter. See `mobile/README.md` and `docs/ANDROID.md`.

## Deploy

### Vercel

The old biz-kit Vercel project was deleted. The current demo runs as a private Vercel preview project named `bizkit-demo`. That preview sets `DEMO_MODE=1`, so the generators return labelled samples without an AI key. Next.js detects the Pages Router. `vercel.json` only schedules the daily retention cron.

Production (`NODE_ENV=production`) needs these environment variables:

- `DATABASE_URL` — hosted Postgres. Include `sslmode=require` when the host requires TLS.
- `JWT_SECRET` — 32 or more random characters. The example placeholder is rejected.
- `APP_BASE_URL` — public origin. Stripe return URLs and the Google redirect URI use it.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — optional. Both are required before "Continue with Google" appears. Use a Web application client. Do not commit the secret.
- `DB_INIT_TOKEN` — bearer token required by `POST /api/init-db`.
- `QUOTA_IP_SALT` — dedicated random value for the anonymous free-tier hash.
- `CRON_SECRET` — bearer token for the daily retention cron. Leave it unset to keep that route closed.
- `HUGGINGFACE_API_KEY` or `LMSTUDIO_API_URL` — live generation when `AI_PROVIDER` is unset. A complete `AI_PROVIDER=openai-compatible` setting (`AI_MODEL`, `AI_BASE_URL`, `AI_API_KEY`) is the other way to configure a brand. If none of these are set and `DEMO_MODE` is not `1`, `POST /api/generate` returns 503 and does not deduct credits.

Live purchases also need `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`. Set `TRUST_PROXY=1` only after the hop check above confirms Vercel is the single trusted proxy. Optional first-run admin: `SUPER_USER_EMAIL` and `SUPER_USER_PASSWORD`, then remove the password after init.

1. Create a hosted Postgres database and set `DATABASE_URL`.
2. Set `JWT_SECRET`, `APP_BASE_URL`, `DB_INIT_TOKEN`, and `QUOTA_IP_SALT`.
3. Set `TRUST_PROXY=1` after you confirm Vercel is the only proxy. See the hop check above.
4. For live generation, set `HUGGINGFACE_API_KEY` or `LMSTUDIO_API_URL`, or set `AI_PROVIDER` and `AI_MODEL` (and `AI_BASE_URL` plus `AI_API_KEY` for `openai-compatible`). Leave `DEMO_MODE` unset. Set `DEMO_MODE=1` only for a sample-output demo such as the private `bizkit-demo` preview. Production without a provider and without `DEMO_MODE=1` returns 503 and does not spend credits.
5. For payments, set the three `STRIPE_*` variables and register the webhook.
6. Deploy, then `POST /api/init-db` with `Authorization: Bearer <DB_INIT_TOKEN>`.
7. Set `CRON_SECRET` and call `GET /api/cron/retention?dryRun=1` with `Authorization: Bearer <CRON_SECRET>` before leaving `RETENTION_DRY_RUN` unset.
8. Optional: set `SUPER_USER_EMAIL` and `SUPER_USER_PASSWORD` before the init call in step 6, then remove the password.

Do not set `DEMO_USER_PASSWORD` on Vercel. The seed script will not run there unless someone executes it with `NODE_ENV` unset, which a normal Vercel build does not do.

### Render or Docker

`Dockerfile` builds the Next.js app and starts `npm start` on port 5000 (or `PORT`).

```sh
docker build -t bizkit .
docker run --env-file .env -p 5000:5000 bizkit
```

On Render, use the Dockerfile (or a Node service with `npm ci`, `npm run build`, and `npm start`). Set the same production variables as Vercel. Put Postgres on Render, Neon, or another host and set `DATABASE_URL`. Call `POST /api/init-db` once the app can reach the database. Set `TRUST_PROXY=1` only when Render is the single trusted hop. Render does not read `vercel.json`. Schedule a daily `POST` to `https://<your-host>/api/cron/retention` with `Authorization: Bearer <CRON_SECRET>`.

The compose file is only the local database. It is not the application server.

## Code layout

`pages/` and `lib/` are the web app. Auth is `pages/api/auth/`. Generation is `pages/api/generate.ts`. History is `pages/api/generations`. Both history routes use `getSessionFromRequest`, so they accept the httpOnly cookie or `Authorization: Bearer`. `GET /api/generations` accepts `q` and `tool`, ignores any caller-supplied user id, and returns only the signed-in user's rows. `DELETE /api/generations/:id` deletes only when `user_id` matches that account. Stripe is `pages/api/stripe/`. `GET /api/cron/retention` runs data retention and requires `CRON_SECRET`. `GET /api/config` reports demo mode, the provider, and whether Stripe checkout is enabled. It returns the demo login only when `NODE_ENV` is not production.

## Tests

`npm test` runs both suites. CI (`.github/workflows/ci.yml`) runs install, lint, typecheck, build, and `npm test` on pull requests and pushes to `main`. The workflow starts Postgres 16 and generates throwaway `JWT_SECRET` and `QUOTA_IP_SALT` values. It does not use GitHub secrets or live AI/Stripe keys.

```sh
npm run lint          # eslint
npm run check         # tsc
npm run test:security # quota, demo gate, session-token rules, and history query binding. No database.
npm run test:api      # HTTP handlers against Postgres
npm test
```

API tests need a database. With Docker:

```sh
npm run db:up
npm run test:api
```

If `DATABASE_URL` is unset, `npm run test:api` uses `postgres://bizkit:bizkit@127.0.0.1:5432/bizkit`. If `JWT_SECRET` is missing or shorter than 32 characters, the runner generates a throwaway secret for that process and does not print it. The same applies to an empty `QUOTA_IP_SALT`. Point this at a local or CI database. The suite applies `lib/initSchema.ts` and deletes only the users and anonymous-quota rows it creates. Retention tests delete the `retention-*` users and waitlist rows they insert. Before that, they move any other already-expired `last_sign_in_at` or waitlist `created_at` forward to the test clock so a shared local database is not wiped.

`npm run test:security` runs `tests/security-hardening.ts`, `tests/demo-mode.ts`, `tests/auth-session.ts`, `tests/google-auth.ts`, `tests/generation-history.ts`, and `tests/mobile-api-base-url.ts`. That covers anonymous-quota decisions, admin-promotion rules, demo-mode selection, the production 503 when no AI provider is configured, the `AI_PROVIDER` switch, the production seed refusal, the rule that login and register omit the session token unless the request sends `X-BizKit-Client: mobile`, history search text as a bound parameter scoped with `user_id`, and the mobile API base URL plus the Android credit-purchase gate. `npm run test:api` calls the route handlers and checks:

- Anonymous free generation is one row in `anonymous_generations`, keyed by the server-observed address. Dropping cookies or sending `X-Forwarded-For` without `TRUST_PROXY` does not grant another try. A signed-in caller on that same address is not blocked by the anonymous row.
- In production, with `OPENAI_API_KEY`, `HUGGINGFACE_API_KEY`, and `LMSTUDIO_API_URL` unset and `DEMO_MODE` unset, `POST /api/generate` returns 503 `ai_not_configured` and does not change credits, usage, history, or the anonymous quota. `DEMO_MODE=1` returns labelled sample output and then deducts one credit.
- Register, login, and logout against Postgres. Web clients get the httpOnly cookie and no `token` field, even if the JSON body asks for one. `X-BizKit-Client: mobile` also returns `token`. `GET /api/auth/me`, `/api/generations`, and `POST /api/stripe/create-checkout` reject missing or invalid credentials and accept either the cookie or `Authorization: Bearer`.
- History list and delete stay on the signed-in user for both the cookie and `Authorization: Bearer`. `q` and `tool` only narrow that user's rows. Deleting another user's id returns 404 and leaves the row in place.
- Retention deletes a waitlist row at 12 months only when that email has no account this run keeps, and deletes an account at 24 months without a newer sign-in, including its generations and credit transactions. One second younger than either cutoff is kept. A second run deletes nothing further. Dry-run and a missing `CRON_SECRET` delete nothing. Login and `recordSignIn` refresh `last_sign_in_at`.

These checks do not certify the whole app. Confirm database migrations and live provider keys in a controlled environment before a public launch.
