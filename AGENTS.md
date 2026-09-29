# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm**.

- `pnpm dev`: Vite frontend on port 3000. Run `pnpm dev:backend` (`convex dev`) alongside it; that pushes functions and schema to the dev deployment and regenerates `convex/_generated/`.
- `pnpm check`: lint + format (both `--write`) + `tsc --noEmit`. Run this before you consider work done.
- `pnpm check-types` only covers `src/`, because the root tsconfig excludes `convex/`. `convex/` has its own `convex/tsconfig.json` and is typechecked by `convex dev`.
- `pnpm test`: backend tests (vitest, edge-runtime, `convex-test` in memory, no deployment needed).
  - One file: `pnpm test convex/hiring/offers.test.ts`
  - One test: `pnpm test -t "declining an Offer"`
- `pnpm ui <component>`: add a shadcn/ui component (new-york style, lucide icons) into `src/components/ui/`.

Never edit generated files by hand: `src/routeTree.gen.ts` (TanStack Router plugin) and `convex/_generated/**`. `convex/_generated/ai/guidelines.md` holds Convex coding guidelines; follow them when writing backend functions.

## Stack

Vite SPA (React 19) + TanStack Router (file-based, auto code-splitting) + Convex (DB, functions, auth) + Tailwind v4 + shadcn/ui + zod + Biome (tabs, double quotes).

- **Auth**: `@convex-dev/auth` with Google sign-in.
- **Billing**: Dodo Payments through the `@dodopayments/convex` component (`convex/convex.config.ts`, `convex/dodo.ts`).
- **Path aliases**: `~/*` → `src/*`, `@convex/*` → `convex/*`. The frontend imports `api` from `@convex/_generated/api`.
- **Env**: client env is validated in `src/env/client.ts` (`VITE_CONVEX_URL`). Server secrets (`DODO_PAYMENTS_*`, `DODO_MONTHLY_PLAN_ID`, `DODO_YEARLY_PLAN_ID`, auth keys) live in the Convex deployment env and are read via `process.env` in `convex/`.

## Domain

Decisions that would surprise you in the code, along with the reasons for them, are recorded in `docs/adr/`. Code comments cite them as "ADR 000N".

`CONTEXT.md` is the domain glossary (Startup, Founder, Member, Role, Trial Cycle, Participant, Board, Verdict, Offer, Cycle, Pulse, Score, …). Use its terms in code and UI, and avoid the synonyms it lists under "_Avoid_". In brief:
- Startups run **Cycles** of **Pulses**, which are units of work on a kanban that go through Founder review.
- Startups post **Roles**. The only way into a team other than a direct Invite is a **Trial Cycle** for a Role, which ends in a **Verdict** and possibly an **Offer**.
- **Score** is derived only from Trial Cycle outcomes.

## Architecture

