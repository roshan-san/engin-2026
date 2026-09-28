---
last_mapped_commit: 63da4c34dd0df46fd780733eaefce3afb95f98e3
last_mapped_at: 2026-09-28
---
# Technology Stack

**Analysis Date:** 2026-09-28

## Languages

**Primary:**
- TypeScript 6.0.3 - Frontend (React + TanStack Router) and backend (Convex functions)
- CSS - Tailwind v4 for styling

**Secondary:**
- JavaScript - JSON config files, module syntax

## Runtime

**Environment:**
- Node.js (no explicit pinned version; use your system default)

**Package Manager:**
- pnpm (workspace-enabled monorepo support)
- Lockfile: `pnpm-lock.yaml` (present)

## Frameworks

**Core Frontend:**
- React 19.2.0 - UI library
- TanStack Router 1.170.38 - File-based client-side routing with auto code-splitting (`@tanstack/react-router`, `@tanstack/router-plugin`)
- Vite 8.3.0 - Build tool and dev server

**Core Backend:**
- Convex 1.46.0 - Backend-as-a-service (DB, functions, auth, scheduling)
  - TypeScript functions in `convex/` directory
  - Functions exposed as `api.<domain>.<file>.<fn>`
  - Generates `convex/_generated/api` with client types

**Authentication:**
- @convex-dev/auth 0.0.95 - Convex auth wrapper
- @auth/core 0.41.3 - Auth.js/NextAuth core (Google provider)

**Styling:**
- Tailwind CSS 4.3.3 - Utility-first CSS framework
- @tailwindcss/vite 4.3.3 - Vite plugin for Tailwind

**UI Components:**
- shadcn/ui (new-york style) - Headless Radix + Tailwind component library
  - Installed via `pnpm ui <component>`
  - Configured in `components.json`
- Radix UI primitives:
  - @radix-ui/react-avatar 1.2.6
  - @radix-ui/react-dropdown-menu 2.1.24
  - @radix-ui/react-label 2.1.15
  - @radix-ui/react-slot 1.3.3
- lucide-react 1.46.0 - Icon library
- react-icons 5.7.0 - Additional icons
- sonner 2.0.8 - Toast notifications

**Data Validation:**
- zod 4.6.5 - Schema validation (TypeScript-first)

**Development Tools:**
- Biome 2.5.14 - Linting, formatting, and code organization
  - Config: `biome.json` (tabs, double quotes, recommended rules)
- @vitejs/plugin-react 6.1.1 - Vite React plugin
- TypeScript compiler - For type-checking only (`tsc --noEmit`)

**Testing:**
- Vitest 5.0.2 - Unit/integration test runner
- @edge-runtime/vm 5.0.0 - Edge runtime for test environment
- convex-test 0.0.60 - In-memory Convex database for tests (edge-runtime)

**Utilities:**
- class-variance-authority 0.7.1 - Type-safe Tailwind class composition
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.7.0 - Smart Tailwind class merging
- @t3-oss/env-core 0.13.11 - Type-safe environment variable validation

## Key Dependencies

**Critical:**
- Convex 1.46.0 - Entire backend: DB, auth, real-time, functions, scheduling, webhooks
- React 19.2.0 - Frontend UI rendering
- TanStack Router 1.170.38 - Application navigation and code-splitting

**Payments & Billing:**
- @dodopayments/convex 0.2.15 - Payment processing (Dodo Payments integration)
  - Configured in `convex/convex.config.ts`
  - Webhook handler at `/dodopayments-webhook`

**Infrastructure & API:**
- ConvexReactClient - Connects frontend to Convex backend over HTTP
  - Instantiated in `src/lib/convex.ts`
  - Types consumed from `@convex/*` path alias

## Configuration

**Environment (Client):**
- Validated in `src/env/client.ts` using `@t3-oss/env-core`
- Required: `VITE_CONVEX_URL` - Convex deployment URL

**Environment (Server/Backend):**
- Convex deployment environment variables read via `process.env` in `convex/*.ts`
- Critical vars:
  - `DODO_PAYMENTS_API_KEY` - Dodo Payments API authentication
  - `DODO_PAYMENTS_ENVIRONMENT` - `test_mode` or `live_mode`
  - `DODO_MONTHLY_PLAN_ID` - Product ID for monthly billing
  - `DODO_YEARLY_PLAN_ID` - Product ID for yearly billing
  - `AUTH_GOOGLE_ID` - Google OAuth app ID
  - `AUTH_GOOGLE_SECRET` - Google OAuth app secret
  - `CONVEX_SITE_URL` - For auth configuration

**Build Configuration:**
- `vite.config.ts` - Vite build config with Tailwind and TanStack Router plugins
- `tsconfig.json` - Frontend TypeScript config (excludes `convex/`)
- `convex/tsconfig.json` - Backend TypeScript config (separate, no JSX)
- `biome.json` - Linter and formatter config (tabs, double quotes, recommended rules)
- `components.json` - shadcn/ui configuration (new-york, zinc base color, lucide icons)
- `vitest.config.ts` - Test runner config (edge-runtime environment)
- `.npmrc` - pnpm configuration (likely in `pnpm-workspace.yaml`)

## Build & Development

**Development:**
- `pnpm dev` - Starts Vite dev server on port 3000 (frontend)
- `pnpm dev:backend` - Runs `convex dev` in parallel to sync backend functions and regenerate types
  - Pushes schema and functions to Convex dev deployment
  - Regenerates `convex/_generated/`
- `pnpm check-types` - TypeScript strict mode check on `src/` only (convex has separate tsconfig)
- `pnpm lint` and `pnpm format` - Biome with `--write` flag

**Build:**
- `pnpm build` - Vite production build (bundles React + Router)
- `pnpm preview` - Preview built output

**Testing:**
- `pnpm test` - Run vitest for `convex/**/*.test.ts` in edge-runtime
- Tests use convex-test for in-memory database (no deployment needed)

**Code Quality:**
- `pnpm check` - Runs lint + format + tsc in sequence

## Platform Requirements

**Development:**
- Node.js (any recent version recommended; pnpm handle version compatibility)
- pnpm (v9 or later recommended)
- Git (for version control)

**Production:**
- Deployment: Convex (backend), Static hosting (frontend)
  - Convex handles backend scaling, real-time sync, and webhooks
  - Frontend: Any static host (Vercel, Netlify, S3 + CloudFront, etc.)
- Runtime: Browser (frontend), Node.js runtime in Convex (backend)

---

*Stack analysis: 2026-09-28*
