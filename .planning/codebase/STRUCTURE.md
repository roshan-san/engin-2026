---
last_mapped_commit: 63da4c34dd0df46fd780733eaefce3afb95f98e3
last_mapped_at: 2026-09-28
---
# Codebase Structure

**Analysis Date:** 2026-09-28

## Directory Layout

```
engin-2026/
├── convex/                      # Backend (Convex RPC + Database)
│   ├── people/                  # Domain: Users, profiles, reputation
│   │   ├── users.ts             # Auth, profile read/update
│   │   └── billing.ts           # Plan tier (legacy)
│   ├── teams/                   # Domain: Startups, team membership
│   │   ├── startups.ts          # Startup CRUD, workspace load
│   │   └── team.ts              # Membership, invites
│   ├── hiring/                  # Domain: Roles, Trial Cycles, hiring flow
│   │   ├── roles.ts             # Role CRUD, listing
│   │   ├── trialCycles.ts       # Trial CRUD, lifecycle, list
│   │   ├── applications.ts      # Application admission (open/application)
│   │   ├── offers.ts            # Offer CRUD
│   │   ├── verdicts.ts          # Verdict assignment, score updates
│   │   ├── challenges.ts        # Challenge templates for Trials
│   │   ├── trialMessages.ts     # Threads, announcements
│   │   └── opportunities.ts     # Public browse endpoint
│   ├── work/                    # Domain: Cycles, Pulses (internal work)
│   │   ├── cycles.ts            # Cycle CRUD, membership, lifecycle
│   │   └── pulses.ts            # Pulse CRUD, status transitions, verification
│   ├── lib/                     # Shared backend logic, grouped by domain
│   │   ├── auth.ts              # requireUserId, isProUser
│   │   ├── notify.ts            # notify(), notifyFounders()
│   │   ├── activity.ts          # logActivity()
│   │   ├── text.ts              # Validation helpers
│   │   ├── limits.ts            # Numeric limits (MAX_TRIAL_PARTICIPANTS, etc.)
│   │   ├── people/
│   │   │   ├── users.ts         # User loading, public profile
│   │   │   └── username.ts      # Username validation, uniqueness
│   │   ├── teams/
│   │   │   ├── membership.ts    # requireMembership, role checks
│   │   │   ├── invites.ts       # Invite creation, expiry
│   │   │   ├── catalog.ts       # Category/stage parsing
│   │   │   └── startupWrite.ts  # Slug generation, search indexing
│   │   ├── hiring/
│   │   │   ├── trialCycles.ts   # Trial state transitions, scheduling
│   │   │   ├── entries.ts       # Application (Entry) state machine
│   │   │   ├── challenges.ts    # Challenge cloning to Boards
│   │   │   ├── threads.ts       # Thread access control
│   │   │   ├── verdicts.ts      # Verdict issuance, Offer creation
│   │   │   └── offers.ts        # Offer state machine
│   │   ├── work/
│   │   │   ├── cycles.ts        # Cycle access, member checks, auto-start scheduling
│   │   │   ├── pulses.ts        # Pulse authorization (requireWorkablePulse, requireSubmittedPulse)
│   │   │   └── boards.ts        # Board (Trial Cycle workspace)
│   │   └── reputation/
│   │       ├── score.ts         # Score recomputation, loadScoreEvidence
│   │       ├── scoreWeights.ts  # Weight constants
│   │       ├── proofOfWork.ts   # Verified pulses, cycle completion
│   │       └── trialHistory.ts  # Trial outcomes for reputation
│   ├── schema.ts                # Database tables, validators, indexes
│   ├── http.ts                  # HTTP routes (auth, webhooks)
│   ├── auth.ts                  # Auth backend (Google integration)
│   ├── auth.config.ts           # Auth environment config
│   ├── convex.config.ts         # Dodo Payments integration
│   ├── dodo.ts                  # Billing webhook handler
│   ├── migrations.ts            # Data migrations
│   ├── notifications.ts         # Notification read/mark-read API
│   ├── test.helpers.ts          # Test setup: signUp, setUpStartup, etc.
│   ├── test.setup.ts            # Vitest config for Convex
│   ├── tsconfig.json            # Backend TypeScript config
│   └── _generated/              # Auto-generated (DO NOT EDIT)
│       ├── api.d.ts             # TypeScript definitions for api.*
│       └── ai/guidelines.md     # Convex coding guidelines
│
├── src/                         # Frontend (React SPA, Vite)
│   ├── routes/                  # TanStack Router file-based routing
│   │   ├── __root.tsx           # Root layout, AppProviders
│   │   ├── index.tsx            # / — LandingPage
│   │   ├── explore.tsx          # /explore — DiscoverPage
│   │   ├── startup/
│   │   │   └── $slug.tsx        # /startup/$slug — PublicStartupPage
│   │   ├── u/
│   │   │   └── $username.tsx    # /u/$username — PublicProfilePage
│   │   ├── invite/
│   │   │   └── $token.tsx       # /invite/$token — Accept invite
│   │   └── app/                 # /app/* — Authenticated routes
│   │       ├── route.tsx        # AppLayout (auth guard, shell)
│   │       ├── index.tsx        # /app — Redirect to workspace
│   │       ├── startup/         # /app/startup/$slug/*
│   │       │   ├── index.tsx    # Workspace dashboard
│   │       │   ├── roles/       # Manage Roles
│   │       │   └── trials/      # Manage Trial Cycles
│   │       ├── team/            # /app/team — Membership, invites
│   │       ├── work/
│   │       │   ├── cycles/      # /app/work/cycles
│   │       │   └── pulses/      # /app/work/pulses (My Pulses)
│   │       ├── profile/         # /app/profile — Edit profile
│   │       ├── messages/        # /app/messages — Threads
│   │       ├── opportunities/   # /app/opportunities — My applications/offers
│   │       ├── trials/          # /app/trials — My Trial Cycles (Participant view)
│   │       ├── explore/         # /app/explore — Discover (authenticated)
│   │       └── upgrade/         # /app/upgrade — Billing
│   │
│   ├── features/                # Domain-grouped feature modules
│   │   ├── people/              # Domain: Users, profiles, auth
│   │   │   ├── auth/
│   │   │   │   ├── hooks/       # useConvexAuth wrapper, useCurrentUser
│   │   │   │   ├── providers/   # AppProviders (Convex, Router, Toaster)
│   │   │   │   └── ui/          # SignIn, SignUp pages
│   │   │   └── profile/
│   │   │       ├── components/  # ProfileCard, ProofOfWorkCard
│   │   │       ├── hooks/       # useEditProfile, useUpdateProfile
│   │   │       ├── schemas/     # profileSchema (zod)
│   │   │       └── ui/          # EditProfilePage, PublicProfilePage
│   │   │
│   │   ├── teams/               # Domain: Startups, membership
│   │   │   ├── startup/
│   │   │   │   ├── constants.ts # Category/stage labels
│   │   │   │   ├── public/      # Pitch (public read-only)
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/   # useFollowStartup
│   │   │   │   │   ├── schemas/
│   │   │   │   │   └── ui/      # PublicStartupPage
│   │   │   │   └── workspace/   # Founder dashboard (edit Pitch, manage Team/Roles/Trials)
│   │   │   │       ├── components/ # RolesList, TrialsList, ActivityDashboard
│   │   │   │       ├── hooks/   # usePitchEditor, useActivityDashboard
│   │   │   │       └── ui/      # PitchEditorPage, WorkspacePage
│   │   │   └── team/            # Membership, invites
│   │   │       ├── components/
│   │   │       ├── hooks/       # useInviteMember, useResendInvite
│   │   │       ├── schemas/
│   │   │       └── ui/          # TeamPage
│   │   │
│   │   ├── hiring/              # Domain: Trial Cycles, roles, recruitment
│   │   │   ├── roles/
│   │   │   │   └── ui/          # RoleDetailPage
│   │   │   ├── trialCycles/
│   │   │   │   ├── components/  # TrialForm, ChallengeDragger
│   │   │   │   ├── hooks/       # useCreateTrial, useStartTrial, useVerdictForm
│   │   │   │   └── ui/          # TrialSetupPage, TrialDashboard, ParticipantBoard
│   │   │   ├── opportunities/   # Browse open trials (Discover tab)
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/       # useJoinTrial, useApplyToTrial
│   │   │   │   └── ui/
│   │   │   ├── offers/
│   │   │   │   ├── components/  # PendingOffers, OfferCard
│   │   │   │   └── hooks/       # useRespondToOffer
│   │   │   └── messages/        # Threads, announcements
│   │   │       ├── components/
│   │   │       ├── hooks/       # useThreadMessages, useSendMessage
│   │   │       └── ui/          # ThreadPage
│   │   │
│   │   ├── work/                # Domain: Internal cycles, pulses
│   │   │   ├── cycles/
│   │   │   │   ├── components/  # CycleKanban, CycleCard
│   │   │   │   ├── hooks/       # useCycleQuery, useCreateCycle
│   │   │   │   ├── lib/         # Kanban state management
│   │   │   │   └── ui/          # CycleListPage, CyclePage (kanban view)
│   │   │   └── pulses/
│   │   │       ├── components/  # PulseCard, PulseModal, PulseForm
│   │   │       ├── hooks/       # useUpdatePulse, useVerifyPulse
│   │   │       └── ui/          # MyPulsesPage (aggregate across Startups/Trials)
│   │   │
│   │   ├── app/                 # App shell (not a domain feature)
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx    # /app router guard
│   │   │   │   ├── AppShell.tsx     # Header, sidebar, nav bar
│   │   │   │   ├── AppNav.tsx       # Navigation links
│   │   │   │   └── NavLinks.tsx     # Link definitions
│   │   │   ├── hooks/
│   │   │   │   ├── useCurrentUser.ts
│   │   │   │   ├── useWorkspace.ts  # Active startup + list
│   │   │   │   └── useNotifications.ts
│   │   │   └── ui/
│   │   │       ├── StartupSwitcher.tsx
│   │   │       ├── NotificationBell.tsx
│   │   │       ├── UserMenu.tsx
│   │   │       ├── ScoreChip.tsx
│   │   │       └── CommandPalette.tsx
│   │   │
│   │   └── marketing/            # Public pages (not domain-specific)
│   │       ├── landing/
│   │       │   └── ui/           # LandingPage
│   │       ├── explore/          # Public discover with tabs
│   │       │   ├── components/
│   │       │   ├── hooks/
│   │       │   └── ui/           # DiscoverPage
│   │       └── pricing/
│   │           ├── hooks/
│   │           └── ui/           # PricingPage
│   │
│   ├── components/              # Shared, non-domain components
│   │   ├── ui/                  # shadcn primitives (Button, Dialog, etc.)
│   │   ├── shared/              # Cross-feature components (PublicHeader, etc.)
│   │   └── globals/             # Router-level (GlobalSpinner, GlobalError, GlobalNotFound, PageLoading)
│   │
│   ├── lib/                     # Pure frontend utilities
│   │   ├── convex.ts            # Convex client setup
│   │   ├── dates.ts             # Date formatting
│   │   ├── initials.ts          # Get initials from name
│   │   ├── username.ts          # Username formatting
│   │   ├── utils.ts             # cn() helper
│   │   └── validation.ts        # Validation helpers
│   │
│   ├── styles/                  # Tailwind, global CSS
│   │   └── globals.css          # Base styles
│   │
│   ├── env/                     # Environment config
│   │   └── client.ts            # Frontend env vars (VITE_CONVEX_URL)
│   │
│   ├── routeTree.gen.ts         # Auto-generated (DO NOT EDIT)
│   └── main.tsx                 # Vite entry point
│
├── docs/                        # Documentation
│   ├── adr/                     # Architectural Decision Records
│   │   ├── 0001-trial-cycles-are-the-only-path-into-a-team.md
│   │   ├── 0002-score-counts-only-founder-confirmed-evidence.md
│   │   ├── 0003-each-participant-gets-a-private-board.md
│   │   ├── 0004-code-is-grouped-by-domain-not-listed-flat.md
│   │   ├── 0005-startups-pay-talent-and-visibility-are-never-for-sale.md
│   │   └── 0006-frontend-is-a-shell-plus-domain-features.md
│   └── [other documentation]
│
├── public/                      # Static assets
├── node_modules/                # Dependencies
├── .planning/                   # GSD planning outputs
├── CLAUDE.md                    # This project's Claude Code instructions
├── CONTEXT.md                   # Domain glossary (terms, avoid synonyms)
├── tsconfig.json                # Frontend TypeScript config
├── vite.config.ts               # Vite config
├── biome.json                   # Biome linting + formatting (Engin uses tabs, double quotes)
├── package.json                 # Dependencies, scripts
└── pnpm-lock.yaml               # Lock file
```

