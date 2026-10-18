# BizKit AI - Client-Winning Content Generator

## Overview

BizKit AI is a SaaS productivity tool designed for freelancers and agencies to rapidly generate professional business content. The application provides four core content generation tools: cold emails, proposals, contracts, and social media packs. Built with a focus on professional efficiency and clarity, the platform leverages AI to help users create client-winning content in seconds.

The application uses a Next.js architecture with React, TypeScript, and **PostgreSQL database** (Neon) for persistent user storage. The design philosophy emphasizes clean, distraction-free interfaces with progressive disclosure through tab-based navigation.

## Recent Changes (Dec 2024)

- **React Native Mobile App** - Complete mobile app in `/mobile` directory for iOS/Android
- **Bearer Token Auth Support** - API now supports Authorization header for mobile apps
- **PostgreSQL database integration** - Users stored persistently in Neon PostgreSQL
- **Credits system** - Users start with 0 credits, admins bypass credit checks
- **Stripe payments** - Users can purchase credits via Stripe checkout
- **Credits display** - Shows credits remaining next to username in navbar
- **Buy Credits page** - /buy-credits with three credit packages ($5, $20, $35)
- **Bcrypt password hashing** - Secure password storage with salts
- **JWT-based authentication** - Email/password registration and login
- **Super user support** - Provisioned on the server from SUPER_USER_EMAIL and SUPER_USER_PASSWORD. Public registration never grants admin.
- **1 free use limit** - Anonymous users get 1 generation, then must register
- **Turkish language support** - Full UI translation with language selector
- **Hugging Face AI** - Uses free Hugging Face Inference API (Mistral-7B model)

## Mobile App

The `/mobile` directory contains a React Native/Expo mobile app:

**Features:**
- Login/Register screens with secure token storage
- Content generation for all 4 content types
- Credits display and purchase via Stripe
- Bilingual support (English/Turkish)
- Tab navigation (Home, Profile)

**Building the Mobile App:**
1. `cd mobile && npm install` - Install dependencies
2. Update `src/lib/api.ts` with your backend URL
3. `npm start` - Start Expo development server
4. Use Expo Go app to test on your phone

**Production Builds:**
- iOS: `npx eas build --platform ios`
- Android: `npx eas build --platform android`

See `mobile/README.md` for full documentation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework Choice: Next.js with React**
- Next.js Pages Router for file-based routing
- React components built with TypeScript
- Standard Next.js development server on port 5000

**UI Component System**
- Custom inline styles for rapid development
- Responsive design with mobile support
- Professional color palette

**State Management**
- React hooks for local component state
- useAuth hook for authentication state

**Internationalization**
- Full Turkish and English language support
- Language selector button in navbar
- Translations stored in lib/translations.ts
- Language preference saved to localStorage

### Backend Architecture

**API Routes: Next.js API Routes**
- RESTful API structure with `/api` prefix
- Type-safe request/response handling
- JWT-based authentication via cookies

**Authentication System (PostgreSQL-backed)**
- User registration: POST /api/auth/register
- User login: POST /api/auth/login  
- User info: GET /api/auth/me
- Logout: POST /api/auth/logout

**Super User / Admin**
- Set SUPER_USER_EMAIL and SUPER_USER_PASSWORD in Replit Secrets (not in the repo)
- Call POST /api/init-db to create that account as a verified admin
- SUPER_USER_PASSWORD is used only when that first create runs. After the admin exists, remove the password from secrets. Leave SUPER_USER_EMAIL in place so public signup keeps rejecting that address
- Public signup cannot register that email, and login does not change anyone's role
- If the email already exists as a non-admin, init-db will not elevate it
- Admins have unlimited generations (bypass credit checks)
- The admin role is copied into a JWT that lasts 7 days. Generate and `/api/auth/me` trust that token. Demoting the account in the database applies only after the token expires, or immediately if JWT_SECRET is rotated (that signs out every session)

**Usage Limits**
- Anonymous users: 1 free generation, recorded server-side by client address (not a browser cookie)
- Set QUOTA_IP_SALT to its own random value. If it is unset, the address hash uses JWT_SECRET or SESSION_SECRET, and rotating that secret resets anonymous quotas
- TRUST_PROXY=1 trusts one Replit proxy and uses the rightmost X-Forwarded-For address. Confirm that on live traffic before relying on the limit (see Proxy hop check)
- Registered users: Require credits to generate (start with 0)
- Admin users: Unlimited generations

### Data Storage

**PostgreSQL Database (Neon)**
- Users table with credits, role, password_hash
- Credit transactions table for audit trail
- Database connection via lib/db.ts
- Initialize tables: POST /api/init-db

### External Dependencies

