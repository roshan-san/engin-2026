---
last_mapped_commit: f0a648da4386d24b5ee96348a96bf0cf757ba15f
last_mapped_at: 2026-09-29
---
<!-- refreshed: 2026-09-29 -->

# External Integrations

**Analysis Date:** 2026-09-29

## APIs & External Services

**Authentication:**
- **Google OAuth** - User sign-in via Google
  - SDK/Client: `@auth/core` 0.41.3
  - Implementation: `convex/auth.ts`, `convex/auth.config.ts`
  - Auth env vars: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `CONVEX_SITE_URL`
  - Routes added via `auth.addHttpRoutes(http)` in `convex/http.ts`

**Payment & Billing:**
- **Dodo Payments** - Subscription management (monthly/yearly plans)
  - SDK/Client: `@dodopayments/convex` 0.2.15
  - Implementation: `convex/dodo.ts`
  - Config: `convex/convex.config.ts` (Dodo component registered)
  - API Key: `DODO_PAYMENTS_API_KEY`
  - Environment: `DODO_PAYMENTS_ENVIRONMENT` (test_mode or live_mode)
  - Product IDs: `DODO_MONTHLY_PLAN_ID`, `DODO_YEARLY_PLAN_ID`
  - Billing state stored in `users.planTier` (free | pro)
  - Checkout flow: `convex/dodo.ts` exports `checkout` API

## Data Storage

**Databases:**
- **Convex** (managed backend database)
  - Type: Real-time synced NoSQL document database
  - Client: Convex SDK (`convex` 1.46.0)
  - Schema: `convex/schema.ts` - Defines all tables and validators
  - Connection: Via `VITE_CONVEX_URL` (frontend) and Convex deployment (backend)
  - ORM/Client: Convex query/mutation functions called via `api.*` object from `convex/_generated/api`
  - Tables include: users, startups, memberships, cycles, pulses, trials, roles, offers, notifications, invites, activity
  - Indexes: All queries use `withIndex` pattern defined in `convex/schema.ts`
  - Plan gating via `users.planTier` checked with `isProUser` helper

**File Storage:**
- Local filesystem only - No cloud storage integration detected

**Caching:**
- None - Convex provides real-time syncing; no explicit cache layer

## Authentication & Identity

**Auth Provider:**
- Convex Auth with Google OAuth
  - Framework: `@convex-dev/auth` 0.0.95
  - Provider: Google (`@auth/core/providers/google`)
  - Implementation: `convex/auth.ts` exports `auth`, `signIn`, `signOut`, `store`, `isAuthenticated`
  - Session management: OAuth tokens stored in Convex auth tables
  - Site URL for OAuth callback: `CONVEX_SITE_URL` env var
  - Frontend integration: `ConvexAuthProvider` in `src/features/people/auth/providers/AppProviders.tsx`
  - Multi-user workspace: `users.activeStartupId` tracks current Startup context per user

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- console-based (in functions and frontend)
- Activity logging via `logActivity()` helper in `convex/lib/activity.ts` - events appended to startup activity feed

## CI/CD & Deployment

**Hosting:**
- **Convex** - Backend deployment (functions, database, auth)
- **Vite SPA** - Frontend deployed as static build output (portable to any CDN/static host)

**CI Pipeline:**
- None detected in codebase

## Environment Configuration

**Required env vars:**

*Client-side (frontend, in `src/env/client.ts`):**
- `VITE_CONVEX_URL` - Convex deployment URL (string, must be valid URL)

*Server-side (backend, in Convex deployment env):**
- `AUTH_GOOGLE_ID` - Google OAuth app client ID
- `AUTH_GOOGLE_SECRET` - Google OAuth app client secret
- `CONVEX_SITE_URL` - Site domain for OAuth redirect URI
- `DODO_PAYMENTS_API_KEY` - Dodo Payments API authentication key
- `DODO_PAYMENTS_ENVIRONMENT` - Either "test_mode" or "live_mode"
- `DODO_MONTHLY_PLAN_ID` - Product ID for monthly subscription plan
- `DODO_YEARLY_PLAN_ID` - Product ID for yearly subscription plan

**Secrets location:**
- Environment-specific: Stored in Convex deployment environment (not in `.env` files)
- Set via Convex dashboard or CLI for each deployment (dev, staging, production)

## Webhooks & Callbacks

**Incoming Webhooks:**
- **Dodo Payments** - `POST /dodopayments-webhook` (in `convex/http.ts`)
  - Handler: `createDodoWebhookHandler` from `@dodopayments/convex`
  - Events handled:
    - `onSubscriptionActive` - Sets user `planTier` to "pro"
    - `onSubscriptionRenewed` - Sets user `planTier` to "pro"
    - `onSubscriptionOnHold` - Sets user `planTier` to "free"
    - `onSubscriptionCancelled` - Sets user `planTier` to "free"
    - `onSubscriptionFailed` - Sets user `planTier` to "free"
    - `onSubscriptionExpired` - Sets user `planTier` to "free"
  - Payload parsing: Customer email, metadata (includes `userId` if present)
  - Fallback: Lookup user by email if `userId` not in metadata
  - Action: Mutation call to `internal.people.billing.setPlanTier`

**Outgoing Webhooks:**
- None detected

## OAuth Redirect Flow

**Google OAuth Callback:**
- Configured via `CONVEX_SITE_URL` env var
- Handled by `auth.addHttpRoutes(http)` in `convex/http.ts`
- Routes: `/auth/signin/google`, `/auth/callback/google` (standard Convex Auth routes)

---

*Integration audit: 2026-09-29*
