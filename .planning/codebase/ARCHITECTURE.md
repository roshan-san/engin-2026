---
last_mapped_commit: f0a648da4386d24b5ee96348a96bf0cf757ba15f
last_mapped_at: 2026-09-29
---
<!-- refreshed: 2026-09-29 -->

# Architecture

**Analysis Date:** 2026-09-29

## System Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Browser / SPA (React 19)                      │
│            Routes + Features (TanStack Router)                   │
│  `src/routes/`, `src/features/<domain>/<feature>/`              │
├──────────────────┬──────────────────┬──────────────────┬────────┤
│  Teams Domain    │  Hiring Domain   │  Work Domain     │ People │
│  `src/features/` │  `src/features/` │  `src/features/` │ Domain │
└────────┬─────────┴────────┬─────────┴────────┬────────┴────────┘
         │                  │                   │
         ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│        Convex Backend API Layer                                  │
│        `convex/{people,teams,hiring,work}/*.ts`                 │
│  - Query/Mutation functions with authorization                  │
│  - Time-based scheduling (ctx.scheduler)                        │
├─────────────────────────────────────────────────────────────────┤
│  Shared Server Logic (`convex/lib/`)                            │
│  - Auth (lib/auth.ts)                                           │
│  - Membership (lib/teams/membership.ts)                         │
│  - Cycle Access (lib/work/cycles.ts)                            │
│  - Pulse Operations (lib/work/pulses.ts)                        │
│  - Trial Cycles (lib/hiring/trialCycles.ts)                     │
│  - Notifications (lib/notify.ts)                                │
│  - Activity Logging (lib/activity.ts)                           │
│  - Score Calculation (lib/reputation/score.ts)                  │
├─────────────────────────────────────────────────────────────────┤
│  Framework / Infrastructure                                      │
│  - `convex/schema.ts` - Datamodel & validators                  │
│  - `convex/http.ts` - HTTP routes, webhooks                     │
│  - `convex/auth.ts` - Convex Auth setup                         │
│  - `convex/dodo.ts` - Billing provider config                   │
│  - `convex/notifications.ts` - Notification API                 │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Convex Database                                     │
│  Tables: users, startups, memberships, pulses, cycles,          │
│          trialCycles, roles, offers, applications, ...          │
└─────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Routes** | URL → component mapping, params extraction | `src/routes/**/*.tsx` |
| **Pages** | Page-level UI layout and composition | `src/features/<domain>/<feature>/ui/` |
| **Components** | Reusable UI primitives and domain widgets | `src/components/`, `src/features/<domain>/<feature>/components/` |
| **Hooks** | Data fetching, mutations, business logic | `src/features/<domain>/<feature>/hooks/` |
| **Shell** | Top-level layout, sidebar, account menu | `src/shell/` |
| **Public Functions** | Query/Mutation endpoints exposed to frontend | `convex/{people,teams,hiring,work}/*.ts` |
| **Lib (Backend)** | Shared authorization, data access, side effects | `convex/lib/` |
| **Schema** | Database tables, types, validators | `convex/schema.ts` |

## Pattern Overview

**Overall:** Domain-Driven Design with layered backend and feature-scoped frontend.

**Key Characteristics:**
- **Multi-domain organization**: People (auth, profiles, reputation), Teams (startups, invites, members), Hiring (roles, trials, applications, offers), Work (cycles, pulses, boards)
- **Authorization at every layer**: Every query/mutation validates user, then checks context-specific access (membership, cycle access, pulse ownership)
- **Thin routes, thick hooks**: Route files delegate to feature components; hooks encapsulate query/mutation logic
- **Convex as complete backend**: Database, auth, functions, scheduling, and webhooks all through Convex
- **Multi-startup workspace**: Users switch between startups via `users.activeStartupId`

## Layers

**Frontend Routes (`src/routes/`):**
- Purpose: Map URLs to page components, extract and validate URL parameters
- Location: `src/routes/` (file-based routing via TanStack Router plugin)
- Contains: Route definitions that `createFileRoute` and render feature pages
- Depends on: `src/features/` for page components
- Used by: Browser navigation

