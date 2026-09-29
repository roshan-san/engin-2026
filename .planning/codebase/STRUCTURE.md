---
last_mapped_commit: f0a648da4386d24b5ee96348a96bf0cf757ba15f
last_mapped_at: 2026-09-29
---
# Codebase Structure

**Analysis Date:** 2026-09-29

## Directory Layout

```
engin-2026/
├── convex/                          # Backend (Convex functions, schema, auth)
│   ├── _generated/                  # Generated types and API client (don't edit)
│   ├── lib/                         # Shared backend logic
│   │   ├── auth.ts                  # Authorization helpers (requireUserId, isProUser)
│   │   ├── notify.ts                # Notification side effects
│   │   ├── activity.ts              # Activity logging side effects
│   │   ├── limits.ts                # Numeric limits (pro/free tiers)
│   │   ├── text.ts                  # Text validation helpers
│   │   ├── links.ts                 # URL/href generation
│   │   ├── people/                  # People domain helpers
│   │   ├── teams/                   # Teams domain helpers (membership, invites, plan gating)
│   │   ├── hiring/                  # Hiring domain helpers (trials, verdicts, offers)
│   │   ├── work/                    # Work domain helpers (cycles, pulses, boards)
│   │   └── reputation/              # Score calculation
│   ├── people/                      # People domain public API (users, billing)
│   ├── teams/                       # Teams domain public API (startups, members, invites, activity, explore)
│   ├── hiring/                      # Hiring domain public API (roles, trials, applications, offers, verdicts, challenges, messages)
│   ├── work/                        # Work domain public API (cycles, pulses, boards, review)
│   ├── schema.ts                    # Database tables, types, validators
│   ├── auth.ts                      # Convex Auth setup
│   ├── auth.config.ts               # Auth provider config
│   ├── convex.config.ts             # Convex deployment config
│   ├── http.ts                      # HTTP routes and webhooks
│   ├── dodo.ts                      # Billing provider setup
│   ├── notifications.ts             # Notification read/mark-read API
│   ├── migrations.ts                # Schema migrations
│   ├── test.helpers.ts              # Test utilities (signUp, setUpStartup, etc.)
│   ├── test.setup.ts                # Test configuration
│   ├── tsconfig.json                # TypeScript config for convex/
│   └── *.test.ts                    # Backend tests (co-located)
│
├── src/                             # Frontend (React, TanStack Router)
│   ├── routes/                      # File-based route definitions (TanStack Router)
│   │   ├── __root.tsx               # Root layout with AppProviders
│   │   ├── index.tsx                # Public landing page (/)
│   │   ├── _shell/                  # Public shell layout
│   │   │   ├── route.tsx            # Public layout wrapper
│   │   │   ├── discover/            # Public discovery page
│   │   │   ├── pricing/             # Public pricing page
│   │   │   ├── startup/$slug.tsx    # Public startup profile
│   │   │   ├── u/$username.tsx      # Public user profile
│   │   │   ├── invite/$token.tsx    # Invite acceptance page
│   │   │   └── _authed/             # Authenticated shell
│   │   │       ├── route.tsx        # Auth gate + authenticated layout
│   │   │       ├── inbox/           # Notifications page
│   │   │       ├── my-pulses/       # User's assigned pulses
│   │   │       ├── startups/        # List user's startups
│   │   │       ├── profile/         # User profile editor
│   │   │       ├── threads/         # Trial messages (participant view)
│   │   │       └── s/$slug/         # Startup workspace routes
│   │   │           ├── route.tsx    # Startup gate + layout
│   │   │           ├── index.tsx    # Workspace home
│   │   │           ├── trials/      # Trial cycle list/detail
│   │   │           └── _member/     # Member-only routes (gates on membership)
│   │   │               ├── cycles/  # Cycle list/detail
│   │   │               ├── hiring/  # Hiring (roles, applications)
│   │   │               ├── activity/ # Startup activity feed
│   │   │               ├── pitch/   # Startup pitch editor
│   │   │               ├── team/    # Team settings
│   │   │               └── settings/ # Startup settings
│   │
│   ├── features/                    # Feature modules (mirrors backend domains)
│   │   ├── people/                  # People domain (auth, profiles, reputation)
│   │   │   ├── auth/
│   │   │   │   ├── components/      # GoogleButton, etc.
│   │   │   │   ├── hooks/           # useGoogleSignIn, useCurrentUser
│   │   │   │   └── providers/       # AppProviders (Convex, auth context)
│   │   │   └── profile/
│   │   │       ├── components/      # Profile sections (ProofOfWork, TrialHistory, etc.)
│   │   │       ├── hooks/           # useProfileEditor
│   │   │       ├── pages/           # PublicProfilePage
│   │   │       └── schemas/         # Profile form validation (zod)
│   │   │
│   │   ├── teams/                   # Teams domain (startups, invites, membership)
│   │   │   ├── startup/
│   │   │   │   ├── public/          # Public startup profile pages
│   │   │   │   │   ├── components/  # PublicOpenings, etc.
│   │   │   │   │   ├── hooks/       # useCreateStartupWizard, useFollowStartup
│   │   │   │   │   ├── pages/       # CreateStartupPage, PublicStartupPage
│   │   │   │   │   └── schemas/     # Startup form (zod)
│   │   │   │   └── workspace/       # Private startup workspace
│   │   │   │       ├── components/  # Pitch editor, settings, etc.
│   │   │   │       ├── hooks/       # useStartupEditor
│   │   │   │       ├── pages/       # WorkspacePage
│   │   │   │       └── schemas/     # Settings validation
│   │   │   └── team/                # Team member management
│   │   │       ├── components/      # Member list, invite form
│   │   │       ├── hooks/           # useSendInvite, useMemberList
│   │   │       ├── pages/           # TeamSettingsPage
│   │   │       └── schemas/         # Team form validation
│   │   │
│   │   ├── hiring/                  # Hiring domain (roles, trials, applications, offers)
│   │   │   ├── roles/               # Role posting
│   │   │   ├── opportunities/       # Role browsing (public discovery)
│   │   │   ├── trialCycles/         # Trial cycle management
│   │   │   │   ├── components/      # TrialChallenges, ParticipantBoard, Verdicts, etc.
│   │   │   │   ├── hooks/           # useTrialCycle, useBoardPulses
│   │   │   │   ├── pages/           # TrialCyclePage (founder + participant view)
│   │   │   │   └── schemas/         # Trial form validation
│   │   │   └── offers/              # Offer acceptance/decline
│   │   │       ├── components/      # PendingOffers
│   │   │       └── hooks/           # useAcceptOffer
│   │   │
│   │   ├── work/                    # Work domain (cycles, pulses, kanban board)
│   │   │   ├── cycles/
│   │   │   │   ├── components/      # KanbanBoard, PulseCard, CycleForm
│   │   │   │   ├── hooks/           # useActiveCycle, useCyclePulses, useMutatePulse
│   │   │   │   ├── lib/             # kanban.ts (reordering logic)
│   │   │   │   └── constants.ts     # Kanban layout constants
│   │   │   ├── pulses/              # Pulse detail and proof links
│   │   │   │   ├── components/      # PulseBoard, PulseProofLinks
│   │   │   │   └── constants.ts
│   │   │   └── [hooks shared across cycles + pulses]
│   │   │
│   │   ├── discover/                # Public discovery (trending startups, contributors)
│   │   │   ├── pages/               # DiscoverPage
│   │   │   └── hooks/               # useDiscoverStartups, useContributors
│   │   │
│   │   └── marketing/               # Public marketing (landing, pricing)
│   │       ├── landing/
│   │       │   └── pages/           # LandingPage
│   │       └── pricing/
│   │           ├── hooks/           # useUpgrade
│   │           └── pages/           # PricingPage
│   │
│   ├── shell/                       # App-wide UI chrome
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # Main authenticated layout wrapper
│   │   │   ├── AuthLayouts.tsx      # Authenticated route layout gate
│   │   │   └── PublicShell.tsx      # Public route layout wrapper
│   │   ├── sidebar/
│   │   │   ├── AppSidebar.tsx       # Main sidebar with nav + startup switcher
│   │   │   ├── StartupSwitcher.tsx  # Workspace switcher dropdown
│   │   │   └── StartupAvatar.tsx    # Startup logo
│   │   ├── account/
│   │   │   ├── AccountMenu.tsx      # User menu (sign out, etc.)
│   │   │   └── ScoreChip.tsx        # Reputation score display
│   │   ├── startup/
│   │   │   ├── StartupRoute.tsx     # Workspace guard HOC
│   │   │   └── MemberGate.tsx       # Membership guard HOC
│   │   ├── mobile/
│   │   │   ├── MobileTopBar.tsx     # Mobile header
│   │   │   ├── BottomTabBar.tsx     # Mobile bottom navigation
│   │   │   └── other mobile components
│   │   ├── command/
│   │   │   ├── CommandPalette.tsx   # Cmd+K command palette
│   │   │   ├── CommandProvider.tsx  # Context for palette data
│   │   │   └── usePaletteData.ts    # Populate command items
│   │   ├── shortcuts/
│   │   │   ├── registry.ts          # Keyboard shortcut definitions
│   │   │   ├── platform.ts          # Platform-specific key names
│   │   │   └── useShortcuts.ts      # Hook to register handlers
│   │   ├── hooks/
│   │   │   ├── useCurrentUser.ts    # Fetch current user + cache
│   │   │   ├── useFocusedStartup.ts # Current startup for workspace
│   │   │   ├── useNotifications.ts  # Fetch + manage notifications
│   │   │   └── useStartupBySlug.ts  # Load startup by slug
│   │   └── nav.ts                   # Navigation route definitions
│   │
│   ├── components/                  # Shared UI components
│   │   ├── ui/                      # shadcn/ui primitives (Button, Input, Dialog, etc.)
│   │   ├── shared/                  # Cross-feature domain components
│   │   └── globals/                 # Router-level screens (GlobalSpinner, GlobalError, GlobalNotFound)
│   │
│   ├── lib/                         # Frontend utilities
│   │   ├── convex.ts                # Convex client setup
│   │   ├── dates.ts                 # Date formatting helpers
│   │   ├── initials.ts              # Avatar initials from name
│   │   ├── username.ts              # Username formatting
│   │   ├── utils.ts                 # `cn()` and other helpers
│   │   └── validation.ts            # Input validation helpers
│   │
│   ├── hooks/                       # App-wide hooks (use-mobile breakpoint)
│   ├── env/
│   │   └── client.ts                # Client env var validation (VITE_CONVEX_URL)
│   ├── styles/
│   │   ├── globals.css              # Global styles + Tailwind
│   │   └── custom.css               # Custom theme overrides
│   ├── routeTree.gen.ts             # Generated by TanStack Router plugin (don't edit)
│   └── main.tsx                     # App entry point
│
├── public/                          # Static assets
├── docs/                            # Documentation
│   ├── adr/                         # Architecture Decision Records
│   └── ...
│
├── .planning/                       # GSD planning documents (generated)
│   ├── codebase/                    # Codebase maps (ARCHITECTURE.md, STRUCTURE.md, etc.)
│   ├── phases/                      # Phase plans and context
│   └── intel/                       # Domain analysis, issue tracker data
│
├── .claude/                         # Claude Code configuration
│   └── skills/                      # Project-specific skills
│
├── vite.config.ts                   # Vite build config (path aliases, plugins)
├── tsconfig.json                    # TypeScript config for src/
├── convex/tsconfig.json             # TypeScript config for convex/
├── tailwind.config.ts               # Tailwind v4 config
├── biome.json                       # Biome linter + formatter config
├── package.json                     # Project metadata and scripts
├── pnpm-lock.yaml                   # Locked dependency versions
├── CLAUDE.md                        # Project conventions for Claude
├── CONTEXT.md                       # Domain glossary (if exists)
├── .gitignore
└── .git/
```

