---
last_mapped_commit: 63da4c34dd0df46fd780733eaefce3afb95f98e3
last_mapped_at: 2026-09-28
---
# Coding Conventions

**Analysis Date:** 2026-09-28

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `CyclePage.tsx`, `ActivityDashboard.tsx`)
- Hooks: camelCase prefixed with `use` (e.g., `useWorkspace.ts`, `useActiveCycle.ts`)
- Backend queries/mutations: camelCase in `convex/**/*.ts` (e.g., `offers.ts`, `trialCycles.ts`)
- Utilities and helpers: camelCase (e.g., `auth.ts`, `activity.ts`, `notify.ts`)
- Test files: same name as tested file with `.test.ts` suffix (co-located), e.g., `offers.test.ts`

**Functions:**
- All functions: camelCase (e.g., `requireUserId`, `notifyFounders`, `fillRoleIfFull`)
- Helper functions often prefixed with verbs: `require*`, `get*`, `load*`, `fetch*`, `set*`
- Example patterns: `requirePendingOffer`, `loadPublicUser`, `getMembership`, `addCycleMember`

**Variables:**
- Local variables and parameters: camelCase (e.g., `userId`, `startupId`, `membership`)
- Booleans often prefixed: `is*`, `has*`, `can*` (e.g., `isParticipant`, `hasStartups`, `isFounder`)
- Destructured from API responses use the field name as-is

**Types:**
- PascalCase for all types and interfaces (e.g., `Id<"users">`, `Doc<"offers">`, `MutationCtx`, `QueryCtx`)
- Discriminated union types use `kind` field with literal strings (e.g., `kind: "passed_with_offer" | "passed" | "not_passed"`)

**Constants:**
- UPPER_SNAKE_CASE in `lib/limits.ts` (backend) and `constants.ts` (frontend)
- Time constants: `HOUR`, `DAY` defined as `60 * 60 * 1000` and `24 * HOUR`
- Example: `MAX_USER_OFFERS`, `MAX_LISTED_TRIALS`, `FREE_ACTIVE_TRIAL_APPLICATIONS`
- Domain term constants in feature `constants.ts` files

## Code Style

**Formatting:**
- Tool: Biome v2.5.14
- Indentation: tabs (configured in `biome.json`)
- Quotes: double quotes (JavaScript formatter setting)
- Line organization: biome organizes imports via `assist.actions.source.organizeImports`

**Linting:**
- Biome recommended rules enabled
- Exceptions: shadcn/ui components (`src/components/ui/`) have disabled a11y rules (`useSemanticElements`, `useKeyWithClickEvents`) and `suspicious.noArrayIndexKey`
- Both frontend and backend included in biome scope (except generated files)

**TypeScript:**
- Strict mode enabled in both `tsconfig.json` (src) and `convex/tsconfig.json`
- No `any` types; proper context types: `QueryCtx`, `MutationCtx`, `ActionCtx` for Convex functions
- Path aliases in use: `~/*` → `src/*`, `@convex/*` → `convex/*`
- Type inference preferred where clear; explicit types on IDs and document types

## Import Organization

**Order:**
1. Convex framework imports (`convex/values`, `convex/server`, `./_generated/server`, `./_generated/api`)
2. Type imports from Convex (`type { Id }`, `type { Doc }`, `type { MutationCtx }`)
3. Internal library imports (from `../lib/*`, `../schema`)
4. React and external packages
5. Local feature imports (same feature path)

**Path Aliases:**
- Backend: `@convex/*` maps to `convex/` (e.g., `@convex/_generated/api`)
- Frontend: `~/*` maps to `src/` (e.g., `~/features/app/hooks/useWorkspace`)
- Relative imports used sparingly; prefer path aliases for clarity

**Auto-organization:**
- Biome's `organizeImports` is enabled; imports are auto-sorted on format
- Never manually organize; run `pnpm check` to apply formatter

## Error Handling

**Patterns:**
- Every Convex function starts with authorization check: `requireUserId(ctx)`, then more specific checks like `requireMembership` or `requireFounderMembership`
- Errors are thrown as `Error()` with clear, actionable messages (e.g., "Offer not found", "This Role is closed", "Not authenticated")
- Function results with predicates: helpers like `requirePendingOffer` throw if condition fails; getters like `getMembership` return null if not found
- No silent failures; all error paths explicit