**AI Integration: Hugging Face or LM Studio**
- Supports two AI backends:
  1. **Hugging Face** (cloud) - Free Mistral-7B-Instruct model
  2. **LM Studio** (local) - Any model you run locally
- API route at `/api/generate` handles AI requests
- LM Studio takes priority if LMSTUDIO_API_URL is set
- Environment variables:
  - `HUGGINGFACE_API_KEY` - For Hugging Face (free at huggingface.co)
  - `LMSTUDIO_API_URL` - LM Studio server URL (e.g., http://your-ip:1234/v1)
  - `LMSTUDIO_MODEL` - Model name in LM Studio (default: local-model)

## Project Structure

```
pages/
  _app.tsx          # App wrapper
  _document.tsx     # Document configuration
  index.tsx         # Home page with all content generation tools
  buy-credits.tsx   # Credit purchasing page with Stripe
  api/
    generate.ts     # AI content generation with credit checking
    init-db.ts      # Database initialization endpoint
    health.ts       # Health check endpoint
    auth/
      register.ts   # User registration
      login.ts      # User login
      me.ts         # Get current user
      logout.ts     # User logout
    stripe/
      create-checkout.ts  # Create Stripe checkout session
      webhook.ts          # Handle Stripe webhooks

lib/
  db.ts             # PostgreSQL connection pool
  users.ts          # Database user functions with bcrypt
  stripeClient.ts   # Stripe API client
  auth.ts           # Auth utilities
  session.ts        # Session management
  translations.ts   # Turkish/English translations

hooks/
  useAuth.ts        # React hook for authentication

schema.sql          # Database schema documentation
```

## Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `SESSION_SECRET` or `JWT_SECRET` - For signing JWT tokens

**For AI (choose one):**
- `HUGGINGFACE_API_KEY` - Hugging Face API token (free at huggingface.co)
- `LMSTUDIO_API_URL` - LM Studio server URL (e.g., https://your-ngrok-url.ngrok.io/v1)
- `LMSTUDIO_MODEL` - Model name in LM Studio (optional, default: local-model)

**For Stripe payments:**
- `STRIPE_SECRET_KEY` - Stripe secret key (sk_live_... or sk_test_...)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (pk_live_... or pk_test_...)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (whsec_...)

**Optional:**
- `SUPER_USER_EMAIL` - Email reserved for the server-provisioned admin. Leave this set so public signup cannot claim it
- `SUPER_USER_PASSWORD` - Used only when init-db first creates that admin (at least 10 characters). Remove it from secrets afterwards
- `QUOTA_IP_SALT` - HMAC salt for anonymous quota keys. Set it explicitly so rotating JWT_SECRET does not reset quotas
- `TRUST_PROXY` - Set to 1 behind one trusted reverse proxy. The free-generation limit then uses the rightmost X-Forwarded-For address
- `ADMIN_SECRET` - Unused. The application does not read this variable. Do not set it, and do not reuse an older value from git history

## Proxy hop check

Replit's Autoscale and Reserved VM docs describe one published external port. TLS ends at Replit, and a geography-specific proxy forwards traffic to the app. Deployments expose `X-Forwarded-For`. Those pages do not publish a hop count, and they do not show a second platform proxy appending its own address. The quota code therefore still trusts exactly one hop.

Verify on the published URL. The editor preview can use a different proxy path:

1. From a known public address, request the app without sending `X-Forwarded-For`.
2. Log the socket remote address and the full `X-Forwarded-For` list for that request, then remove the raw addresses from lasting logs.
3. One entry equal to your public address means the rightmost value is the client.
4. Several entries when you sent none, and your address is not rightmost, means more than one proxy appended. The quota would then be shared across callers.
5. Send `X-Forwarded-For: 203.0.113.50` as well. The rightmost value should remain your public address. If that test value becomes the rightmost entry, `TRUST_PROXY=1` is unsafe.
6. A proxy in front of Replit, such as Cloudflare with the orange cloud on, is an extra hop. Replit's custom-domain setup expects DNS-only records.

Note: On Replit, Stripe credentials are automatically provided via the Stripe connector integration. On Vercel or other platforms, you must set the STRIPE_* environment variables manually.

## Scripts

- `npm run dev` - Start development server on port 5000
- `npm run build` - Build for production
- `npm run start` - Start production server

## Database Setup

1. Add DATABASE_URL secret with Neon PostgreSQL connection string
2. Call POST /api/init-db to create tables
3. Tables created: users, credit_transactions, anonymous_generations. Existing databases gain `users.email_verified`.

## Deployment

**Vercel Deployment:**
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables:
   - DATABASE_URL (required)
   - HUGGINGFACE_API_KEY (required)
   - SESSION_SECRET (required)
   - SUPER_USER_EMAIL (optional)