## Directory Purposes

**`convex/`:**
- Purpose: Convex RPC backend (queries, mutations, internal functions, schema, auth)
- Generated files: `convex/_generated/api.d.ts` (TypeScript API definitions), `convex/_generated/server.d.ts` (Convex SDK types)
- Do not edit generated files

**`convex/<domain>/`:**
- Purpose: Public API surface for each domain (people, teams, hiring, work)
- Files: `*.ts` exported as `api.<domain>.<filename>.<functionName>()`
- Examples: `convex/people/users.ts` → `api.people.users.getMe()`, `convex/teams/startups.ts` → `api.teams.startups.getWorkspace()`

**`convex/lib/`:**
- Purpose: Internal backend logic (not exposed as `api.*`, only called by domain functions)
- Organization: Grouped by domain and cross-cutting concern
- Examples: `requireMembership`, `notify()`, `logActivity()`, `refreshUserScore()`

**`convex/lib/<domain>/`:**
- Purpose: Shared logic for a domain (authorization, state transitions, queries)
- Used by: Domain public functions in `convex/<domain>/`
- Examples: `lib/teams/membership.ts` (role checks), `lib/hiring/trialCycles.ts` (trial lifecycle)

**`src/`:**
- Purpose: React frontend (SPA)
- Entry: `src/main.tsx` (Vite)
- Routing: `src/routes/` (TanStack Router file-based)
- Features: `src/features/<domain>/` (mirrored to backend domains)

