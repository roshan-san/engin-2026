---
last_mapped_commit: 63da4c34dd0df46fd780733eaefce3afb95f98e3
last_mapped_at: 2026-09-28
---
<!-- refreshed: 2026-09-28 -->

# Architecture

**Analysis Date:** 2026-09-28

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Frontend Shell Layer                                 │
│  `src/features/app/layout/AppShell` - Sidebar, header, startup switcher,    │
│  navigation bar, notification bell, command palette (TanStack Router)       │
├────────────────────┬────────────────────┬────────────────────────────────────┤
│   People Domain    │   Teams Domain     │   Hiring Domain                    │
│ `src/features/     │ `src/features/     │ `src/features/hiring/`             │
│  people/`          │  teams/`           │ - roles, trialCycles,              │
│ - auth, profile    │ - startup          │   opportunities, offers, messages  │
│                    │   (public/ws)      │                                    │
│                    │ - team mgmt        │                                    │
└────────────────────┴────────────────────┴────────────────────────────────────┘
         │                    │                         │
         │                    │                         │
         ▼                    ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              Work Domain                                                     │
│         `src/features/work/`                                                │
│      - cycles (Cycle kanban)                                                │
│      - pulses (Pulse kanban)                                                │
│      - My Pulses (aggregate across Startups/Trials)                         │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │ useQuery(api.<domain>.<file>.<fn>, args)
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Convex Backend Layer                                 │
│                      (Database, Auth, RPC)                                  │
├───────────────────┬──────────────────┬──────────────────┬───────────────────┤
│  convex/people/   │ convex/teams/    │ convex/hiring/   │ convex/work/      │
│ - users.ts        │ - startups.ts    │ - trialCycles.ts │ - cycles.ts       │
│ - billing.ts      │ - team.ts        │ - roles.ts       │ - pulses.ts       │
│                   │ - invites (lib/)  │ - offers.ts      │ - boards.ts (lib/)│
│                   │                  │ - verdicts.ts    │                   │
│                   │                  │ - applications.ts│                   │
│                   │                  │ - challenges.ts  │                   │
│                   │                  │ - messages.ts    │                   │
└───────────────────┴──────────────────┴──────────────────┴───────────────────┘
         │
         ├─→ convex/lib/auth.ts (requireUserId, requireMembership, etc.)
         ├─→ convex/lib/teams/membership.ts (role checks)
         ├─→ convex/lib/hiring/trialCycles.ts (trial access + transitions)
         ├─→ convex/lib/work/cycles.ts (cycle access)
         ├─→ convex/lib/work/pulses.ts (pulse authorization)
         ├─→ convex/lib/notify.ts (notifications)
         ├─→ convex/lib/activity.ts (append-only events)
         └─→ convex/lib/reputation/score.ts (reputation calculation)
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Database Layer                                    │
│              convex/schema.ts (Table definitions)                            │
│  - users, startups, memberships, invites (teams)                            │
│  - roles, trialCycles, applications, entries, verdicts, offers (hiring)     │
│  - challenges, threads, submissions, announcements (trial work)             │
│  - cycles, cycleMembers, pulses, boards (internal work)                     │
│  - notifications, activity (cross-cutting)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| AppShell | Header, sidebar nav, startup switcher, user menu, notifications, score display | `src/features/app/layout/AppShell.tsx` |
| AppNav | Navigation between domains and personal areas (Inbox, My Pulses, Threads) | `src/features/app/layout/AppNav.tsx` |
| Auth Provider | Convex auth wrapper with Google sign-in, session management | `src/features/people/auth/providers/AppProviders.tsx` |
| Profile Pages | Public profile, editable profile, proof of work, reputation display | `src/features/people/profile/` |
| Startup Pages | Public Pitch, workspace dashboard (Roles, Trials, Activity) | `src/features/teams/startup/{public,workspace}/` |
| Trial Cycle UI | Trial setup, Participant Boards (kanban), Challenges, Threads, Verdicts | `src/features/hiring/trialCycles/` |
| Cycle UI | Cycle kanban, Pulse management, review workflow | `src/features/work/cycles/` |
| Pulse Board | My Pulses aggregate view, kanban for Cycle/Trial Pulses | `src/features/work/pulses/` |
| Discover | Public browse of open Trials, Startups, Contributors | `src/features/marketing/explore/` |
| Auth API | User creation, OAuth tokens, session refresh | `convex/people/users.ts` |
| Startup API | CRUD, publishing Pitch, workspace load | `convex/teams/startups.ts` |
| Trial Cycle API | Create, start (scheduler), close with Verdicts, list, access control | `convex/hiring/trialCycles.ts` |
| Pulse API | CRUD, status transitions, assignment, verification | `convex/work/pulses.ts` |
| Cycle API | CRUD, member management, auto-start (scheduler) | `convex/work/cycles.ts` |
| Membership Logic | Role checks, Founder/Member access, Invite acceptance | `convex/lib/teams/membership.ts` |
| Notification Logic | Create notifications (kind: invite, pulse, offer, etc.), mark read | `convex/lib/notify.ts`, `convex/notifications.ts` |
| Score Calculation | Trial Cycle outcomes → Score recompute, weights and history | `convex/lib/reputation/score.ts` |
| Activity Log | Append-only Startup events (member_joined, cycle_started, pulse_verified, etc.) | `convex/lib/activity.ts` |