## Directory Purposes

**`convex/`:**
- Purpose: Complete backend (Convex functions, schema, auth, webhooks, tests)
- Contains: Public API (queries, mutations), shared lib, schema, configuration
- Key files: `schema.ts` (datamodel), `http.ts` (webhooks), `auth.ts` (auth setup), `lib/` (logic)

**`src/routes/`:**
- Purpose: URL-to-component mapping (file-based routing)
- Contains: `createFileRoute()` definitions, param extraction, thin route logic
- Pattern: Nested directories mirror URL segments; `$param` denotes dynamic segments; `_authed` groups protected routes
- Generated: `src/routeTree.gen.ts` (don't edit)

**`src/features/`:**
- Purpose: Feature modules organized by domain
- Contains: `ui/` (pages), `components/`, `hooks/` (data fetching), `schemas/` (form validation), `constants.ts`
- Pattern: One feature per directory; imports from `@convex/_generated/api` for backend functions
- Domain structure: `people/`, `teams/`, `hiring/`, `work/`, `discover/`, `marketing/`

**`src/shell/`:**
- Purpose: App chrome and global UI state (sidebar, account menu, command palette, layouts)
- Contains: Layout wrappers, navigation components, workspace/user hooks, keyboard shortcuts
- Key responsibilities: Workspace switching, notifications, authentication UI

**`src/components/`:**
- Purpose: Reusable UI primitives and domain widgets
- Structure: `ui/` (shadcn), `shared/` (cross-domain components), `globals/` (router-level screens)

**`src/lib/`:**
- Purpose: Cross-domain frontend utilities (dates, validation, client setup, helpers)
- Contains: Small, pure functions; no business logic or data fetching

**`convex/lib/`:**
- Purpose: Shared backend authorization, data access, side effects
- Structure: Domain-specific subdirectories + cross-cutting helpers
- Key pattern: Helper functions like `requireMembership()`, `notify()`, `logActivity()` used by public API functions

**`convex/<domain>/`:**
- Purpose: Public query and mutation endpoints for one domain
- Contents: Named exports for `query()` and `mutation()` handlers (e.g., `export const getWorkspace = query({...})`)
- Example files: `convex/teams/startups.ts`, `convex/work/pulses.ts`, `convex/hiring/trialCycles.ts`

## Key File Locations

**Entry Points:**
- Frontend: `src/main.tsx` (app mount) → `src/routes/__root.tsx` (root layout)
- Backend: `convex/schema.ts` (datamodel), `convex/http.ts` (HTTP routes), `convex/auth.ts` (auth)

**Configuration:**
- `vite.config.ts`: Build, path aliases (`~/*`, `@convex/*`), TanStack Router plugin
- `tsconfig.json`: TypeScript settings for `src/`
- `convex/tsconfig.json`: TypeScript settings for `convex/`
- `tailwind.config.ts`: Tailwind theme (Geist font, semantic colors)
- `biome.json`: Linting rules (tabs, double quotes)
- `package.json`: Scripts (`pnpm dev`, `pnpm check`, `pnpm test`)

**Core Logic:**
- Backend auth: `convex/lib/auth.ts`, `convex/lib/teams/membership.ts`, `convex/lib/work/cycles.ts`
- Backend schema: `convex/schema.ts`
- Frontend providers: `src/features/people/auth/providers/AppProviders.tsx`
- Frontend lib: `src/lib/convex.ts` (Convex client), `src/lib/dates.ts`, `src/lib/validation.ts`

**Testing:**
- Backend: `convex/**/*.test.ts` (co-located), `convex/test.helpers.ts`, `convex/test.setup.ts`
- Frontend: Not tested (per CLAUDE.md)

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `AppShell.tsx`, `PulseCard.tsx`)
- Hooks: `camelCase.ts` starting with `use` (e.g., `useActiveCycle.ts`, `useCyclePulses.ts`)
- Utilities: `camelCase.ts` (e.g., `kanban.ts`, `validation.ts`)
- Types/schemas: File per purpose (e.g., `schema.ts` in feature dir for zod)
- Tests: `*.test.ts` co-located with implementation

