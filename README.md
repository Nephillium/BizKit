# BizKit

Business application with web and mobile clients and AI-assisted generation. The web app generates cold emails, proposals, contracts, and social media packs. Accounts use email and password. Credits are purchased with Stripe. Anonymous visitors get one free generation.

## Status

Security hardening and a web build correction are tracked in PR #19. The mobile application is a separate project; its dependencies and build are not covered by the web build.

## Development

Use a supported Node.js version compatible with the locked dependencies (the validation environment used Node.js 24).

```sh
npm ci
npm run dev
```

The dev server listens on port 5000. Run `npm run check` for TypeScript validation and `npm run test:security` for the quota and admin-provisioning checks. Build with `npm run build`; start the production build with `npm start`.

Dependency installation alone does not configure database or external services. `npm run db:push` modifies the configured database schema; review the migration and back up production data before using it. The running app creates its tables through `POST /api/init-db` (see Database).

## Configuration

Copy `.env.example` to `.env` for local development. Never commit `.env` or put real secrets in the repo. Set the same variables in the host's environment (Vercel, Render, a VM behind Nginx, or any other Node host).

Required for production:

- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — at least 32 random characters. `SESSION_SECRET` is accepted as a fallback for the same signing secret
- `APP_BASE_URL` — public origin of the web app, used for Stripe return URLs in production
- `DB_INIT_TOKEN` — required to call `POST /api/init-db` in production
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`
- One AI backend (see AI generation)

Never use the development JWT fallback in production.

### Authentication

Sign-in is email and password. The browser stores a JWT in an httpOnly cookie; the mobile app sends the same token as `Authorization: Bearer`. Routes live under `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, and `/api/auth/logout`.

Public registration always creates a normal user. Admin is created only when `SUPER_USER_EMAIL` and `SUPER_USER_PASSWORD` are set in the server environment and `POST /api/init-db` runs. Login does not promote accounts. If that email already exists as a non-admin, it is left unchanged. `SUPER_USER_PASSWORD` is read only for that first create. After the admin row exists, remove the password from the host environment. Keep `SUPER_USER_EMAIL` so public signup keeps rejecting that address.

The admin role is copied into the JWT, which lasts 7 days. API checks use the role inside that token. Demoting an account in the database takes effect only after the token expires, or immediately if `JWT_SECRET` is rotated. Rotation invalidates every outstanding token.

### Anonymous free generation

Anonymous callers get one free generation. The limit is stored in Postgres (keyed by an HMAC of the client address), not in a browser cookie. Set `QUOTA_IP_SALT` to its own random value. If it is unset, the HMAC falls back to `JWT_SECRET` and then `SESSION_SECRET`, so rotating `JWT_SECRET` changes every quota key and resets anonymous limits. Set `TRUST_PROXY=1` (or `true`) only when the app sits behind exactly one trusted reverse proxy, for example Vercel, Render, or a single Nginx hop. With that setting the quota uses the rightmost `X-Forwarded-For` address, which is the address that one proxy appended. Leave `TRUST_PROXY` unset when the process is reached directly, and when more than one proxy appends to the header. More than one hop would key the quota on a shared proxy address. In production the free tier fails closed if the quota cannot be recorded.

`ADMIN_SECRET` is unused. The application does not read it. Do not add it to the deployment environment, and do not reuse an older value from git history.

### Checking the proxy hop on live traffic

`TRUST_PROXY=1` trusts exactly one reverse proxy. A typical Vercel, Render, or single-Nginx deployment appends one client address and ends TLS at that proxy. Confirm that on the URL clients actually use before relying on the free-generation limit:

1. From a network whose public address you know, request the published app and do not send `X-Forwarded-For`.
2. In deployment logs, record the socket remote address and the full `X-Forwarded-For` list for that request. Do not leave raw client addresses in lasting logs.
3. One entry equal to your public address means the rightmost value is the client, and one hop is correct.
4. Several entries when you sent none, with your public address not rightmost, means more than one proxy appended. The current code would then key the quota on a proxy address shared by every caller. Unset `TRUST_PROXY` until only one trusted proxy remains in front of the app.
5. Repeat with `X-Forwarded-For: 203.0.113.50`. The rightmost value should stay your public address. If it becomes `203.0.113.50`, the proxy is not appending a trusted hop and `TRUST_PROXY=1` is unsafe.
6. Check the public URL, not a preview URL that may take a different path. Another proxy in front of the host, such as Cloudflare with proxied DNS, is an extra hop this setting does not count. When the host already terminates TLS, keep that DNS record DNS-only so the app still sees a single trusted hop.

### AI generation

`POST /api/generate` calls one of two backends. LM Studio is used when `LMSTUDIO_API_URL` is set. Optional `LMSTUDIO_MODEL` defaults to `local-model`. Otherwise the route calls the Hugging Face Inference API (`mistralai/Mistral-7B-Instruct-v0.3`) with `HUGGINGFACE_API_KEY`. When both are set, LM Studio takes priority.

### Stripe

Checkout and webhooks use the `stripe` package with environment variables only:

- `STRIPE_SECRET_KEY` — secret key (`sk_test_...` or `sk_live_...`)
- `STRIPE_PUBLISHABLE_KEY` — publishable key (`pk_test_...` or `pk_live_...`)
- `STRIPE_WEBHOOK_SECRET` — webhook signing secret (`whsec_...`)

Point the Stripe webhook at `https://<your-host>/api/stripe/webhook`. In production, `APP_BASE_URL` supplies the success and cancel URLs.

### Database

1. Set `DATABASE_URL` to Postgres (Neon or any other Postgres host).
2. In production, set `DB_INIT_TOKEN` and call `POST /api/init-db` with `Authorization: Bearer <DB_INIT_TOKEN>`.
3. That creates `users`, `credit_transactions`, and `anonymous_generations`. Existing databases gain `users.email_verified`.
4. If `SUPER_USER_EMAIL` and `SUPER_USER_PASSWORD` are set, the same request creates the admin on first run.

## Mobile

The Expo app is in `mobile/`. It is not part of the root TypeScript project or the web build.

1. `cd mobile && npm install`
2. `src/lib/api.ts` defaults `API_BASE_URL` to `http://localhost:5000`. For a deployed backend, set it to the same origin as `APP_BASE_URL`.
3. `npm start` for Expo Go. Production binaries: `npx eas build --platform ios` or `npx eas build --platform android`.

See `mobile/README.md`.

## Code layout

The web app uses Next.js Pages Router (`pages/`, `lib/`). Auth routes are under `pages/api/auth/`. Generation is `pages/api/generate.ts`. Stripe is `pages/api/stripe/`.

## Deployment

Build with `npm run build` and start with `npm start` (port 5000). On Vercel, Render, or a VM:

1. Connect the repository and set the variables from `.env.example` that you use.
2. Production needs `DATABASE_URL`, `JWT_SECRET`, `APP_BASE_URL`, `DB_INIT_TOKEN`, the three Stripe variables, and either `HUGGINGFACE_API_KEY` or `LMSTUDIO_API_URL`.
3. Set `TRUST_PROXY=1` when that host puts exactly one trusted reverse proxy in front of the app (Vercel, Render, or a single Nginx hop).
4. Call `POST /api/init-db` once after the database is reachable.
5. Register the Stripe webhook URL in the Stripe dashboard.

## Validation limits

The repository audit and targeted security checks do not certify the entire application as production-ready. Verify deployment configuration, database migrations and real provider integrations in a controlled environment. The web build passed locally after excluding the independent mobile project from the root TypeScript configuration.