## Pattern Overview

**Overall:** Domain-Grouped Mirrored Architecture

**Key Characteristics:**
- Frontend domains (`src/features/`) mirror backend domains (`convex/`)
- Thin routes delegate to feature pages; pages are composed of hooks + components
- Every backend function starts with auth (`requireUserId`), then context-specific authorization
- URL carries the Startup context (`/app/startup/$slug/...`); personal areas (Inbox, My Pulses) span all Startups
- Kanban-driven UI for both internal work (Cycles) and trial work (Participant Boards)
- Append-only Activity log for audit trail and Public Stats
- Time-based transitions (Trial Cycle start/end, Cycle auto-start) scheduled via `ctx.scheduler`
- All data queries use indexed `withIndex()` calls, no unindexed filters

## Layers

**Presentation (Frontend - React):**
- Purpose: UI rendering, user interaction, form handling, state management via hooks
- Location: `src/`
- Contains: Page components (`ui/`), reusable components, hooks, validation schemas
- Depends on: Convex API (`@convex/_generated/api`), shadcn/ui primitives, TanStack Router
- Used by: Browser (Vite SPA)

**API Gateway (Convex Functions):**
- Purpose: Authentication, authorization, business logic, database transactions
- Location: `convex/<domain>/` (public) and `convex/lib/` (internal)
- Contains: Query/Mutation handlers, validation, error handling
- Depends on: Convex database, scheduler, auth system, notification/activity systems
- Used by: Frontend via RPC calls to `api.<domain>.<file>.<fn>`

**Authorization Layer:**
- Purpose: Context-specific access control (membership, roles, trial participation, cycle membership)
- Location: `convex/lib/teams/membership.ts`, `convex/lib/hiring/trialCycles.ts`, `convex/lib/work/cycles.ts`, `convex/lib/work/pulses.ts`
- Contains: Helper functions that check user role/membership before allowing operations
- Pattern: Thrown errors block execution; successful return signals authorization

**Side Effects (Cross-Domain):**
- Purpose: Notifications, event logging, reputation updates
- Location: `convex/lib/notify.ts`, `convex/lib/activity.ts`, `convex/lib/reputation/`
- Contains: Helper functions called by domain functions
- Dependencies: Every domain may call `notify()` or `logActivity()`

**Database Layer:**
- Purpose: Schema definition, indexes, persistence
- Location: `convex/schema.ts`
- Contains: Table definitions for users, startups, memberships, pulses, cycles, trials, notifications, activity
- Accessed via: `ctx.db.query()`, `ctx.db.get()`, `ctx.db.insert()`, `ctx.db.patch()`, `ctx.db.delete()`

## Data Flow

### Primary Request Path: Work a Cycle's Pulses

