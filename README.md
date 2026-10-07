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

## Code layout

The web app uses Next.js (`pages/`, `lib/`). The separate Expo app is in `mobile/`.

## Validation limits

The repository audit and targeted security checks do not certify the entire application as production-ready. Verify deployment configuration, database migrations and real provider integrations in a controlled environment. The web build passed locally after excluding the independent mobile project from the root TypeScript configuration.