Both halves are grouped into the same domains: **people**, **teams**, **hiring**, **work**, **marketing** (frontend only) and **app** (the frontend's authenticated shell). `src/features/<domain>/<feature>/` mirrors `convex/<domain>/<file>.ts`, so a backend function is called as `api.<domain>.<file>.<fn>` (e.g. `api.teams.startups.getWorkspace`).

### Backend (`convex/`)

- **Where files live**:
  - Public functions are in `convex/{people,teams,hiring,work}/*.ts`.
  - Shared server logic is in `convex/lib/`, grouped by domain (`lib/teams/`, `lib/hiring/`, `lib/work/`, `lib/people/`, `lib/reputation/`) plus cross-cutting helpers (`auth.ts`, `notify.ts`, `activity.ts`, `limits.ts`, `text.ts`).
  - Framework and infra files stay at the root: `schema.ts`, `http.ts`, `auth.ts`, `auth.config.ts`, `convex.config.ts`, `dodo.ts`, `migrations.ts`, `notifications.ts`.
- **Authorization**: every function starts with `requireUserId(ctx)` (`lib/auth.ts`), then scopes access with one of:
  - `requireMembership` / `requireFounderMembership` (`lib/teams/membership.ts`), backed by the `memberships` table (`founder` | `member`)
  - `requireCycleAccess` (`lib/work/cycles.ts`)
  - `requireTrialAccess` (`lib/hiring/trialCycles.ts`)
  - `requirePulse` / `requireWorkablePulse` / `requireSubmittedPulse` (`lib/work/pulses.ts`). These are the single seam for both Cycle Pulses and Trial Board Pulses.
- **Multi-startup workspace**: a user can belong to several Startups. The current one is `users.activeStartupId`, read via `api.teams.startups.getWorkspace` and switched with `api.teams.startups.setActive` (frontend: `useWorkspace`).
- **Side effects**:
  - Notifications are written with `notify()` / `notifyFounders()` (`lib/notify.ts`); their kinds are the `notificationKind` validator in `schema.ts`. `convex/notifications.ts` holds only the read/mark-read API.
  - Startup events are appended with `logActivity()` (`lib/activity.ts`).
  - Score is recomputed with `refreshUserScore()` (`lib/reputation/score.ts`); weights are in `scoreWeights.ts`.
- **Time-based transitions** (Trial Cycles and Cycles auto-starting, ending, cancelling) use `ctx.scheduler`, in `hiring/trialCycles.ts` and `work/cycles.ts`.
- **Plan gating**: `users.planTier` (`free` | `pro`) is checked with `isProUser`. Numeric limits are constants in `lib/limits.ts`. `http.ts` registers the auth routes and the `/dodopayments-webhook` handler, which flips `planTier` via `internal.people.billing.setPlanTier`.
- **Indexes**: always query through `withIndex` using indexes defined in `schema.ts`. If none fits, add an index rather than using `.filter`.

### Tests

- Tests sit next to the code as `convex/**/*.test.ts`. They exercise only the public API (`api.*`) and act as users via `t.withIdentity`.
- `convex/test.helpers.ts` has the shared setup: `signUp`, `setUpStartup`, `createTrial`, `startedTrialWith`, `joinAsMember`, `closeWithVerdict`. It also has `advancePast`, which advances fake timers and runs scheduled functions.
- `convex/test.setup.ts` supplies the module glob that `convex-test` needs.
- The UI has no tests.

### Frontend (`src/`)

- **Routes**: `routes/` files are thin. They only call `createFileRoute`, read params and render a page component from `features/`.
  - Public: `/`, `/explore`, `/startup/$slug`, `/u/$username`, `/invite/$token`.
  - `/app/*` is authenticated. `routes/app/route.tsx` renders `features/app/layout/AppLayout`, which gates on `useConvexAuth()` and redirects to `/` when signed out.
- **Features**: `features/<domain>/<feature>/` holds `ui/` (page components), `components/`, `hooks/` (thin wrappers over `useQuery`/`useMutation`), `schemas/` (zod) and `constants.ts`.
- **Shared components**:
  - `components/ui/` holds the shadcn primitives.
  - `components/shared/` holds cross-feature components.
  - `components/globals/` holds router-level pending, error and not-found screens.
  - `lib/` holds small pure helpers (`cn`, dates, initials, username, validation).
- **Providers**: mounted in `routes/__root.tsx` through `features/people/auth/providers/AppProviders.tsx`, which wraps `ConvexAuthProvider` with the client from `lib/convex.ts`.

## Conventions

- Keep files under ~250 lines with one responsibility each. Keep pages thin: logic goes in hooks, markup in components.
- Reuse the existing shadcn primitives, and don't add libraries unless asked.
- Tailwind:
  - Use semantic color tokens only (`bg-background`, `text-muted-foreground`, …) and no arbitrary values.
  - Build mobile-first (`flex-col md:flex-row`, `grid-cols-1 md:grid-cols-2`).
- Put magic numbers in constants (`constants.ts` on the frontend, `lib/limits.ts` on the backend). Write comments only to explain *why*.
- Build only what V1 needs.
