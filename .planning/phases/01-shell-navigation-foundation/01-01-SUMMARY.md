---
phase: 01-shell-navigation-foundation
plan: 01
subsystem: teams
tags: [convex, focused-startup, plan-limits, backend]

requires: []
provides:
  - "api.teams.startups.getBySlug (Startup + caller's role + Plan block, in one call)"
  - "api.teams.startups.listMemberships (feeds the switcher/palette)"
  - "api.teams.startups.focus (mutation, renamed intent from setActive)"
  - "convex/lib/teams/plan.ts: loadStartupPlan, StartupPlan"
  - "convex/lib/limits.ts: PLAN_LIMITS, PlanLimits, MAX_PLAN_USAGE_SCAN"
  - "users.focusedStartupId (renamed from activeStartupId), cleared on membership removal"
affects: [02-my-pulses-and-cycles, 06-plan-and-billing]

actuals:
  tokens: 7056
  tasks: 3
  commits: 6
  plan_head_before: 46d971f2b9edb9a950f52fe20500c9e58625d97b
  plan_head_after: 869ba5c3ee34f58e4e91153af8bd7d1cfb883408

tech-stack:
  added: []
  patterns:
    - "getBySlug never throws on 'no such Startup' or 'not a Member' — both return null/role:null, so a non-Member can't distinguish Stealth from nonexistent (T-01-02)"
    - "Interim Plan derivation: any Founder with planTier 'pro' makes the Startup Pro until Phase 6 moves the Plan onto the Startup (A1, ADR-0005)"

key-files:
  created:
    - convex/lib/teams/plan.ts
    - convex/teams/members.test.ts
  modified:
    - convex/schema.ts
    - convex/teams/startups.ts
    - convex/people/users.ts
    - convex/lib/teams/invites.ts
    - convex/lib/limits.ts
    - convex/teams/members.ts
    - convex/teams/startups.test.ts
    - convex/teams/invitations.test.ts
    - convex/hiring/offers.test.ts

key-decisions:
  - "D-13 executed as a plain rename (users.activeStartupId -> users.focusedStartupId), no migration, all 6 call sites updated in one commit"
  - "setActive is kept alongside the new focus mutation (both patch focusedStartupId) since the old frontend still calls setActive until plan 01-08 removes it"
  - "A1: Startup tier is Pro when any Founder's planTier is 'pro' (interim derivation; Phase 6 swaps the source, not the shape)"

patterns-established:
  - "Pattern 1: getBySlug (query, member/non-member branch) + focus (mutation) split — mirrors the existing getWorkspace/setActive split, since Convex queries can't write"
  - "Pattern 2: Plan usage counted only through withIndex reads bounded by MAX_PLAN_USAGE_SCAN, never .filter() on a live query"

requirements-completed: [SHELL-07, SHELL-02]