**Directories:**
- Features: `<domain>/<feature>/` (e.g., `work/cycles/`, `hiring/trialCycles/`)
- Routes: Nested folders matching URL segments; `_` prefix for layout groups (e.g., `_authed/`, `_member/`)
- Dynamic routes: `$paramName` (e.g., `$slug`, `$trialCycleId`)

**Code:**
- Functions: `camelCase` (e.g., `requireUserId`, `getMembership`, `logActivity`)
- Variables: `camelCase` (e.g., `userId`, `cycleId`, `memberships`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `MAX_PITCH_SECTION`, `PULSE_PAGE_SIZE`)
- Types: `PascalCase` (e.g., `MembershipEntry`, `AuthCtx`)
- Database tables: `camelCase` plural (e.g., `users`, `startups`, `memberships`, `pulses`, `cycles`, `trialCycles`)

## Where to Add New Code

**New Feature (e.g., new hiring page):**
- Backend: Create `convex/hiring/<newfeature>.ts` with `query()` and `mutation()` exports, add shared lib in `convex/lib/hiring/<newfeature>.ts`
- Frontend: Create `src/features/hiring/<newfeature>/` with `ui/`, `components/`, `hooks/`, `schemas/`, `constants.ts`
- Routes: Add `src/routes/_shell/_authed/s/$slug/_member/hiring/<route>.tsx`
- Tests: Add `convex/hiring/<newfeature>.test.ts` using patterns in `convex/test.helpers.ts`