**`src/routes/`:**
- Purpose: File-based TanStack Router definitions
- Pattern: One `.tsx` per route; thin wrappers that create route + render page component
- Structure mirrors URL: `src/routes/startup/$slug.tsx` → `/startup/$slug`, `src/routes/app/trials/$trialCycleId.tsx` → `/app/trials/$trialCycleId`
- Generated: `src/routeTree.gen.ts` (DO NOT EDIT)

**`src/features/<domain>/`:**
- Purpose: Self-contained feature modules
- Structure: `ui/` (page components), `components/` (reusable), `hooks/` (data fetching), `schemas/` (zod), `constants.ts`
- Domains: people, teams, hiring, work
- Each mirrors a `convex/<domain>/` file

**`src/features/<domain>/<feature>/ui/`:**
- Purpose: Page components rendered by routes
- Naming: `*Page.tsx` for pages that fill the full width; `*Modal.tsx` for dialogs
- Pattern: Compose `hooks/` for data + `components/` for UI

**`src/features/<domain>/<feature>/components/`:**
- Purpose: Reusable components within a feature
- Examples: `RoleCard.tsx`, `TrialForm.tsx`, `PulseKanbanCard.tsx`
- Pattern: Accept props (data + callbacks), no data fetching (use hooks in parent)

**`src/features/<domain>/<feature>/hooks/`:**
- Purpose: Custom hooks wrapping `useQuery`/`useMutation`
- Naming: `use*Query` or `use*Mutation` or `use*Form`
- Pattern: Thin wrappers over Convex client; return loading, data, error, handlers