**Validation:**
- Convex function `args` always validated via `v.object({ ... })` in `args` parameter
- Text inputs validated with `requireText(input, fieldName)` helper which trims and checks non-empty
- Numbers constrained: `Math.min`, `Math.max`, `Math.floor` applied as needed before insert
- Dates checked: end times validated to be after start times

**Authorization checks (in order):**
1. `requireUserId(ctx)` - get authenticated user ID
2. `requireMembership(ctx, startupId, userId)` - check team access
3. `requireFounderMembership` - check founder-specific access
4. `requireCycleAccess` / `requireTrialAccess` - check operation-specific access
5. Custom predicates: e.g., `if (offer.status !== "pending") throw new Error(...)`

## Logging

**Framework:** `console` (Convex runtime compatible)

**Patterns:**
- Minimal logging in production code
- Activity logging via `logActivity()` helper (`lib/activity.ts`) for audit trail
- Notifications via `notify()` and `notifyFounders()` for user-facing events
- No debug logs in main flow; use test assertions instead

## Comments

**When to Comment:**
- Explain *why* a decision was made, not *what* the code does
- ADR (Architecture Decision Record) references: "ADR 000N" cites `docs/adr/` decisions
- Non-obvious domain logic: e.g., comments on why a field is stored or calculated a certain way
- Avoid stating obvious code: don't comment `// increment counter`

**JSDoc/TSDoc:**
- Used on helper functions with non-obvious signatures
- Example from code: `/** Append-only Activity record, alongside notify() at the same call sites. */`
- Single-line JSDoc for simple helpers; multi-line for complex behaviors
- Frontend: minimal JSDoc; focus on hooks returning clear return objects

## Function Design

**Size:** Target ~50 lines per function; ~250 lines per file maximum

**Parameters:**
- Use typed objects for multiple params, not positional arguments
- Example: `handler: async (ctx, args)` where `args` is `{ userId: Id<"users">, offerId: Id<"offers"> }`
- Optional params grouped in a single `options` object (e.g., `options: { except?: Id<"users"> }`)

**Return Values:**
- Queries return unambiguous data structures: arrays, objects, or null
- Mutations return single IDs or void; side effects via `notify()` and `logActivity()`
- Helpers return typed values; throw on validation failure rather than returning null for errors

**Async/await:**
- All database operations are `await`ed
- Promises collected with `await Promise.all()` for parallel work
- Example: building enriched results by mapping and awaiting lookups

## Module Design

**Exports:**
- One exported function per file preferred; exports named and explicit
- Example: `export const listMine = query({ ... })`
- Helper functions in `lib/` prefixed with domain: `lib/hiring/offers.ts`, `lib/work/cycles.ts`

**Barrel Files:**
- None used; imports are direct to specific files
- Path aliases make this clean: `api.teams.startups.getWorkspace` vs manual barrel re-exports

**Backend Structure:**
- Public API: `convex/{people,teams,hiring,work}/*.ts` (exported as `api.*`)
- Internal helpers: `convex/lib/{domain}/*.ts` (imported locally, not exposed)
- Cross-cutting: `convex/lib/{auth,notify,activity,limits,text}.ts`
- Schema and infra: `convex/schema.ts`, `convex/auth.ts`, `convex/http.ts`

**Frontend Structure:**
- Features: `src/features/{domain}/{feature}/` containing `ui/`, `components/`, `hooks/`, `schemas/`, `constants.ts`
- Shared: `src/components/ui/` (shadcn primitives), `src/components/shared/` (cross-feature), `src/components/globals/` (router-level)
- Utilities: `src/lib/` for pure helpers, date formatting, validation, username, initials

## Tailwind & CSS

**Color tokens:**
- Semantic colors only: `bg-background`, `text-muted-foreground`, `border-input`
- No arbitrary values (no `bg-[#fff]` or `text-[14px]`)
- Tailwind v4 with custom semantic tokens for dark mode support

**Responsive design:**
- Mobile-first: `flex-col md:flex-row`, `grid-cols-1 md:grid-cols-2`
- Build at mobile then add breakpoints, never desktop-first

---

*Convention analysis: 2026-09-28*