**Frontend Features (`src/features/`):**
- Purpose: Domain-specific UI, logic, and data fetching
- Location: `src/features/<domain>/<feature>/` (mirrors backend domain structure)
- Contains: `ui/` (pages), `components/`, `hooks/` (thin wrappers over `useQuery`/`useMutation`), `schemas/` (zod), `constants.ts`
- Depends on: `convex/_generated/api` for backend functions, `lib/` for helpers
- Used by: Routes

**Frontend Shell (`src/shell/`):**
- Purpose: App-wide UI chrome, navigation, and user context
- Location: `src/shell/`
- Contains: `layout/` (AppShell, AuthLayouts), `sidebar/`, `account/`, `command/` (command palette), `startup/` (workspace switching)
- Depends on: Hooks to read current user, focused startup, notifications
- Used by: Root route and authenticated layout

**Frontend Lib (`src/lib/`):**
- Purpose: Cross-domain utilities (dates, validation, initials, username formatting, Convex client setup)
- Location: `src/lib/`
- Depends on: Nothing in src/
- Used by: All features and components

**Frontend Components (`src/components/`):**
- Purpose: Shared UI primitives
- Location: `src/components/ui/` (shadcn), `src/components/shared/` (domain components), `src/components/globals/` (router-level screens)
- Depends on: Tailwind, Radix UI
- Used by: Features and pages

**Backend Queries & Mutations (`convex/{people,teams,hiring,work}/`):**
- Purpose: Public API surface for frontend
- Location: `convex/<domain>/<file>.ts` (e.g., `convex/teams/startups.ts`, `convex/work/pulses.ts`)
- Contains: Named exports for `query()` and `mutation()` handlers
- Depends on: `convex/lib/` for authorization and logic
- Called by: Frontend hooks via `useQuery()` and `useMutation()`

**Backend Lib (`convex/lib/`):**
- Purpose: Shared authorization, data access patterns, side effects
- Location: `convex/lib/`
- Contains: Domain-specific (`lib/teams/`, `lib/hiring/`, `lib/work/`, `lib/people/`, `lib/reputation/`) and cross-cutting (`auth.ts`, `notify.ts`, `activity.ts`, `limits.ts`, `text.ts`)
- Key files:
  - `lib/auth.ts`: `requireUserId()`, `isProUser()`, profile initialization
  - `lib/teams/membership.ts`: `requireMembership()`, `requireFounderMembership()`, `getMembership()`
  - `lib/work/cycles.ts`: `requireCycleAccess()`, cycle loading
  - `lib/work/pulses.ts`: `requirePulse()`, `requireSubmittedPulse()`, `requireWorkablePulse()`, pulse transformation
  - `lib/hiring/trialCycles.ts`: `requireTrialAccess()`, trial loading and transitions
  - `lib/notify.ts`: `notify()`, `notifyFounders()` (side effect)
  - `lib/activity.ts`: `logActivity()` (side effect)
  - `lib/reputation/score.ts`: `refreshUserScore()` (recomputes reputation)
- Depends on: `convex/schema.ts`, Convex runtime
- Used by: Public function handlers

**Backend Schema & Config (`convex/`):**
- Purpose: Database schema, types, validators, HTTP routes, auth config
- Location: `convex/schema.ts`, `convex/http.ts`, `convex/auth.ts`, `convex/auth.config.ts`, `convex/convex.config.ts`, `convex/dodo.ts`, `convex/migrations.ts`, `convex/notifications.ts`
- Key exports:
  - `schema.ts`: `defineTable()` for all tables, validators for enums (planTier, memberRole, notificationKind, pulseStatus, etc.)
  - `http.ts`: HTTP routes for auth (via Convex Auth) and Dodo Payments webhook handler
  - `dodo.ts`: Billing component configuration for Convex integration
  - `notifications.ts`: Public query `listNotifications`, `markAsRead`, etc.

## Data Flow

### Primary Request Path (Startup Workspace)

1. User navigates to `/s/$slug` (authenticated route) → `src/routes/_shell/_authed/s/$slug/route.tsx`
2. Route calls `useWorkspace(slug)` hook
3. Hook calls `api.teams.startups.getWorkspace({ slug })` (query) → `convex/teams/startups.ts`
4. Backend:
   - `getWorkspace()` calls `requireUserId(ctx)` → checks `users` table via auth token
   - Calls `getMembership()` → looks up `memberships` table with `withIndex("by_startup_and_user")`
   - Loads startup from `startups` table, sets `users.activeStartupId` if first access
   - Returns startup + membership + plan info