**`src/features/<domain>/<feature>/schemas/`:**
- Purpose: Zod validation schemas
- Used for: Form validation, type safety
- Examples: `profileSchema.ts`, `cycleFormSchema.ts`

**`src/components/ui/`:**
- Purpose: shadcn/ui primitives (Button, Dialog, Input, etc.)
- Do not add new libraries; use existing primitives
- Tailwind semantic tokens only (bg-background, text-foreground)

**`src/components/shared/`:**
- Purpose: Cross-feature reusable components (PublicHeader, etc.)
- Examples: `PublicHeader.tsx` (shared by /startup/$slug, /u/$username, /explore)

**`src/lib/`:**
- Purpose: Pure utilities (no React, no API calls)
- Examples: `cn()`, date formatting, username sanitization, validation helpers
- Pattern: Functional, deterministic, testable (though no test files in current codebase)

**`docs/adr/`:**
- Purpose: Architectural Decision Records
- Read before modifying architecture; ADRs explain the "why"
- Examples: ADR 0004 (domain grouping), ADR 0006 (frontend shell + features)

## Key File Locations

**Entry Points:**
- `src/main.tsx` — Vite app entry
- `src/routes/__root.tsx` — Root route + AppProviders
- `convex/http.ts` — HTTP routes (auth, webhooks)

