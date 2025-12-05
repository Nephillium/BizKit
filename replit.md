# BizKit AI - Client-Winning Content Generator

## Overview

BizKit AI is a SaaS productivity tool designed for freelancers and agencies to rapidly generate professional business content. The application provides four core content generation tools: cold emails, proposals, contracts, and social media packs. Built with a focus on professional efficiency and clarity, the platform leverages AI to help users create client-winning content in seconds.

The application uses a modern full-stack architecture with Next.js, React, TypeScript, and Express, backed by PostgreSQL database storage. The design philosophy emphasizes clean, distraction-free interfaces with progressive disclosure through tab-based navigation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework Choice: Next.js with React**
- Next.js provides server-side rendering capabilities and optimized routing
- React components built with TypeScript for type safety
- Client-side routing managed through wouter library for lightweight navigation
- Vite used as development build tool for faster hot module replacement

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

**Server Framework: Express with Next.js Integration**
- Express.js server integrated with Next.js for API routes
- Custom HTTP server setup allowing full control over middleware
- Development mode uses Vite middleware for client hot reloading
- Production mode serves static Next.js build output

**API Design Pattern**
- RESTful API structure with `/api` prefix convention
- Type-safe request/response handling using TypeScript
- Centralized route registration through `registerRoutes` function
- Storage abstraction layer for database operations

**Build System**
- esbuild for server-side code bundling (production)
- Dependency bundling strategy with allowlist for specific packages
- Reduces cold start times by minimizing file system calls
- Separate client and server build processes

### Data Storage

**Database: PostgreSQL with Drizzle ORM**
- Drizzle ORM chosen for type-safe database operations
- Schema-first approach with TypeScript type inference
- Migration system for database version control
- Zod integration for runtime validation matching database schema

**Data Models**
- User authentication model with username/password
- Schema defined in `shared/schema.ts` for code sharing between client/server
- UUID-based primary keys using PostgreSQL's `gen_random_uuid()`

**Storage Interface Pattern**
- Abstract storage interface (`IStorage`) for flexibility
- In-memory implementation (`MemStorage`) for development/testing
- Designed to swap implementations without changing application code
- CRUD operations abstracted behind consistent API

### External Dependencies

**AI Integration: OpenAI API**
- Content generation powered by GPT-4o-mini model
- API route at `/api/generate` handles AI requests
- Replit AI Integrations service provides OpenAI-compatible access
- Billing through Replit credits rather than direct OpenAI API keys

**UI Component Libraries**
- @radix-ui/* packages for accessible component primitives
- shadcn/ui configuration for pre-built component templates
- lucide-react for consistent iconography
- class-variance-authority for component variant management

**Development Tools**
- Replit-specific plugins for development experience
- Runtime error modal overlay in development
- Development banner for Replit environment
- Cartographer plugin for enhanced debugging

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

**Session Management**
- express-session for server-side session handling
- connect-pg-simple for PostgreSQL session storage (configured but may need setup)
- In-memory session store available as fallback

**Utilities**
- date-fns for date manipulation and formatting
- nanoid for generating unique identifiers
- wouter for client-side routing