**New Component/Module:**
- If reusable across features: `src/components/shared/<component>/`
- If domain-specific: `src/features/<domain>/<feature>/components/`
- If UI primitive: Use shadcn/ui via `pnpm ui <component>` → adds to `src/components/ui/`

**Utilities:**
- Cross-domain frontend helpers: `src/lib/`
- Domain-specific frontend helpers: Feature-level `lib/` or `constants.ts`
- Backend helpers: `convex/lib/<domain>/` for domain logic, `convex/lib/` for cross-cutting (auth, notify, activity, limits, text)

**Tests:**
- Backend: Co-locate as `convex/<domain>/<feature>.test.ts` next to `convex/<domain>/<feature>.ts`
- Frontend: Not tested per project conventions
- Test setup: Use `convex/test.helpers.ts` (`signUp`, `setUpStartup`, `createTrial`, etc.)

## Special Directories

**`convex/_generated/`:**
- Purpose: Generated types, API client, guidelines
- Generated: By `convex dev` when functions/schema change
- Committed: Yes (includes types for frontend imports)
- Edit: Never by hand; generated from schema.ts

**`src/routeTree.gen.ts`:**
- Purpose: Generated route definitions for TanStack Router
- Generated: By TanStack Router plugin on build/dev
- Committed: Yes
- Edit: Never by hand

**`.planning/`:**
- Purpose: GSD planning documents (phases, codebase analysis, domain intelligence)
- Generated: By GSD tools
- Committed: Yes (tracked as work artifact)
- Edit: By GSD tools only

**`.gsd/`:**
- Purpose: GSD internal state and configuration
- Generated: By GSD tools
- Committed: Optionally (contains session state, skip if noisy)
- Edit: By GSD tools only

---

*Structure analysis: 2026-09-29*