5. Frontend receives workspace data, renders `AppShell` with startup context
6. Child routes render feature pages (cycles, pulses, hiring, etc.)

### Pulse Creation (Work Domain)

1. User fills form on Cycle page → `src/features/work/cycles/pages/CyclePage.tsx`
2. Page calls `useMutatePulse()` hook with pulse data and cycleId
3. Hook calls `api.work.pulses.create(pulseData)` (mutation) → `convex/work/pulses.ts`
4. Backend:
   - `create()` calls `requireUserId(ctx)` → gets current user
   - Calls `requireCycleAccess(ctx, cycleId, userId)` → checks membership + cycle membership
   - Validates pulse fields (title, assignee, etc.)
   - Inserts into `pulses` table with `cycleId`, `createdByUserId`, status `todo`
   - Calls `logActivity()` to append event to `activity` table
   - Returns created pulse
5. Frontend receives pulse, updates local cache, renders on board

### Trial Cycle Verdict & Offer (Hiring Domain)

1. Founder navigates to trial → `src/routes/.../trials/$trialCycleId.tsx`
2. Component renders trial participants + their work
3. Founder submits verdict for participant → calls `api.hiring.verdicts.submit()`
4. Backend:
   - `submit()` validates access via `requireTrialAccess()` (founder check)
   - Creates entry in `applications` table with verdict (passed/not_passed/passed_with_offer)
   - If `passed_with_offer`, creates entry in `offers` table
   - Calls `notifyFounders()` to notify team of verdict
   - Calls `refreshUserScore()` to update participant's reputation if passed
   - Runs time-based scheduler to close trial at `endsAt` time
5. Frontend receives notification, updates offers list

### State Management

- **Current user**: Via `useCurrentUser()` hook → `api.people.users.getCurrent()` (caches auth state)
- **Current workspace**: Via `useWorkspace()` hook → stored in URL `$slug` + `users.activeStartupId`, loaded via `api.teams.startups.getWorkspace()`
- **Notifications**: Via `useNotifications()` hook → `api.notifications.list()`, marks read via `api.notifications.markAsRead()`
- **Plans & limits**: Via `isProUser()` check + constants in `lib/limits.ts`
- **Active cycle**: Via `useActiveCycle()` hook → queries `cycles` table filtered by status `active`

## Key Abstractions

**Pulse (Work Unit):**
- Purpose: Represents a unit of work on a kanban board (Cycle Pulse) or trial challenge board (Trial Board Pulse)
- Examples: `convex/lib/work/pulses.ts`, `src/features/work/pulses/`
- Pattern: Single table `pulses` with foreign keys to either `cycleId` or `trialCycleId`, plus participant ownership for trial pulses. Validators constrain status transitions and visibility rules. `requirePulse()` / `requireSubmittedPulse()` / `requireWorkablePulse()` gates access

**Membership (Access Control):**
- Purpose: Ties a user to a startup with a role (founder or member)
- Examples: `convex/lib/teams/membership.ts`, `convex/schema.ts` (memberships table)
- Pattern: Denormalized in `memberships` table with index on (startupId, userId) for quick lookups. Every scope check starts with membership validation. Founders implicitly belong to all cycles and trials in their startup

**Trial Cycle (Hiring Flow):**
- Purpose: Time-bounded evaluation of participants for a role, producing verdicts and offers
- Examples: `convex/hiring/trialCycles.ts`, `convex/lib/hiring/trialCycles.ts`, `src/features/hiring/trialCycles/`
- Pattern: `trialCycles` table with foreign key to `roles`. Time transitions (open → active → closed → cancelled) use `ctx.scheduler`. `applications` table links users to trials. `offers` table linked to successful applications. Messages in `trialMessages` table, optionally participant-scoped. Challenges (trial pulse templates) in `challenges` table, copied to participant boards on entry

**Score (Reputation):**
- Purpose: Denormalized user reputation derived from trial cycle verdicts
- Examples: `convex/lib/reputation/score.ts`, `convex/lib/reputation/scoreWeights.ts`
- Pattern: Stored as `users.score`, recomputed on trial verdict via `refreshUserScore()`. Weights defined in scoreWeights.ts

## Entry Points

