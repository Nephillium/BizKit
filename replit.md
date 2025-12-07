# BizKit AI - Client-Winning Content Generator

## Overview

BizKit AI is a SaaS productivity tool designed for freelancers and agencies to rapidly generate professional business content. The application provides four core content generation tools: cold emails, proposals, contracts, and social media packs. Built with a focus on professional efficiency and clarity, the platform leverages AI to help users create client-winning content in seconds.

The application uses a Next.js architecture with React, TypeScript, and **PostgreSQL database** (Neon) for persistent user storage. The design philosophy emphasizes clean, distraction-free interfaces with progressive disclosure through tab-based navigation.

## Recent Changes (Dec 2024)

- **PostgreSQL database integration** - Users stored persistently in Neon PostgreSQL
- **Credits system** - Users start with 0 credits, admins bypass credit checks
- **Stripe payments** - Users can purchase credits via Stripe checkout
- **Credits display** - Shows credits remaining next to username in navbar
- **Buy Credits page** - /buy-credits with three credit packages ($5, $20, $35)
- **Bcrypt password hashing** - Secure password storage with salts
- **JWT-based authentication** - Email/password registration and login
- **Super user support** - Via SUPER_USER_EMAIL env var (any registered user with this email becomes admin)
- **1 free use limit** - Anonymous users get 1 generation, then must register
- **Turkish language support** - Full UI translation with language selector
- **Dual OpenAI support** - Works with Replit AI Integrations or standard OPENAI_API_KEY

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
- Set SUPER_USER_EMAIL env var to an email address
- When a registered user with that email logs in, they get "admin" role
- Admins have unlimited generations (bypass credit checks)

**Usage Limits**
- Anonymous users: 1 free generation (tracked via bizkit_free_used cookie)
- Registered users: Require credits to generate (start with 0)
- Admin users: Unlimited generations

### Data Storage

**PostgreSQL Database (Neon)**
- Users table with credits, role, password_hash
- Credit transactions table for audit trail
- Database connection via lib/db.ts
- Initialize tables: POST /api/init-db

### External Dependencies

**AI Integration: OpenAI API**
- Content generation powered by GPT-4o-mini model
- API route at `/api/generate` handles AI requests
- Supports both Replit AI Integrations and standard OpenAI API key
- Environment variables:
  - AI_INTEGRATIONS_OPENAI_BASE_URL (Replit)
  - AI_INTEGRATIONS_OPENAI_API_KEY (Replit)
  - OPENAI_API_KEY (standard, for Vercel deployment)

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

**For Vercel deployment (required):**
- `STRIPE_SECRET_KEY` - Stripe secret key (sk_live_... or sk_test_...)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (pk_live_... or pk_test_...)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (whsec_...)
- `OPENAI_API_KEY` - Standard OpenAI API key

**Optional:**
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Replit AI Integrations URL (Replit only)
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Replit AI Integrations key (Replit only)
- `SUPER_USER_EMAIL` - Email address for super user/admin access

Note: On Replit, Stripe credentials are automatically provided via the Stripe connector integration. On Vercel or other platforms, you must set the STRIPE_* environment variables manually.

## Scripts

- `npm run dev` - Start development server on port 5000
- `npm run build` - Build for production
- `npm run start` - Start production server

## Database Setup

1. Add DATABASE_URL secret with Neon PostgreSQL connection string
2. Call POST /api/init-db to create tables
3. Tables created: users, credit_transactions

## Deployment

**Vercel Deployment:**
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables:
   - DATABASE_URL (required)
   - OPENAI_API_KEY (required)
   - SESSION_SECRET (required)
   - SUPER_USER_EMAIL (optional)
