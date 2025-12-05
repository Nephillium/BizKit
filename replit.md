# BizKit AI

## Overview

BizKit AI is a SaaS application designed for freelancers and agencies to generate client-winning content using AI. The platform provides tools to create cold emails, proposals, contracts, and social media content through a clean, modern interface. Built with a focus on efficiency and professional polish, the application streamlines content generation from input to output with minimal steps.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server, providing fast HMR and optimized production builds
- **Wouter** for lightweight client-side routing
- **TanStack Query v5** for server state management, data fetching, and caching

**UI Component System**
- **shadcn/ui** component library built on Radix UI primitives for accessible, unstyled components
- **Tailwind CSS** for utility-first styling with custom design tokens
- **class-variance-authority** for managing component variants
- Typography: Inter (UI elements) and JetBrains Mono (code/output display)

**Design Approach**
- Reference-based design inspired by Linear, Notion, and Stripe
- Core principles: Clarity first, efficiency, professional polish
- Spacing system based on Tailwind's 4/6/8/12/16/24 units
- Max-width containers (max-w-4xl) with responsive padding

**State Management**
- React hooks for local component state
- TanStack Query for server state and API caching
- Form state managed through react-hook-form with zod validation

### Backend Architecture

**Server Framework**
- **Express.js** running on Node.js with TypeScript
- HTTP server with middleware for JSON parsing, logging, and error handling
- Custom logging system with timestamp formatting for request tracking

**API Design**
- RESTful endpoints under `/api` prefix
- Single POST endpoint `/api/generate` for AI content generation
- Request/response logging middleware for monitoring and debugging
- Error handling with status codes and descriptive messages

**Development vs Production**
- Development: Vite middleware integration for HMR and hot reload
- Production: Static file serving from pre-built `dist/public` directory
- Build script uses esbuild for server bundling with selective dependency bundling to optimize cold start times

### AI Integration

**OpenAI Integration**
- Uses `gpt-4o-mini` model for cost-effective content generation
- Structured prompt engineering for each content type:
  - **Cold Email**: 3 variant generation with subject lines
  - **Proposal**: Multi-section professional proposals
  - **Contract**: Plain-language service agreements
  - **Social Pack**: Multi-platform social media content

**Prompt Architecture**
- Separate system and user prompts for each tool type
- Parameterized inputs (target audience, tone, language, etc.)
- Consistent output formatting across all content types

### Data Storage

**Current Implementation**
- In-memory storage using `MemStorage` class for user data
- No persistent database in current implementation
- User schema defined with Drizzle ORM for future database integration

**Database Schema (Prepared)**
- PostgreSQL dialect configured via Drizzle
- Users table with UUID primary keys, unique usernames, and password fields
- Schema location: `shared/schema.ts` with Zod validation schemas
- Migration directory configured at `./migrations`

**Future Database Integration**
- Drizzle ORM configured for PostgreSQL with connection via `DATABASE_URL`
- `connect-pg-simple` for session storage (when sessions are implemented)
- Schema push command available via `npm run db:push`

### Authentication & Authorization

**Not Currently Implemented**
- User schema exists but authentication is not active
- Passport.js and passport-local dependencies installed for future use
- JWT and session management libraries (express-session, jsonwebtoken) ready for integration

### External Dependencies

**AI Services**
- **OpenAI API** (gpt-4o-mini model) - Primary AI content generation
- Requires `OPENAI_API_KEY` environment variable

**Database** (Configured, Not Active)
- **PostgreSQL** - Configured via Drizzle ORM
- Requires `DATABASE_URL` environment variable when enabled

**UI Component Libraries**
- **Radix UI** - Accessible component primitives (accordion, dialog, dropdown, tabs, etc.)
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

**Form Handling & Validation**
- **react-hook-form** - Form state management
- **zod** - Schema validation
- **@hookform/resolvers** - Integration between react-hook-form and zod

**Development Tools**
- **Replit plugins** - Development banner, cartographer, runtime error overlay
- **TypeScript** - Type safety across frontend and backend
- **ESBuild** - Server bundling for production
- **Vite** - Frontend build tool and dev server

**Utilities**
- **date-fns** - Date manipulation
- **nanoid** - ID generation
- **clsx** & **tailwind-merge** - Conditional class composition