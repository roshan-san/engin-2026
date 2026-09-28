---
last_mapped_commit: 63da4c34dd0df46fd780733eaefce3afb95f98e3
last_mapped_at: 2026-09-28
---
# External Integrations

**Analysis Date:** 2026-09-28

## APIs & External Services

**Authentication:**
- Google Sign-In
  - SDK: @auth/core with Google provider
  - Env vars: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
  - Entry point: `convex/auth.ts`
  - Frontend flow: `src/features/people/auth/hooks/useGoogleSignIn.ts`
  - UI: `src/features/people/auth/ui/GoogleButton.tsx`

## Data Storage

**Databases:**
- Convex (primary)
  - Connection: HTTP via `convex` client from `convex/` SDK
  - Type-safe access: `ctx.db` in backend, `useQuery`/`useMutation` in frontend
  - Schema: `convex/schema.ts`
  - Client: `src/lib/convex.ts` (ConvexReactClient instantiated with `VITE_CONVEX_URL`)
  - Tables: users, startups, memberships, follows, invites, notifications, pulses, cycles, cycleMembers, roles, trialCycles, challenges, applications, offers, trialMessages, activity
  - Indexes: Defined in `convex/schema.ts` via `withIndex()` pattern

**File Storage:**
- Not detected (no cloud storage SDK; attachments not in feature scope)

**Caching:**
- Not detected (Convex client handles real-time sync internally)

## Authentication & Identity

**Auth Provider:**
- Convex Auth (@convex-dev/auth)
  - Implementation: OAuth flow with Google as sole provider
  - Configuration: `convex/auth.config.ts` (domain-based), `convex/auth.ts` (Google provider setup)
  - Session management: Convex stores auth tables via `@convex-dev/auth/server` (see `authTables` in `convex/schema.ts`)
  - User identity read: `getAuthUserId(ctx)` in actions, `requireUserId(ctx)` in mutations
  - Protected routes: `useConvexAuth()` hook in frontend (checked in `src/features/app/layout/AppLayout`)

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, Rollbar, or similar service)

**Logs:**
- Console logs only (browser console for frontend, server logs for Convex)
- No external logging service detected

## CI/CD & Deployment

**Hosting:**
- Convex (backend) - serverless Node.js runtime for `convex/` functions
  - Deployments via Convex CLI (`convex deploy`)
  - Dev environment: `convex dev` (local sync)
- Static hosting for frontend (deployment not configured in codebase; assumed external)

**CI Pipeline:**
- Not detected in codebase (no GitHub Actions, Vercel config, or similar)
- `pnpm check` is the local quality gate (lint + format + typecheck)

## Environment Configuration

**Required env vars:**

**Client-side (frontend):**
- `VITE_CONVEX_URL` - Convex deployment URL (validated in `src/env/client.ts`)

**Server-side (backend via Convex deployment):**
- `DODO_PAYMENTS_API_KEY` - Dodo Payments API authentication
- `DODO_PAYMENTS_ENVIRONMENT` - `test_mode` or `live_mode` for payment processing
- `DODO_MONTHLY_PLAN_ID` - Product/plan ID for monthly billing cycle
- `DODO_YEARLY_PLAN_ID` - Product/plan ID for yearly billing cycle
- `AUTH_GOOGLE_ID` - Google OAuth application ID
- `AUTH_GOOGLE_SECRET` - Google OAuth application secret
- `CONVEX_SITE_URL` - Base URL for auth configuration (domain for OAuth callbacks)

**Secrets location:**
- Client: `.env` (VITE_* prefix) and `.env.local` (locally for development)
- Server: Convex deployment environment (set via Convex dashboard or CLI)

## Webhooks & Callbacks

**Incoming:**
- `/dodopayments-webhook` (POST)
  - Handler: `convex/http.ts` via `createDodoWebhookHandler`
  - Events handled:
    - `onSubscriptionActive` - Sets user `planTier` to `pro`
    - `onSubscriptionRenewed` - Sets user `planTier` to `pro`
    - `onSubscriptionOnHold` - Sets user `planTier` to `free`
    - `onSubscriptionCancelled` - Sets user `planTier` to `free`
    - `onSubscriptionFailed` - Sets user `planTier` to `free`
    - `onSubscriptionExpired` - Sets user `planTier` to `free`
  - User lookup: Via email from webhook payload, or via `userId` in metadata
  - Internal function: `internal.people.billing.setPlanTier` called to update user tier

**Outgoing:**
- None detected (no webhooks sent to external services)
- Notifications are stored internally in `notifications` table

## Real-Time Features

**Convex-native:**
- Live queries via `useQuery` hook
- Subscription updates pushed by Convex client
- Optimistic updates via `useMutation`

## Payment Processing

**Dodo Payments:**
- Library: @dodopayments/convex 0.2.15
- Integration: Component loaded in `convex/convex.config.ts`
- Checkout flow:
  - Frontend calls `api.people.billing.createCheckoutLink` action
  - Convex action (`convex/people/billing.ts`) creates a checkout session via `checkout()` from `convex/dodo.ts`
  - Returns `checkoutUrl` for redirect to payment gateway
  - Session metadata includes `userId` and billing `interval` (monthly/yearly)
- Billing models: Monthly and yearly subscriptions
  - Product IDs from `DODO_MONTHLY_PLAN_ID` and `DODO_YEARLY_PLAN_ID` env vars
  - Plan tier stored in `users.planTier` (free | pro)
- Access control: `isProUser(ctx, userId)` checks `planTier === "pro"` in `convex/lib/auth.ts`
- Webhook handling: Updates plan tier on subscription state changes

---

*Integration audit: 2026-09-28*