**Configuration:**
- `vite.config.ts` — Vite setup (auto code-splitting for routes)
- `biome.json` — Linting/formatting (tabs, double quotes)
- `tsconfig.json` — Frontend TypeScript
- `convex/tsconfig.json` — Backend TypeScript
- `convex/auth.config.ts` — Google OAuth config
- `convex/convex.config.ts` — Dodo Payments integration
- `CLAUDE.md` — Project conventions and commands
- `CONTEXT.md` — Domain glossary (use these terms, avoid listed synonyms)

**Core Logic:**
- `convex/schema.ts` — All database tables, validators, indexes
- `convex/lib/auth.ts` — Authentication helpers (`requireUserId`, `isProUser`)
- `convex/lib/teams/membership.ts` — Authorization (role checks)
- `convex/lib/notify.ts` — Notification creation
- `convex/lib/activity.ts` — Activity log creation
- `convex/lib/reputation/score.ts` — Score recomputation
- `src/features/app/layout/AppShell.tsx` — App header + sidebar
- `src/lib/convex.ts` — Convex client setup

**Testing:**
- `convex/test.helpers.ts` — Test utilities (`signUp`, `setUpStartup`, `createTrial`)
- `convex/test.setup.ts` — Vitest module glob config
- `convex/**/*.test.ts` — Test files (17 test files, placed next to implementation)

**Styling:**
- `src/styles/globals.css` — Global Tailwind + custom CSS
- Tailwind config: embedded in `tailwind.config.ts` (not visible in Bash output, likely in root)
- Theme: dark-only (`dark` class applied by default)

## Naming Conventions

**Files:**
- Backend functions: `*.ts` (e.g., `users.ts`, `trialCycles.ts`)
- Frontend pages: `*Page.tsx` (e.g., `PublicStartupPage.tsx`, `CyclePage.tsx`)
- Frontend modals/dialogs: `*Modal.tsx` (e.g., `OfferModal.tsx`)
- Frontend components: `*Card.tsx`, `*List.tsx`, `*Button.tsx` (e.g., `PulseCard.tsx`)
- Frontend hooks: `use*.ts` (e.g., `useCurrentUser.ts`, `useCycleQuery.ts`)
- Schemas: `*Schema.ts` (e.g., `profileSchema.ts`)
- Constants: `constants.ts` (e.g., `src/features/teams/startup/constants.ts`)
- Utilities: `*.ts` (e.g., `utils.ts`, `dates.ts`)
- Tests: `*.test.ts` (e.g., `users.test.ts`)

