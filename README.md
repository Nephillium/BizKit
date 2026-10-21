# BizKit

Web and mobile app that drafts cold emails, proposals, contracts, and social packs. Accounts use email and password. Credits are purchased with Stripe when it is configured. Anonymous visitors get one free generation.

The web app is Next.js (Pages Router). Postgres is accessed with `pg`. Schema changes live in `lib/initSchema.ts` (and `schema.sql`). Drizzle packages are installed but are not used at runtime.

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

Leave `HUGGINGFACE_API_KEY` and `LMSTUDIO_API_URL` empty. Each generator then returns labelled sample text. A banner on the home page says demo mode is on.

Signed-in generations are stored in Postgres and show up under History. Buy Credits stays disabled, with an explanation, until `STRIPE_SECRET_KEY` is set.

`npm ci` and `npm run dev` start without Docker. Login, generation, and history need the database from `db:up` and `db:setup`.

Other checks: `npm run check`, `npm run test:security`, `npm run build`. Production start: `npm start` (port `PORT` or 5000).

## Configuration

Copy `.env.example` to `.env`. Never commit `.env`.

| Variable | Demo | Production |
| --- | --- | --- |
| `DATABASE_URL` | Required. The compose URL above. | Required. Hosted Postgres. |
| `JWT_SECRET` | Optional. Dev uses an insecure fallback if unset. | Required. 32+ random characters. The example placeholder is rejected. |
| `APP_BASE_URL` | `http://localhost:5000` | Required. Public origin. Stripe return URLs use it. |
| `DEMO_MODE` | Optional. `1` forces sample output. | Leave unset. |
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

`POST /api/generate` uses demo samples when `DEMO_MODE` is `1`, `true`, or `yes`, or when both `HUGGINGFACE_API_KEY` and `LMSTUDIO_API_URL` are empty. Otherwise LM Studio wins when `LMSTUDIO_API_URL` is set (`LMSTUDIO_MODEL` defaults to `local-model`). Otherwise the route calls Hugging Face Inference (`mistralai/Mistral-7B-Instruct-v0.3`). The home page shows the active provider. There is no OpenAI model picker.

### Stripe

Checkout and webhooks use `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` only. If the secret key is missing, Buy Credits is disabled and `POST /api/stripe/create-checkout` returns 503 with a message. The webhook returns 503 instead of throwing. Point a live webhook at `https://<your-host>/api/stripe/webhook`. In production, `APP_BASE_URL` supplies the success and cancel URLs.

### Database

`npm run db:init` (also `npm run db:push`) applies the schema. `npm run db:seed` upserts the demo user. `npm run db:setup` runs both.

`POST /api/init-db` applies the same schema. In production it requires `Authorization: Bearer <DB_INIT_TOKEN>`. That request creates `users`, `credit_transactions`, `anonymous_generations`, and `generations`. If `SUPER_USER_EMAIL` and `SUPER_USER_PASSWORD` are set, it creates the admin on first run only.

### Authentication

Sign-in is email and password. The browser stores a JWT in an httpOnly cookie. The mobile app sends `Authorization: Bearer`. Routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/logout`.

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

An older deployment lived at https://biz-kit-kohl.vercel.app. This repo does not attach to that project. Create a project from this repository (Next.js detects the Pages Router; no `vercel.json` is required).

1. Create a hosted Postgres database and set `DATABASE_URL` (include `sslmode=require` when the host requires TLS).
2. Set `JWT_SECRET` (32+ random characters), `APP_BASE_URL` (the Vercel origin), `DB_INIT_TOKEN`, and `QUOTA_IP_SALT`.
3. Set `TRUST_PROXY=1` after you confirm Vercel is the only proxy. See the hop check above.
4. For real generation, set `HUGGINGFACE_API_KEY` or `LMSTUDIO_API_URL` and leave `DEMO_MODE` unset. With both empty, production serves labelled sample output.
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

`pages/` and `lib/` are the web app. Auth is `pages/api/auth/`. Generation is `pages/api/generate.ts`. History is `pages/api/generations`. Stripe is `pages/api/stripe/`. `GET /api/config` reports demo mode, the provider, and whether Stripe checkout is enabled. It returns the demo login only when `NODE_ENV` is not production.

## Validation limits

`npm run test:security` covers the anonymous quota, admin-promotion rules, demo-mode selection, and the production seed refusal. It does not certify the whole app. Confirm database migrations and live provider keys in a controlled environment before a public launch.