coverage:
  - id: D1
    description: "getBySlug returns the Startup, caller's role, and Plan block in one call for Founders/Members; null/role:null for non-Members and unknown/case-mismatched slugs"
    requirement: "SHELL-07"
    verification:
      - kind: unit
        ref: "convex/teams/startups.test.ts#the Founder who creates Acme gets role founder and isFocused true"
        status: pass
      - kind: unit
        ref: "convex/teams/startups.test.ts#a Trial Cycle Participant who is not a Member gets role null and cannot focus"
        status: pass
      - kind: unit
        ref: "convex/teams/startups.test.ts#a non-Member gets null for a Stealth Startup, but a Member still sees it"
        status: pass
      - kind: unit
        ref: "convex/teams/startups.test.ts#getBySlug returns null for an unknown slug and does no case folding"
        status: pass
      - kind: unit
        ref: "convex/teams/startups.test.ts#two Startups named Acme get distinct slugs and getBySlug matches exactly"
        status: pass
    human_judgment: false
  - id: D2
    description: "listMemberships lists every Startup the caller belongs to, ordered by name then slug, with isFocused"
    requirement: "SHELL-01"
    verification:
      - kind: unit
        ref: "convex/teams/startups.test.ts#listMemberships lists every Startup in name order with roles and isFocused"
        status: pass
      - kind: unit
        ref: "convex/teams/startups.test.ts#a User with no Startups gets an empty memberships list"
        status: pass
    human_judgment: false
  - id: D3
    description: "focus mutation sets focusedStartupId for Members, is idempotent, and throws for non-Members"
    requirement: "SHELL-02"
    verification:
      - kind: unit
        ref: "convex/teams/startups.test.ts#a Member sees role member, then isFocused true after focusing"
        status: pass
      - kind: unit
        ref: "convex/teams/startups.test.ts#focusing the same Startup twice does not throw and leaves the field unchanged"
        status: pass
    human_judgment: false
  - id: D4
    description: "The Startup Plan block (tier, limits, usage) is derived correctly for Free and Pro, and withheld from non-Members"
    requirement: "SHELL-07"
    verification:
      - kind: unit
        ref: "convex/teams/startups.test.ts#getBySlug's Plan block reports Free limits and correct usage"
        status: pass
      - kind: unit
        ref: "convex/teams/startups.test.ts#a pending Offer counts toward Plan usage.members"
        status: pass
      - kind: unit
        ref: "convex/teams/startups.test.ts#a pending founder Invite does not count toward Plan usage.members"
        status: pass
      - kind: unit
        ref: "convex/teams/startups.test.ts#a Pro Founder's Startup reports Pro limits"
        status: pass
      - kind: unit
        ref: "convex/teams/startups.test.ts#Plan usage.stealth reflects a non-public Startup"
        status: pass
      - kind: unit
        ref: "convex/teams/startups.test.ts#a fresh Startup with nothing else reports zero Plan usage"
        status: pass
      - kind: unit
        ref: "convex/teams/startups.test.ts#a non-Member of a public Startup gets plan null"
        status: pass
    human_judgment: false
  - id: D5
    description: "Removing a Member clears their Focused Startup when it pointed at the Startup they left, and leaves it alone otherwise"
    requirement: "SHELL-07"
    verification:
      - kind: unit
        ref: "convex/teams/members.test.ts#removing a Member clears their Focused Startup"
        status: pass
      - kind: unit
        ref: "convex/teams/members.test.ts#removing a Member from a Startup they're not focused on leaves their Focused Startup unchanged"
        status: pass
    human_judgment: false

duration: 30min
completed: 2026-09-28
status: complete
---

# Phase 1 Plan 1: Focused Startup backend Summary

**Startup-by-slug lookup with role and a final-shape Plan block (tier/limits/usage), a memberships list for the switcher, and the `activeStartupId` -> `focusedStartupId` rename with clear-on-removal — all TDD, 122/122 backend tests green.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-09-28T15:45:00+05:30 (approx.)
- **Completed:** 2026-09-28T21:29:21+05:30
- **Tasks:** 3
- **Files modified:** 11 (2 created, 9 modified)

## Accomplishments

