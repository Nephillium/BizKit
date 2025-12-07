# BizKit AI - Client-Winning Content Generator

## Overview

BizKit AI is a SaaS productivity tool designed for freelancers and agencies to rapidly generate professional business content. The application provides four core content generation tools: cold emails, proposals, contracts, and social media packs. Built with a focus on professional efficiency and clarity, the platform leverages AI to help users create client-winning content in seconds.

The application uses a pure Next.js architecture with React, TypeScript, and **in-memory user storage** (no database required). The design philosophy emphasizes clean, distraction-free interfaces with progressive disclosure through tab-based navigation.

## Recent Changes (Dec 2024)

- **Removed PostgreSQL/Database dependency** - App now works without any database
- **In-memory user store** - Users stored in memory (resets on server restart)
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

**Authentication System (In-Memory)**
- User registration: POST /api/auth/register
- User login: POST /api/auth/login  
- User info: GET /api/auth/me
- Logout: POST /api/auth/logout

**Super User / Admin**
- Set SUPER_USER_EMAIL env var to an email address
- When a registered user with that email logs in, they get "admin" role
- Admins have unlimited generations

**Usage Limits**
- Anonymous users: 1 free generation (tracked via bizkit_free_used cookie)
- Registered users: Unlimited generations
- Admin users: Unlimited generations

### Data Storage

**In-Memory Storage (No Database)**
- Users stored in Map<email, User>
- Data resets on server restart
- Suitable for early testing and demos

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
    generate.ts     # AI content generation
    health.ts       # Health check endpoint
    auth/
      register.ts   # User registration
      login.ts      # User login
      me.ts         # Get current user
      logout.ts     # User logout

lib/
  auth.ts           # Auth utilities
  session.ts        # Session management
  usersStore.ts     # In-memory user storage with JWT
  translations.ts   # Turkish/English translations

hooks/
  useAuth.ts        # React hook for authentication

shared/
  schema.ts         # Type definitions
```

## Environment Variables

**Required:**
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

## Deployment

**Vercel Deployment:**
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables:
   - OPENAI_API_KEY (required)
   - SESSION_SECRET (required)
   - SUPER_USER_EMAIL (optional)

No DATABASE_URL needed - app works without database.
