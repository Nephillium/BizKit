# BizKit AI - Client-Winning Content Generator

## Overview

BizKit AI is a SaaS productivity tool designed for freelancers and agencies to rapidly generate professional business content. The application provides four core content generation tools: cold emails, proposals, contracts, and social media packs. Built with a focus on professional efficiency and clarity, the platform leverages AI to help users create client-winning content in seconds.

The application uses a pure Next.js architecture with React, TypeScript, and **PostgreSQL** for persistent user data and credits. The design philosophy emphasizes clean, distraction-free interfaces with progressive disclosure through tab-based navigation.

## Recent Changes (Dec 2024)

- **Migrated to PostgreSQL** - Real database with persistent user data and credits
- **Credits system** - Users have a credits field; each generation costs 1 credit
- **Credit transactions table** - Audit trail for all credit changes
- **JWT-based authentication** - Email/password registration and login with PostgreSQL backend
- **Super user support** - Via SUPER_USER_EMAIL env var (any registered user with this email becomes admin)
- **Admin unlimited access** - Admins bypass credit checks
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
- useAuth hook for authentication state (includes credits)

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

**Authentication System (PostgreSQL)**
- User registration: POST /api/auth/register
- User login: POST /api/auth/login  
- User info: GET /api/auth/me (includes credits)
- Logout: POST /api/auth/logout

**Super User / Admin**
- Set SUPER_USER_EMAIL env var to an email address
- When a registered user with that email logs in, they get "admin" role
- Admins have unlimited generations (bypass credit check)

**Usage Limits**
- Anonymous users: 1 free generation (tracked via bizkit_free_used cookie)
- Registered users: Credit-based (1 credit = 1 generation)
- Admin users: Unlimited generations

### Data Storage

**PostgreSQL Database**
- Users table with credits field
- Credit transactions table for audit trail
- Connection via DATABASE_URL environment variable
- See schema.sql for full table definitions

**Database Schema:**
```sql
-- Users table
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  credits INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Credit transactions table
CREATE TABLE credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

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
  api/
    generate.ts     # AI content generation (checks credits)
    health.ts       # Health check endpoint
    auth/
      register.ts   # User registration (PostgreSQL)
      login.ts      # User login (PostgreSQL)
      me.ts         # Get current user with credits
      logout.ts     # User logout

lib/
  db.ts             # PostgreSQL connection pool
  users.ts          # Database user functions with credits
  translations.ts   # Turkish/English translations

hooks/
  useAuth.ts        # React hook for authentication (includes credits)

schema.sql          # Database migration SQL
```

## Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` or `JWT_SECRET` - For signing JWT tokens

**Optional:**
- `OPENAI_API_KEY` - Standard OpenAI API key (for Vercel)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Replit AI Integrations URL
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Replit AI Integrations key
- `SUPER_USER_EMAIL` - Email address for super user/admin access

## Scripts

- `npm run dev` - Start development server on port 5000
- `npm run build` - Build for production
- `npm run start` - Start production server

## How /api/generate Works

1. Checks for valid JWT token
2. If no token (anonymous):
   - Checks bizkit_free_used cookie
   - If not used: allows generation, sets cookie
   - If used: returns error, requires login
3. If valid token (logged in):
   - Fetches user from database
   - If admin: allows unlimited generations
   - If regular user: checks credits
     - If credits <= 0: returns no_credits error
     - If credits > 0: decrements credit, proceeds with generation
4. Calls OpenAI API and returns content

## Adding Credits

To add credits to a user, use the addCredits function:
```typescript
import { addCredits } from './lib/users';
await addCredits(userId, 10, 'purchased_pack_10');
```

This creates a transaction record and updates the user's credit balance atomically.

## Deployment

**Vercel Deployment:**
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables:
   - DATABASE_URL (required - use Neon, Supabase, or similar)
   - OPENAI_API_KEY (required)
   - SESSION_SECRET (required)
   - SUPER_USER_EMAIL (optional)
