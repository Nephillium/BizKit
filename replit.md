# BizKit AI - Client-Winning Content Generator

## Overview

BizKit AI is a SaaS productivity tool designed for freelancers and agencies to rapidly generate professional business content. The application provides four core content generation tools: cold emails, proposals, contracts, and social media packs. Built with a focus on professional efficiency and clarity, the platform leverages AI to help users create client-winning content in seconds.

The application uses a pure Next.js architecture with React, TypeScript, and PostgreSQL database storage. The design philosophy emphasizes clean, distraction-free interfaces with progressive disclosure through tab-based navigation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework Choice: Next.js with React**
- Next.js provides server-side rendering capabilities and optimized routing
- React components built with TypeScript for type safety
- Next.js Pages Router for file-based routing
- Standard Next.js development server

**UI Component System: shadcn/ui with Radix UI**
- Component library built on Radix UI primitives for accessibility
- Tailwind CSS for utility-first styling with custom design tokens
- "New York" style variant selected for professional aesthetic
- Comprehensive component set including forms, dialogs, tabs, and tooltips

**Design System Implementation**
- Custom CSS variables for theming (light/dark mode support)
- Typography system using Inter font for interface and JetBrains Mono for code
- Spacing primitives following Tailwind's 4px base scale
- Consistent border radius system (9px/6px/3px)
- Professional color palette with HSL-based color tokens

**State Management**
- TanStack Query (React Query) for server state management
- React hooks for local component state
- Form state managed through React Hook Form with Zod validation

### Backend Architecture

**API Routes: Next.js API Routes**
- RESTful API structure with `/api` prefix convention
- Type-safe request/response handling using TypeScript
- API routes located in `pages/api/` directory
- Storage abstraction layer for database operations

**Build System**
- Standard Next.js build process
- `next build` for production builds
- `next dev` for development server
- Deployable to Vercel without custom configuration

### Data Storage

**Database: PostgreSQL with Drizzle ORM**
- Drizzle ORM chosen for type-safe database operations
- Schema-first approach with TypeScript type inference
- Schema defined in `shared/schema.ts` for code sharing
- UUID-based primary keys for users

**Data Models**
- User model with Replit Auth integration
- Generation model for storing AI-generated content
- Schema defined in `shared/schema.ts`

**Storage Interface Pattern**
- Abstract storage interface (`IStorage`) for flexibility
- PostgreSQL implementation (`DatabaseStorage`)
- CRUD operations abstracted behind consistent API

### Authentication

**Replit Auth with OIDC**
- OpenID Connect integration with Replit
- Cookie-based session management
- API routes: `/api/login`, `/api/callback`, `/api/logout`
- User data stored in PostgreSQL

### External Dependencies

**AI Integration: OpenAI API**
- Content generation powered by GPT-4o-mini model
- API route at `/api/generate` handles AI requests
- Replit AI Integrations service provides OpenAI-compatible access
- Environment variables: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`

**UI Component Libraries**
- @radix-ui/* packages for accessible component primitives
- shadcn/ui configuration for pre-built component templates
- lucide-react for consistent iconography
- class-variance-authority for component variant management

**Form Handling & Validation**
- React Hook Form for performant form state management
- @hookform/resolvers for Zod schema integration
- Zod for runtime type validation and schema definition
- drizzle-zod for seamless database-to-validation schema conversion

**Styling & CSS**
- Tailwind CSS for utility-first styling approach
- PostCSS with autoprefixer for browser compatibility
- Custom CSS properties for dynamic theming
- clsx and tailwind-merge (via cn utility) for conditional classes

## Project Structure

```
pages/
  _app.tsx          # App wrapper
  _document.tsx     # Document configuration
  index.tsx         # Home page
  api/
    generate.ts     # AI content generation
    login.ts        # Replit Auth login
    callback.ts     # Auth callback
    logout.ts       # Auth logout
    health.ts       # Health check endpoint
    auth/
      user.ts       # Get current user
    generations/
      index.ts      # List/create generations
      [id].ts       # Delete generation

lib/
  auth.ts           # Auth utilities
  session.ts        # Session management

server/
  storage.ts        # Database storage interface
  db.ts             # Database connection
  replitAuth.ts     # Legacy auth (to be removed)

shared/
  schema.ts         # Database schema

components/
  ui/               # shadcn/ui components
```

## Scripts

- `npm run dev` - Start development server on port 5000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