**Directories:**
- Domain: lowercase plural or singular (people, teams, hiring, work)
- Feature: lowercase (profile, startup, team, roles, trialCycles)
- Component subdirs: `ui/`, `components/`, `hooks/`, `schemas/`

**Functions & Variables:**
- camelCase: `getWorkspace()`, `requireMembership()`, `userId`, `isProUser`
- Constants: SCREAMING_SNAKE_CASE: `MAX_TRIAL_PARTICIPANTS`, `INVITE_TTL_MS`
- Domain terminology: Use CONTEXT.md terms (Cycle, Pulse, Trial Cycle, Participant, Founder, Member, Verdict, Offer, Score, etc.)

**Exports:**
- Backend: Named exports only (e.g., `export const getMe = query(...)`)
- Frontend: Default export for page components, named for utility/hook exports
- Barrel files: `index.ts` re-exports from subdirs (minimal use in this codebase)

## Where to Add New Code

**New Feature (e.g., a role profile page):**
1. Create backend: `convex/hiring/roleProfile.ts` with queries/mutations
2. Create frontend structure:
   ```
   src/features/hiring/roleProfile/
   ├── ui/
   │   └── RoleProfilePage.tsx
   ├── components/
   │   └── RoleHeader.tsx
   ├── hooks/
   │   └── useRoleProfile.ts
   ├── schemas/
   │   └── roleSchema.ts
   └── constants.ts
   ```
3. Create route: `src/routes/app/startup/roles/$roleId.tsx`
4. Import backend functions as `api.hiring.roleProfile.*` in hooks

**New Component (e.g., a button for verifying pulses):**
- If domain-specific: `src/features/<domain>/<feature>/components/VerifyButton.tsx`
- If cross-feature: `src/components/shared/VerifyButton.tsx`
- Import from parent feature's hooks for mutation handler

**New Authorization Check:**
1. Add helper to `convex/lib/<domain>/<concern>.ts` (e.g., `convex/lib/hiring/verdicts.ts`)
2. Export function: `export async function requireCanGiveVerdict(...)`
3. Call from mutation: `await requireCanGiveVerdict(ctx, ...)`

**New Backend Database Query/Index:**
1. Add index to `convex/schema.ts`: `.index("by_foo", ["foo"])`
2. Query with index: `ctx.db.query("table").withIndex("by_foo", q => q.eq("foo", value))`

**New Notification Type:**
1. Add kind to `notificationKind` validator in `convex/schema.ts`
2. Call `notify(ctx, { userId, kind, title, href })`
3. Frontend reads via `api.notifications.get()`

**New Domain:**
- Document the decision in `docs/adr/` as a new ADR
- Structure: `convex/<new-domain>/`, `src/features/<new-domain>/`
- Ensure `lib/<new-domain>/` for shared logic
- Mirror routes in `src/routes/app/<new-domain>/` (if authenticated)

## Special Directories

**`convex/_generated/`:**
- Purpose: Auto-generated Convex SDK (types, API client)
- Generated: `convex dev` regenerates on file changes
- Committed: Yes
- DO NOT EDIT: Manually editing causes conflicts on next regeneration

**`src/routeTree.gen.ts`:**
- Purpose: Auto-generated TanStack Router route definitions
- Generated: When `src/routes/` changes (via build plugin)
- Committed: Yes
- DO NOT EDIT: Manually editing causes conflicts

**`convex/migrations.ts`:**
- Purpose: Data migrations (backward compatibility)
- Run on: `convex dev` startup (in-memory) or `convex prod` deployment
- Examples: Renaming fields, backfilling defaults

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: By `/gsd-map-codebase` command
- Committed: Yes
- Used by: `/gsd-plan-phase` and `/gsd-execute-phase` for guidance

**`docs/adr/`:**
- Purpose: Architectural Decision Records
- Read: Before making architecture changes
- Add: Document major decisions (new domain, auth pattern, data model change)
- Format: Markdown with status, rationale, consequences

---

*Structure analysis: 2026-09-28*