1. `/app` (`src/routes/app/index.tsx`) renders `CyclePage` (`src/features/work/cycles/ui/CyclePage.tsx`) for the active Startup. `/app/work` just redirects to `/app`.
2. `useCyclePulses` (`src/features/work/cycles/hooks/useCyclePulses.ts`) calls `useQuery(api.work.pulses.listForCycle, { cycleId })`.
3. `listForCycle` (`convex/work/pulses.ts`) calls `requireUserId`, then `requireCycleAccess` (`convex/lib/work/cycles.ts`, Founder or Cycle Member). It reads `pulses` via the `by_cycle` index and attaches assignees.
4. Moving a card calls `api.work.pulses.setStatus`:
   - It authorizes through `requireWorkablePulse` (`convex/lib/work/pulses.ts`), the shared seam for Cycle and Board Pulses.
   - A Cycle Pulse can't be set to `done` (only a Founder's `verify` can do that). Moving it to `review` calls `notifyFounders()`.
5. The Founder's `api.work.pulses.verify` / `reject` go through `requireSubmittedPulse`. `verify` logs `pulse_verified` via `logActivity()`.
6. Convex's reactive queries push the new state to every subscribed client. The client has no manual refetch or store.

### Secondary: Trial Cycle Starts (Time-Based)

1. `api.hiring.trialCycles.create` (`convex/hiring/trialCycles.ts`) inserts the Trial Cycle with `status: "open"` and schedules `internal.hiring.trialCycles.start` with `ctx.scheduler.runAt(args.startsAt, …)`.
2. `start` (internal mutation) returns early unless the status is still `open`, which makes it safe after a cancel. It then calls `startTrial` (`convex/lib/hiring/trialCycles.ts`), which:
   - rejects still-pending (`applied`) applications and notifies those applicants
   - cancels the Trial Cycle and notifies Founders if `participantCount === 0`
   - otherwise sets `active`, seeds each Participant's Board from the Challenges (`seedBoards` in `convex/lib/hiring/challenges.ts`) and notifies Participants
3. `start` logs `trial_cycle_started`.
4. Participants open `/app/trials/$trialCycleId` (`TrialDetailPage`). `PulseBoard` (`src/features/work/pulses/components/PulseBoard.tsx`) reads `api.work.pulses.listBoard`, which uses `requireBoardAccess` and the `by_trial_and_participant` index. Board Pulses skip the `review` step.

### Tertiary: Verdicts and Score

1. A Founder closes an active Trial Cycle with a Verdict per Participant (`passed_with_offer` | `passed` | `not_passed`): `api.hiring.trialCycles.close` → `closeWithVerdicts` (`convex/lib/hiring/verdicts.ts`).
2. In one transaction `closeWithVerdicts`:
   - sets the Trial Cycle to `closed`
   - marks each Participant's application `completed` with its Verdict
   - inserts a `pending` Offer for `passed_with_offer`, which requires the Role to still be open
   - calls `refreshUserScore` and notifies the Participant
3. `refreshUserScore` (`convex/lib/reputation/score.ts`) loads evidence: memberships (Startups), passed Trial Cycles, left Trial Cycles and accepted Offers, each read with a capped `.take()`. It applies the weights in `convex/lib/reputation/scoreWeights.ts` and patches `users.score`.
4. The UI shows the new score through `api.people.users.getMe` in `ScoreChip` (`src/features/app/ui/ScoreChip.tsx`).

**State Management:**
- Frontend: `useQuery` for reads (cached in Convex client), `useMutation` for writes
- Backend: All mutations are transactional within a single `ctx` (Convex guarantees ACID)
- No client-side Redux/Zustand; all truth in database, frontend reads via queries

## Key Abstractions

**Membership:**
- Purpose: Represents a User's relationship to a Startup (Founder or Member)
- Examples: `convex/lib/teams/membership.ts`, `requireFounderMembership`, `requireMembership`
- Pattern: Authorization gates query/mutation with membership check; throws if unauthorized

**Pulse (Work Unit):**
- Purpose: Single unit of work on a Cycle's kanban or Participant's Board
- Examples: Internal Pulses (status: todo→in_progress→review→done), Board Pulses (Participant copies)
- Pattern: Every Pulse belongs to either a Cycle or a Trial Cycle's Board; cannot be orphaned

**Trial Cycle Lifecycle:**
- Purpose: Time-boxed hiring process with Participants, Challenges, Submissions, Verdicts, Offers
- Examples: `convex/hiring/trialCycles.ts`, `convex/lib/hiring/trialCycles.ts`
- Pattern: Auto-transitions via scheduler (open → active → closed); Founder-driven Verdicts close it

