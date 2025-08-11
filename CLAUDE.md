# CLAUDE.md
总是用中文回答用户

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Framework**: Next.js 15.2 with App Router and TypeScript
- **Styling**: Tailwind CSS v4 with Shadcn UI components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth v5 (beta) with Google, GitHub, and Google One Tap providers
- **Payments**: Stripe integration
- **Internationalization**: next-intl with support for multiple locales
- **State Management**: React Context API
- **AI SDKs**: OpenAI, DeepSeek, Replicate, and custom Kling provider
- **Deployment**: Vercel and Cloudflare Pages support

## Development Commands

```bash
# Install dependencies (using pnpm)
pnpm install

# Start development server with Turbopack
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Bundle analysis
pnpm analyze

# Cloudflare deployment
pnpm cf:build      # Build for Cloudflare
pnpm cf:preview    # Preview Cloudflare build locally
pnpm cf:deploy     # Deploy to Cloudflare Pages

# Docker
pnpm docker:build  # Build Docker image

# Generate template previews
pnpm generate-previews      # Generate all previews
pnpm generate-previews:dry  # Dry run without generating
```

## Project Architecture

### Directory Structure

- **`app/`**: Next.js App Router pages and API routes
  - `[locale]/`: Internationalized pages with locale-specific routing
  - `(admin)/`: Admin dashboard pages with user management
  - `(default)/`: Main application pages (generate, pricing, showcase)
  - `(legal)/`: Legal pages (privacy, terms, etc.) using MDX
  - `api/`: REST API endpoints for auth, payments, and features

- **`components/`**: React components organized by purpose
  - `blocks/`: Reusable layout blocks (header, footer, hero, pricing, etc.)
  - `ui/`: Shadcn UI components library
  - `console/` & `dashboard/`: Admin and user dashboard components

- **`models/`**: Database models and operations (Supabase integration)
  - Direct database operations for users, orders, credits, posts, etc.

- **`services/`**: Business logic layer
  - Handles complex operations and coordinates between models

- **`i18n/`**: Internationalization configuration
  - `messages/`: Global translation files (en.json, zh.json)
  - `pages/`: Page-specific translations

- **`auth/`**: NextAuth configuration and session management

- **`aisdk/`**: Custom AI SDK implementations
  - Kling provider for video/image generation
  - Provider abstractions and utilities

- **`types/`**: TypeScript type definitions
  - Organized by feature area (blocks, pages, slots)

### Key Patterns

1. **Authentication Flow**: NextAuth with multiple providers, session stored in JWT
2. **Database Access**: Supabase client with service role key for server-side operations
3. **Internationalization**: URL-based locale routing (`/[locale]/...`)
4. **Payment Integration**: Stripe with webhook handling
5. **Admin System**: Role-based access with dedicated admin routes
6. **AI Features**: Template-based pet art generation with credit system

## Environment Configuration

Key environment variables to configure:

- **Database**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Auth**: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`
- **Payments**: `STRIPE_PUBLIC_KEY`, `STRIPE_PRIVATE_KEY`
- **Storage**: AWS S3-compatible storage configuration
- **Analytics**: Google Analytics, OpenPanel, or Plausible

## Important Implementation Notes

- The project uses a credit-based system for AI features
- Pet art generation templates are predefined in `public/templates/`
- Admin emails are configured via `ADMIN_EMAILS` environment variable
- The application supports both light and dark themes
- MDX is configured for legal and documentation pages
- Cloudflare deployment requires the `wrangler.toml` configuration