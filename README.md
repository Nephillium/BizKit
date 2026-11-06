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
| `APP_BASE_URL` | `http://localhost:5000` | Required. Public origin. Stripe return URLs use it. |
| `DEMO_MODE` | Optional. `1` forces sample output. Empty AI keys also use samples. | Leave unset for live generation. `1` keeps samples (the private `bizkit-demo` preview does this). Unset, with no AI key, `POST /api/generate` returns 503 and does not spend credits. |
| `HUGGINGFACE_API_KEY` | Leave empty for the demo. | One of this or `LMSTUDIO_API_URL`. |
| `LMSTUDIO_API_URL` / `LMSTUDIO_MODEL` | Leave empty for the demo. | Local OpenAI-compatible server. Used before Hugging Face when both are set. |
| `DEMO_USER_*` | Seed only. Refused in production. | Do not rely on these. |
| `DEMO_SIGNUP_CREDITS` | Starter credits for local signups. Default 5. | Ignored. New accounts start at 0. |
| `DB_INIT_TOKEN` | Optional. | Required for `POST /api/init-db`. |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Leave empty. Checkout is disabled. | Required for live purchases. |
| `SUPER_USER_EMAIL`, `SUPER_USER_PASSWORD` | Optional. | Optional. See Authentication. |
| `TRUST_PROXY` | Leave empty. | `1` only behind exactly one trusted proxy. |
| `QUOTA_IP_SALT` | Optional. | Set a dedicated random value. |

`ADMIN_SECRET` is unused. Do not set it, and do not reuse an older value from git history.

### AI

`POST /api/generate` uses labelled demo samples when `DEMO_MODE` is `1`, `true`, or `yes`. It also uses samples when `NODE_ENV` is not `production` and both `HUGGINGFACE_API_KEY` and `LMSTUDIO_API_URL` are empty. In production, if neither provider is set and `DEMO_MODE` is not enabled, the route returns HTTP 503 with `ai_not_configured` and does not deduct a credit or record a generation. Otherwise LM Studio wins when `LMSTUDIO_API_URL` is set (`LMSTUDIO_MODEL` defaults to `local-model`). Otherwise the route calls Hugging Face Inference (`mistralai/Mistral-7B-Instruct-v0.3`). The home page shows the active provider. There is no OpenAI model picker.

### Stripe

Checkout and webhooks use `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` only. If the secret key is missing, Buy Credits is disabled and `POST /api/stripe/create-checkout` returns 503 with a message. The webhook returns 503 instead of throwing. Point a live webhook at `https://<your-host>/api/stripe/webhook`. In production, `APP_BASE_URL` supplies the success and cancel URLs.

### Database

`npm run db:init` (also `npm run db:push`) applies the schema. `npm run db:seed` upserts the demo user. `npm run db:setup` runs both.

`POST /api/init-db` applies the same schema. In production it requires `Authorization: Bearer <DB_INIT_TOKEN>`. That request creates `users`, `credit_transactions`, `anonymous_generations`, and `generations`. If `SUPER_USER_EMAIL` and `SUPER_USER_PASSWORD` are set, it creates the admin on first run only.

### Authentication

Sign-in is email and password. A successful `POST /api/auth/login` or `POST /api/auth/register` sets an httpOnly cookie named `bizkit_token` (7 days, `SameSite=Lax`, `Secure` in production). The JSON body is `{ ok: true, user }` and does not include the session token.

The Expo app cannot read that cookie. On login and register it sends `X-BizKit-Client: mobile`. The value must be exactly `mobile` (capitalization and surrounding spaces are ignored; a list of values is ignored). Only then does the JSON also include `token`. The app stores that value and sends `Authorization: Bearer <token>` on later requests. `/api/auth/me`, `/api/generate`, `/api/generations`, and `/api/stripe/create-checkout` accept either the cookie or that bearer token. Any other client, including the web app, omits the header and receives `{ ok: true, user }` only. A field in the JSON body is ignored.

Routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/logout`.

Public registration always creates a normal user. Admin is created only when `SUPER_USER_EMAIL` and `SUPER_USER_PASSWORD` are set and `POST /api/init-db` (or `npm run db:init`) runs. Login does not promote accounts. If that email already exists as a non-admin, it is left unchanged. `SUPER_USER_PASSWORD` is read only for that first create. After the admin row exists, remove the password. Keep `SUPER_USER_EMAIL` so public signup keeps rejecting that address.

The admin role is copied into the JWT, which lasts 7 days. API checks use the role inside that token. Demoting an account takes effect after the token expires, or immediately if `JWT_SECRET` is rotated. Rotation invalidates every outstanding token.

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

Set `EXPO_PUBLIC_API_BASE_URL` to the web origin (`APP_BASE_URL`) with no trailing slash. Restart Expo after changing it. See `mobile/README.md`.

## Deploy

### Vercel

The old biz-kit Vercel project was deleted. The current demo runs as a private Vercel preview project named `bizkit-demo`. That preview sets `DEMO_MODE=1`, so the generators return labelled samples without an AI key. Next.js detects the Pages Router; no `vercel.json` is required.

Production (`NODE_ENV=production`) needs these environment variables:

- `DATABASE_URL` — hosted Postgres. Include `sslmode=require` when the host requires TLS.
- `JWT_SECRET` — 32 or more random characters. The example placeholder is rejected.
- `APP_BASE_URL` — public origin. Stripe return URLs use it.
- `DB_INIT_TOKEN` — bearer token required by `POST /api/init-db`.
- `QUOTA_IP_SALT` — dedicated random value for the anonymous free-tier hash.
- `HUGGINGFACE_API_KEY` or `LMSTUDIO_API_URL` — live generation. If both are empty and `DEMO_MODE` is not `1`, `POST /api/generate` returns 503 and does not deduct credits.

Live purchases also need `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`. Set `TRUST_PROXY=1` only after the hop check above confirms Vercel is the single trusted proxy. Optional first-run admin: `SUPER_USER_EMAIL` and `SUPER_USER_PASSWORD`, then remove the password after init.

1. Create a hosted Postgres database and set `DATABASE_URL`.
2. Set `JWT_SECRET`, `APP_BASE_URL`, `DB_INIT_TOKEN`, and `QUOTA_IP_SALT`.
3. Set `TRUST_PROXY=1` after you confirm Vercel is the only proxy. See the hop check above.
4. For live generation, set `HUGGINGFACE_API_KEY` or `LMSTUDIO_API_URL` and leave `DEMO_MODE` unset. Set `DEMO_MODE=1` only for a sample-output demo such as the private `bizkit-demo` preview. Production without a provider and without `DEMO_MODE=1` returns 503 and does not spend credits.
5. For payments, set the three `STRIPE_*` variables and register the webhook.
6. Deploy, then `POST /api/init-db` with `Authorization: Bearer <DB_INIT_TOKEN>`.
7. Optional: set `SUPER_USER_EMAIL` and `SUPER_USER_PASSWORD` before that init call, then remove the password.

Do not set `DEMO_USER_PASSWORD` on Vercel. The seed script will not run there unless someone executes it with `NODE_ENV` unset, which a normal Vercel build does not do.

### Render or Docker

`Dockerfile` builds the Next.js app and starts `npm start` on port 5000 (or `PORT`).

```sh
docker build -t bizkit .
docker run --env-file .env -p 5000:5000 bizkit
```

On Render, use the Dockerfile (or a Node service with `npm ci`, `npm run build`, and `npm start`). Set the same production variables as Vercel. Put Postgres on Render, Neon, or another host and set `DATABASE_URL`. Call `POST /api/init-db` once the app can reach the database. Set `TRUST_PROXY=1` only when Render is the single trusted hop.

The compose file is only the local database. It is not the application server.

## Code layout

`pages/` and `lib/` are the web app. Auth is `pages/api/auth/`. Generation is `pages/api/generate.ts`. History is `pages/api/generations`. Both history routes use `getSessionFromRequest`, so they accept the httpOnly cookie or `Authorization: Bearer`. `GET /api/generations` accepts `q` and `tool`, ignores any caller-supplied user id, and returns only the signed-in user's rows. `DELETE /api/generations/:id` deletes only when `user_id` matches that account. Stripe is `pages/api/stripe/`. `GET /api/config` reports demo mode, the provider, and whether Stripe checkout is enabled. It returns the demo login only when `NODE_ENV` is not production.

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

If `DATABASE_URL` is unset, `npm run test:api` uses `postgres://bizkit:bizkit@127.0.0.1:5432/bizkit`. If `JWT_SECRET` is missing or shorter than 32 characters, the runner generates a throwaway secret for that process and does not print it. The same applies to an empty `QUOTA_IP_SALT`. Point this at a local or CI database. The suite applies `lib/initSchema.ts` and deletes only the users and anonymous-quota rows it creates.

`npm run test:security` runs `tests/security-hardening.ts`, `tests/demo-mode.ts`, `tests/auth-session.ts`, and `tests/generation-history.ts`. That covers anonymous-quota decisions, admin-promotion rules, demo-mode selection, the production 503 when no AI provider is configured, the production seed refusal, the rule that login and register omit the session token unless the request sends `X-BizKit-Client: mobile`, and that history search text is a bound parameter scoped with `user_id`. `npm run test:api` calls the route handlers and checks:

- Anonymous free generation is one row in `anonymous_generations`, keyed by the server-observed address. Dropping cookies or sending `X-Forwarded-For` without `TRUST_PROXY` does not grant another try. A signed-in caller on that same address is not blocked by the anonymous row.
- In production, with `HUGGINGFACE_API_KEY` and `LMSTUDIO_API_URL` unset and `DEMO_MODE` unset, `POST /api/generate` returns 503 `ai_not_configured` and does not change credits, usage, history, or the anonymous quota. `DEMO_MODE=1` returns labelled sample output and then deducts one credit.
- Register, login, and logout against Postgres. Web clients get the httpOnly cookie and no `token` field, even if the JSON body asks for one. `X-BizKit-Client: mobile` also returns `token`. `GET /api/auth/me`, `/api/generations`, and `POST /api/stripe/create-checkout` reject missing or invalid credentials and accept either the cookie or `Authorization: Bearer`.
- History list and delete stay on the signed-in user for both the cookie and `Authorization: Bearer`. `q` and `tool` only narrow that user's rows. Deleting another user's id returns 404 and leaves the row in place.

These checks do not certify the whole app. Confirm database migrations and live provider keys in a controlled environment before a public launch.