**Cycle Lifecycle:**
- Purpose: Internal work period with Members and Pulses
- Examples: `convex/work/cycles.ts`, `convex/lib/work/cycles.ts`
- Pattern: Auto-starts at start date; Founder manually closes with carry-over of unfinished Pulses

**Board (Participant's Workspace):**
- Purpose: Private kanban for one Participant in one Trial Cycle
- Examples: Pulses created from Challenges, Participant-editable, Submission linked
- Pattern: Seeded on Trial start; Participant owns kanban state; Founders see read-only view

**Notification:**
- Purpose: Alert a User to an event requiring action or awareness
- Examples: Offer received, Pulse comment, Verdict given, Cycle Member added
- Pattern: `notify(ctx, { userId, kind, title, href })` called by domain functions; read via `api.notifications.get()`

**Score:**
- Purpose: Public reputation derived from Trial Cycle outcomes
- Examples: +1 for passed Verdict, +1 for accepted Offer, -1 for Leaving, weighted by recency
- Pattern: Recomputed on Verdict/Offer/Leave; stored in `users.score`; never computed from internal work

## Entry Points

**Frontend:**
- Location: `src/routes/__root.tsx`
- Triggers: App load in browser
- Responsibilities: Mounts AppProviders (Convex auth, router), renders Outlet to matched route

**Public Unauthenticated Routes:**
- `/` → `LandingPage` (`src/features/marketing/landing/`)
- `/explore` → `DiscoverPage` (`src/features/marketing/explore/`)
- `/startup/$slug` → `PublicStartupPage` (`src/features/teams/startup/public/`)
- `/u/$username` → `PublicProfilePage` (`src/features/people/profile/`)
- `/invite/$token` → Invite acceptance flow

**Authenticated Routes:**
- `/app` → `AppLayout` + `AppShell` (guards with `useConvexAuth()`)
- `/app/startup/$slug/*` → Workspace pages (Roles, Trials, Team, Activity Dashboard)
- `/app/team` → Manage Startup members, invites
- `/app/work/cycles` → Cycle list
- `/app/work/cycles/$cycleId` → Cycle kanban
- `/app/pulses` → My Pulses (all Startups + Trials)
- `/app/messages` → Threads (Trial Cycle conversations)
- `/app/profile` → Edit user profile
- `/app/opportunities` → Applications and offers

**Backend:**
- Entry point: Convex deployment (HTTP + WebSocket from `convex/http.ts`)
- Triggers: Frontend RPC call to `api.<domain>.<file>.<fn>(...args)`
- Handler: Function in `convex/<domain>/<file>.ts` or internal mutation/query in `convex/lib/`

## Architectural Constraints

- **Unauthenticated Functions:** Only public functions (e.g., `teams.startups.getPublic`, `hiring.opportunities.list`) omit auth checks; most data requires `requireUserId`
- **Founder Exclusivity:** Only Founders can create Cycles, Roles, Trial Cycles, give Verdicts, withdraw Offers, manage Invites; Members cannot
- **Single Focused Startup:** User has one active Startup at a time; switch via `api.teams.startups.setActive`. Inbox/My Pulses/Threads span all Startups
- **No Direct Applications:** Users cannot apply to Roles; they join through Trial Cycles (open admission) or Invites (direct Founder invitation)
- **Score Isolation:** Score counts only Trial outcomes, never internal work (Cycles/Pulses); this prevents Founder manipulation
- **Immutable Board:** Once a Trial Cycle starts, Challenge templates cannot change retroactively; existing Board Pulses are not affected
- **Verdict Locks Submission:** Once a Verdict is given or Trial end date passes, the Participant's Board and Submission are read-only
- **Indexes Required:** Every `ctx.db.query()` must use `.withIndex()` with an index defined in `schema.ts`; no unindexed full table scans
- **No Circular Imports:** Frontend path alias `~/*` (src/) does not leak into `convex/`; Convex uses `@convex/*` alias
- **Notifications Uni-Directional:** Notifications flow from backend to frontend; frontend cannot create notifications directly

## Anti-Patterns

### Unindexed Queries

**What happens:** A query like `ctx.db.query("pulses").filter(q => q.eq("cycleId", id))` runs without `.withIndex("by_cycle")`
**Why it's wrong:** Convex scans the entire `pulses` table, O(N), causing performance degradation as data grows
**Do this instead:** Define index in `convex/schema.ts`: `.index("by_cycle", ["cycleId"])`, then call `.withIndex("by_cycle", q => q.eq("cycleId", id))`

### Skipping Auth Checks

**What happens:** A mutation like `updatePulse` calls `ctx.db.get(pulseId)` and `ctx.db.patch()` without `requireUserId` or `requireCycleAccess`
**Why it's wrong:** Any authenticated user could mutate any Pulse, including ones in other Startups or Cycles they don't belong to
**Do this instead:** Every mutation starts with `const userId = await requireUserId(ctx)`, then `const { cycle } = await requireCycleAccess(ctx, pulseId.cycleId, userId)` (or equivalent for trial/membership)

### Denormalized Data Out of Sync

**What happens:** Caching a count like `role.filledHeadcount` in the Role document without updating it when an Offer is accepted
**Why it's wrong:** Over time, the stale count diverges from reality (Offers accepted but count not bumped), leading to bugs in "Role is full" checks
**Do this instead:** Compute counts on read via aggregation queries: `ctx.db.query("offers").withIndex("by_role_and_status", q => q.eq("roleId", roleId).eq("status", "accepted")).count()`

### Calling notify() Outside Transactions

**What happens:** `notify()` is called after `ctx.db.patch()` but in a try-catch that swallows errors
**Why it's wrong:** If `notify()` fails (unlikely but possible), the main operation succeeded, leaving Notification records orphaned and the user never alerted
**Do this instead:** Call `notify()` inside the mutation before returning; Convex rolls back both together if anything fails

### Frontend Performing Authorization

**What happens:** Checking `if (user.role === "founder")` on the frontend before showing a "Create Cycle" button
**Why it's wrong:** The button hides but the mutation is still callable from DevTools; anyone can send `api.work.cycles.create(...)`
**Do this instead:** Let the frontend check roles for UX (hide buttons), but the backend mutation must re-check: `await requireFounderMembership(ctx, startupId, userId)` throws if not a Founder

## Error Handling

**Strategy:** Synchronous exceptions propagate to frontend as Convex error objects

**Patterns:**
- Auth/authz failures throw with `throw new Error("Not authenticated")`, `throw new Error("You are not on this team")`, etc. — frontend receives these as `error.data.message` in `useQuery`/`useMutation`
- Validation errors throw with context-specific messages: `throw new Error("Cycle name must be 1-100 characters")`
- Not-found errors return null from queries, allowing frontend to render fallback UI (e.g., "Startup not found")
- Database errors (rare) naturally throw and are logged by Convex; frontend shows generic "Something went wrong"
- Time-based transitions (scheduler) catch errors and re-throw so Convex can retry; failed transitions are visible in Convex logs

## Cross-Cutting Concerns

**Logging:** No explicit logger; Convex logs `throw new Error()` calls and scheduler execution. Backend uses `console.log()` for debugging; logs appear in Convex console
**Validation:** Zod schemas in `src/features/<domain>/<feature>/schemas/` validate form inputs before mutation; backend re-validates using Convex `v.object()` validators
**Authentication:** `@convex-dev/auth` with Google sign-in; user created on first sign-in; `requireUserId` gate ensures only authenticated users access protected functions
**Authorization:** `requireMembership`, `requireFounderMembership` (teams), `requireTrialAccess` (hiring), `requireCycleAccess`, `requirePulse` variants (work) provide context-specific access checks
**Notifications:** `notify()` creates inbox entries; kinds = invite, pulse, cycle, trial_cycle, application, message, billing, offer; marked read via `api.notifications.markRead()`
**Rate Limiting:** `isProUser` checks `users.planTier`; numeric limits in `convex/lib/limits.ts` (e.g., `MAX_TRIAL_PARTICIPANTS`, `FREE_ACTIVE_TRIAL_APPLICATIONS`) enforced in mutations
**Audit Trail:** `logActivity()` appends immutable records; kinds = member_joined, cycle_started, pulse_verified, etc.; visible to Founders in Activity Dashboard (`src/features/teams/startup/workspace/components/ActivityDashboard.tsx`)

---

*Architecture analysis: 2026-09-28*
