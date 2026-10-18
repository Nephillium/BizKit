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

Public registration always creates a normal user. Admin is created only when `SUPER_USER_EMAIL` and `SUPER_USER_PASSWORD` are set in the server environment and `POST /api/init-db` runs. Login does not promote accounts. If that email already exists as a non-admin, it is left unchanged. `SUPER_USER_PASSWORD` is read only for that first create. After the admin row exists, remove the password from secrets. Keep `SUPER_USER_EMAIL` so public signup keeps rejecting that address.

The admin role is copied into the JWT, which lasts 7 days. API checks use the role inside that token. Demoting an account in the database takes effect only after the token expires, or immediately if `JWT_SECRET` is rotated. Rotation invalidates every outstanding token.

Anonymous callers get one free generation. The limit is stored in Postgres (keyed by an HMAC of the client address), not in a browser cookie. Set `QUOTA_IP_SALT` to its own random value. If it is unset, the HMAC falls back to `JWT_SECRET` and then `SESSION_SECRET`, so rotating `JWT_SECRET` changes every quota key and resets anonymous limits. Set `TRUST_PROXY=1` only behind one trusted reverse proxy. With that setting the quota uses the rightmost `X-Forwarded-For` address, which is the address that one proxy appended. In production the free tier fails closed if the quota cannot be recorded.

`ADMIN_SECRET` is unused. The application does not read it. Do not add it to Replit Secrets or the deployment environment, and do not reuse an older value from git history.

### Checking the proxy hop on live traffic

Replit documents Autoscale and Reserved VM as a single published external port, with TLS ended at Replit and traffic forwarded to the app. A geography-specific proxy fronts published apps, and deployments expose `X-Forwarded-For`. Those pages do not state a hop count or say that the rightmost value is the client. Nothing in that documentation shows a second platform hop, so the code still trusts exactly one hop. Confirm that on the published URL before relying on the free-generation limit:

1. From a network whose public address you know, request the published app and do not send `X-Forwarded-For`.
2. In deployment logs, record the socket remote address and the full `X-Forwarded-For` list for that request. Do not leave raw client addresses in lasting logs.
3. One entry equal to your public address means the rightmost value is the client, and one hop is correct.
4. Several entries when you sent none, with your public address not rightmost, means more than one proxy appended. The current code would then key the quota on a proxy address shared by every caller.
5. Repeat with `X-Forwarded-For: 203.0.113.50`. The rightmost value should stay your public address. If it becomes `203.0.113.50`, the proxy is not appending a trusted hop and `TRUST_PROXY=1` is unsafe.
6. Check the published Autoscale or Reserved VM URL. The editor preview can use a different proxy path. Another proxy in front of Replit, such as Cloudflare's proxied DNS, is an extra hop this setting does not count. Replit's custom-domain setup expects the DNS record to be DNS-only.

## Code layout

The web app uses Next.js (`pages/`, `lib/`). The separate Expo app is in `mobile/`.

## Validation limits

The repository audit and targeted security checks do not certify the entire application as production-ready. Verify deployment configuration, database migrations and real provider integrations in a controlled environment. The web build passed locally after excluding the independent mobile project from the root TypeScript configuration.
