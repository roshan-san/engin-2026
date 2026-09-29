---
last_mapped_commit: f0a648da4386d24b5ee96348a96bf0cf757ba15f
last_mapped_at: 2026-09-29
---
# Technology Stack

**Analysis Date:** 2026-09-29

## Languages

**Primary:**
- TypeScript 6.0.3 - Frontend (`src/`) and backend (`convex/`), compiled to ES2022 target
- JavaScript - Runtime execution

**JSX:**
- React 19.2.0 with JSX transform enabled in tsconfig.json

## Runtime

**Environment:**
- Node.js v26.3.0

**Package Manager:**
- pnpm 11.16.0
- Lockfile: `pnpm-lock.yaml` (lockfileVersion 9.0)

## Frameworks

**Core:**
- **Vite** 8.3.0 - SPA frontend build tool with dev server on port 3000
- **React** 19.2.0 - UI library
- **TanStack Router** 1.170.38 - File-based routing with automatic code-splitting (`src/routes/`)
- **Convex** 1.46.0 - Backend platform: database, functions, real-time sync, authentication

**UI & Styling:**
- **Tailwind CSS** 4.3.3 - Utility-first CSS framework
- **shadcn/ui** - Radix-based component library (new-york style, lucide icons)
- **Radix UI** 1.6.7 - Unstyled, accessible component primitives
- **Lucide React** 1.46.0 - Icon library
- **Sonner** 2.0.8 - Toast notification library

**Utilities:**
- **Zod** 4.6.5 - TypeScript-first schema validation
- **class-variance-authority** 0.7.1 - Type-safe CSS class composition
- **tailwind-merge** 3.7.0 - Merge Tailwind classes intelligently
- **clsx** 2.1.1 - Conditional class name utility

**CLI/Interactive:**
- **cmdk** 1.1.1 - Command menu component

**Testing:**
- **Vitest** 5.0.2 - Unit testing framework
- **convex-test** 0.0.60 - In-memory test environment for Convex functions
- **@edge-runtime/vm** 5.0.0 - Edge runtime for testing

**Build/Dev:**
- **@vitejs/plugin-react** 6.1.1 - Vite plugin for React
- **@tailwindcss/vite** 4.3.3 - Tailwind CSS Vite plugin
- **@tanstack/router-plugin** 1.168.40 - TanStack Router Vite plugin for file-based routes
- **@biomejs/biome** 2.5.14 - Linting, formatting, and import organization

## Key Dependencies

**Critical:**
- **@convex-dev/auth** 0.0.95 - Convex authentication framework
- **@auth/core** 0.41.3 - OAuth providers (Google authentication)
- **@dodopayments/convex** 0.2.15 - Billing integration with Convex
- **convex** 1.46.0 - Backend database and functions

**Component Libraries:**
- **@radix-ui/react-avatar** 1.2.6
- **@radix-ui/react-dropdown-menu** 2.1.24
- **@radix-ui/react-label** 2.1.15
- **@radix-ui/react-slot** 1.3.3

**Utilities:**
- **@t3-oss/env-core** 0.13.11 - Environment variable validation
- **@fontsource-variable/geist** 5.3.0 - Geist font (variable)
- **react-icons** 5.7.0 - Icon library

**Type Definitions:**
- **@types/react** 19.2.0
- **@types/react-dom** 19.2.0
- **@types/node** 22.10.2

## Configuration

**Environment:**
- **Client env** (frontend, validated in `src/env/client.ts`):
  - `VITE_CONVEX_URL` - Convex deployment URL (required)
  
- **Server env** (backend, in Convex deployment):
  - `AUTH_GOOGLE_ID` - Google OAuth client ID
  - `AUTH_GOOGLE_SECRET` - Google OAuth client secret
  - `CONVEX_SITE_URL` - Site URL for OAuth callback
  - `DODO_PAYMENTS_API_KEY` - Dodo Payments API key
  - `DODO_PAYMENTS_ENVIRONMENT` - Dodo mode: `test_mode` or `live_mode`
  - `DODO_MONTHLY_PLAN_ID` - Dodo product ID for monthly subscription
  - `DODO_YEARLY_PLAN_ID` - Dodo product ID for yearly subscription

**Build:**
- `vite.config.ts` - Vite config with path aliases (`~/*` → `src/*`, `@convex/*` → `convex/*`)
- `tsconfig.json` - TypeScript config (ES2022 target, strict mode, bundler module resolution)
- `convex/tsconfig.json` - Separate TypeScript config for backend
- `biome.json` - Biome linting and formatting config:
  - Formatter: tab indentation, double quotes
  - Linter: recommended rules enabled
  - Import organization enabled
  - TailwindCSS directive support in CSS

## Platform Requirements

**Development:**
- Node.js v26.3.0+
- pnpm 11.16.0+
- Local Convex deployment available (`convex dev`)

**Production:**
- Convex managed deployment (backend, database)
- Dodo Payments account (if using billing)
- Google OAuth application credentials
- Frontend deployed as static SPA (Vite build output)

---

*Stack analysis: 2026-09-29*
