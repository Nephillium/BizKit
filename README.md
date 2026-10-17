# BizKit

Business application with web and mobile clients and AI-assisted generation.

## Status

Security hardening and a web build correction are tracked in PR #19. The mobile application is a separate project; its dependencies and build are not covered by the web build.

## Development

Use a supported Node.js version compatible with the locked dependencies (the validation environment used Node.js 24).

```sh
npm ci
npm run dev
```

Run `npm run check` for TypeScript validation. Build with `npm run build`; start the production build with `npm start`.

Dependency installation alone does not configure database or external services. `npm run db:push` modifies the configured database schema; review the migration and back up production data before using it.

## Configuration

Set DATABASE_URL, JWT_SECRET (at least 32 random characters), APP_BASE_URL, DB_INIT_TOKEN and Stripe credentials including STRIPE_WEBHOOK_SECRET. See .env.example. Never use the development JWT fallback in production.

Public registration always creates a normal user. Admin is created only when `SUPER_USER_EMAIL` and `SUPER_USER_PASSWORD` are set in the server environment and `POST /api/init-db` runs. Login does not promote accounts. If that email already exists as a non-admin, it is left unchanged.

Anonymous callers get one free generation. The limit is stored in Postgres (keyed by an HMAC of the client address), not in a browser cookie. Set `TRUST_PROXY=1` only behind one trusted reverse proxy. In production the free tier fails closed if the quota cannot be recorded.

`ADMIN_SECRET` belongs in Replit Secrets or the deployment environment. Do not commit it. The previous value is still in git history and must be rotated.

## Code layout

The web app uses Next.js (`pages/`, `lib/`). The separate Expo app is in `mobile/`.

## Validation limits

The repository audit and targeted security checks do not certify the entire application as production-ready. Verify deployment configuration, database migrations and real provider integrations in a controlled environment. The web build passed locally after excluding the independent mobile project from the root TypeScript configuration.