**Frontend:**
- `src/routes/__root.tsx`: Root layout wrapping all routes with `AppProviders` (Convex, auth, toaster)
- `src/routes/index.tsx`: Public landing page (`/`)
- `src/routes/_shell/_authed/route.tsx`: Authenticated shell (gates on `useConvexAuth()`)
- `src/routes/_shell/_authed/s/$slug/route.tsx`: Startup workspace entry (loads via `useWorkspace(slug)`)
- `src/routes/_shell/startup/$slug.tsx`: Public startup profile

**Backend:**
- `convex/auth.ts` + `convex/auth.config.ts`: Convex Auth setup, Google sign-in provider
- `convex/http.ts`: Registers HTTP routes (auth routes from Convex Auth, `/dodopayments-webhook` for billing)
- `convex/schema.ts`: Defines all tables and validators
- `convex/<domain>/*.ts` (e.g., `convex/teams/startups.ts`): Public query/mutation exports
- Time-based entry: `ctx.scheduler.runAfter()` in `convex/hiring/trialCycles.ts` and `convex/work/cycles.ts` schedule transitions

## Architectural Constraints

- **Threading:** Single-threaded event-driven model (React + Convex)
- **Global state:** Users table has `activeStartupId` field for workspace switching (queried on every workspace load, not globally cached)
- **Circular imports:** None observed; lib modules depend downward toward schema, features depend on api client and lib utilities
- **Auth model:** Every function validates `requireUserId(ctx)` at entry. Authorization then branches on context (membership, cycle access, trial access, pulse ownership)
- **Index discipline:** All queries use `withIndex()` with indexes defined in `schema.ts`. No `.filter()` without backing index
- **Scheduling:** Trial and Cycle state transitions via `ctx.scheduler.runAfter()` registered in their public functions
- **Billing:** Dodo Payments webhook handler in `http.ts` updates `users.planTier` via internal function

## Anti-Patterns

### Unvalidated Direct Table Access

**What happens:** A function queries `memberships` or `cycles` directly without using the helper functions (`requireMembership()`, `requireCycleAccess()`)

**Why it's wrong:** Bypasses authorization checks. A member could query cycles they shouldn't access or modify another user's work.

**Do this instead:** Always call `requireMembership()`, `requireCycleAccess()`, `requireTrialAccess()`, or `requirePulse()` first, depending on context. These are the seam for all access control.

### Missing `.withIndex()` on Queries

**What happens:** Code calls `.query("table").filter()` instead of `.query("table").withIndex("index_name", (q) => q.eq(...)).take(n)`

**Why it's wrong:** Inefficient table scans; scales poorly as data grows. Convex discourages this pattern.

**Do this instead:** Define an index in `schema.ts` for the query pattern, then use `withIndex()` and `take()` to bound results.

### Handling Side Effects in Query Handlers

**What happens:** A query handler calls `notify()` or modifies the database inside a query

**Why it's wrong:** Queries should be side-effect-free. Convex queries can run multiple times; notifications should fire once per user action.

**Do this instead:** Put side effects in mutation handlers. Use `notifyFounders()` and `logActivity()` only in mutations.

### Storing Secrets or API Keys in Frontend Code

**What happens:** `src/env/client.ts` or component code references an API key directly

**Why it's wrong:** Frontend is public; secrets leak to users

**Do this instead:** Secrets live in Convex deployment env vars (DODO_PAYMENTS_*, auth keys, etc.) and are accessed via `process.env` in `convex/` functions only.

## Error Handling

**Strategy:** Errors thrown in Convex functions are caught and passed to frontend via the client, displayed via toast or error boundary

**Patterns:**
- Authorization errors throw `new Error("Not authenticated")` or context-specific messages
- Validation errors throw `new Error("Field must be under N characters")`
- Not-found errors throw `new Error("X not found")`
- Frontend `useQuery()` and `useMutation()` hooks handle errors via Convex client; UI displays in toast or error page

## Cross-Cutting Concerns

**Logging:** No explicit logging layer. Use Convex dashboard logs for debugging.

**Validation:** Zod schemas in `src/features/<domain>/<feature>/schemas/` for frontend forms. Convex validators (`v.string()`, `v.id()`, etc.) in `schema.ts` for backend.

**Authentication:** Convex Auth with Google sign-in via `@convex-dev/auth`. Frontend wraps app in `ConvexAuthProvider`. Every backend function validates `requireUserId()`.

---

*Architecture analysis: 2026-09-29*