- `api.teams.startups.getBySlug` resolves a Startup by slug for the future `/s/$slug` route: Founders/Members get the full doc plus role, isFocused and the Plan block; non-Members of a public Startup get `{ startup: {_id,name,slug}, role: null, isFocused: false, plan: null }`; a Stealth Startup and an unknown slug are indistinguishable (both `null`), closing the Information Disclosure threat (T-01-02)
- `api.teams.startups.listMemberships` returns every Startup the caller belongs to, sorted by name then slug for a stable switcher order (edge SHELL-01/ordering)
- `api.teams.startups.focus` sets `users.focusedStartupId` for a Member, is idempotent, and throws for non-Members (T-01-03)
- `users.activeStartupId` renamed to `users.focusedStartupId` (D-13) across all 6 call sites in one commit; `getWorkspace`/`setActive` (old frontend's current query/mutation) kept working, patched to the new field name, until plan 01-08 removes their last callers
- The Startup Plan block ships its Phase-6 final shape now: `{ tier, limits, usage }`, derived from any Founder's `planTier` (A1), with Free/Pro limits in a new dependency-free `convex/lib/limits.ts` export (`PLAN_LIMITS`) and usage counted entirely through `withIndex` reads (open Roles, live Trial Cycles, Members + pending Member Invites + pending Offers, Stealth)
- `convex/teams/members.ts`'s `remove` mutation clears a removed Member's `focusedStartupId` when it pointed at the Startup they just left (T-01-05), and two test helpers (`invitations.test.ts`, `offers.test.ts`) moved off the hidden-state `getWorkspace` query onto `listMemberships`

## Task Commits

Each task followed the RED-GREEN TDD cycle (no REFACTOR commits were needed — implementations were clean on first pass):

1. **Task 1: Focus a Startup and read it back by slug and in the memberships list**
   - `2fbb2fb` test(01-01): add failing tests for Startup-by-slug, memberships, and focus
   - `fc806a0` feat(01-01): rename Focused Startup field, add getBySlug/listMemberships/focus
2. **Task 2: The Startup's Plan block — tier, limits and usage for Members only**
   - `f07b9be` test(01-01): add failing tests for the Startup Plan block
   - `d80739e` feat(01-01): add the Startup Plan block (tier, limits, usage) to getBySlug
3. **Task 3: Removing a Member clears their Focused Startup; switcher-facing tests read listMemberships**
   - `7954a9e` test(01-01): add failing test for clearing Focused Startup on removal
   - `869ba5c` feat(01-01): clear a removed Member's Focused Startup, drop hidden-state helpers

**Plan metadata:** committed separately after this summary.

## Files Created/Modified

- `convex/lib/teams/plan.ts` (created) - `loadStartupPlan`/`StartupPlan`: derives tier from any Pro Founder, counts usage via indexed reads only
- `convex/teams/members.test.ts` (created) - clear-on-removal coverage
- `convex/schema.ts` - `users.focusedStartupId` rename; `by_startup_and_status` index added to `invites` and `offers`
- `convex/teams/startups.ts` - `loadWorkspace` renamed `loadMemberships` (tie-broken sort); added `listMemberships`, `focus`, `getBySlug`; `create`/`getWorkspace`/`setActive` patched to the renamed field
- `convex/people/users.ts` - `getMe` returns `focusedStartupId`
- `convex/lib/teams/invites.ts` - `redeemInvite` patches `focusedStartupId`
- `convex/lib/limits.ts` - added `PLAN_LIMITS`, `PlanLimits`, `MAX_PLAN_USAGE_SCAN` (dependency-free)
- `convex/teams/members.ts` - `remove` clears `focusedStartupId` on removal from the focused Startup
- `convex/teams/startups.test.ts` - 20 new test cases across both tasks
- `convex/teams/invitations.test.ts` - `workspaceNames` renamed `startupNames`, backed by `listMemberships`
- `convex/hiring/offers.test.ts` - `isMemberOf` backed by `listMemberships`

## Decisions Made

- Kept `setActive`/`getWorkspace` working (not deleted) since the current frontend still calls them; only `focus`/`listMemberships`/`getBySlug` are new, per the plan's explicit instruction that plan 01-08 removes the old pair's last callers
- Founders bound is `MAX_STARTUP_FOUNDERS` (existing constant, reused rather than adding a new one) for the tier-derivation read
- `plan.ts`'s one in-memory `.filter()` (on an already-bounded, already-fetched pending-invites array) is intentional — not a `.filter()` chained on a live Convex query

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. `pnpm check`'s formatting pass reformatted the touched files (whitespace/wrapping only, no logic changes); a pre-existing unused-parameter warning in `convex/test.helpers.ts::cyclePulseFor` (unrelated to this plan) surfaced but was left alone per the scope boundary (out-of-scope, pre-existing).

## User Setup Required

**One manual step before the next `pnpm dev:backend`.** See [01-USER-SETUP.md](./01-USER-SETUP.md): clear the old `activeStartupId` field from dev `users` documents (or reset dev data), since `convex dev` will refuse to push the renamed schema while a document still holds the removed field.

## Next Phase Readiness

- `getBySlug`, `listMemberships` and `focus` are ready for plan 01-04 (routing) to build `/s/$slug` against
- The Plan block's shape is final; Phase 6 swaps its data source, not its shape
- `pnpm test` (122/122), `tsc --noEmit`, and `pnpm check` are all clean
- No blockers for plan 01-02 (unrelated Convex modules, no shared files per `coupling_justified`)

---
*Phase: 01-shell-navigation-foundation*
*Completed: 2026-09-28*

## Self-Check: PASSED

- FOUND: convex/lib/teams/plan.ts
- FOUND: convex/teams/members.test.ts
- FOUND commit 2fbb2fb, fc806a0, f07b9be, d80739e, 7954a9e, 869ba5c (all present in `git log --oneline`)
- Re-ran `pnpm test` (122/122 passed), `pnpm exec tsc -p convex/tsconfig.json --noEmit` (clean), `pnpm check` (exit 0) immediately before writing this summary
- All acceptance criteria from all 3 tasks re-verified via grep/test commands during execution
