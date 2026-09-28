---
phase: 01-shell-navigation-foundation
plan: 08
subsystem: ui
tags: [tanstack-router, convex, adr-0006, routing-cleanup]

# Dependency graph
requires:
  - phase: 01-shell-navigation-foundation (plan 01-04)
    provides: "StartupRoute (useStartupRoute/member), the /_shell/_authed/s/$slug route id, AppShell's outer row"
  - phase: 01-shell-navigation-foundation (plan 01-06)
    provides: "useFocusedStartup, useCurrentUser, src/shell/nav.ts constants"
provides:
  - "The old /app app is fully removed: no /app route, no src/features/app/, no ui/ page directories left in src/features"
  - "convex/teams/startups.ts exposes exactly one Focused-Startup API: getBySlug, listMemberships, focus (getWorkspace and setActive deleted)"
  - "Create Startup, Accept Invite and Upgrade-checkout-return all land on the new URL scheme (/s/$slug/cycles, /my-pulses)"
  - "CreateStartupPage, PricingPage, LandingPage in pages/; GoogleButton in components/ (ADR 0006 folder layout complete)"
affects: [01-09 (edits DiscoverPage and shell chrome, none of which this plan touches — coupling_justified), Phase 2+ (My Pulses/Cycles/Hiring/Team rebuilds land in the now-empty pages/ slots this plan cleared)]

actuals:
  tokens: 58000
  tasks: 3
  commits: 3
  plan_head_before: fdeafa5d70806efeb310750b878e680e18ddd1e8
  plan_head_after: 6adfefdbf86e80c05d8d08d11513fb8317c804e8

tech-stack:
  added: []
  patterns:
    - "Founder-only 'create X' buttons on kept components (WorkspaceRoles, WorkspaceTrials) become an optional action?: React.ReactNode prop, since their target routes don't exist until Phase 4 (D-19) — the component renders a slot, the caller supplies the button"
    - "The Startup a kept hook needs comes from useStartupRoute()'s member (URL-scoped), never from a hidden-state workspace query — usePitchEditor, useTeamInvites and useActiveCycle all read the Startup this way now (ADR 0006)"

key-files:
  created:
    - src/features/teams/startup/public/pages/CreateStartupPage.tsx (moved from ui/)
    - src/features/marketing/pricing/pages/PricingPage.tsx (moved from ui/)
    - src/features/marketing/landing/pages/LandingPage.tsx (moved from ui/)
    - src/features/people/auth/components/GoogleButton.tsx (moved from ui/)
  modified:
    - src/features/teams/startup/public/hooks/useCreateStartupWizard.ts
    - src/features/teams/team/hooks/useAcceptInvite.ts
    - src/features/marketing/pricing/hooks/useUpgrade.ts
    - src/features/work/cycles/components/CycleGuest.tsx
    - src/features/teams/startup/workspace/components/WorkspaceRoles.tsx
    - src/features/teams/startup/workspace/components/WorkspaceTrials.tsx
    - src/features/teams/startup/workspace/hooks/usePitchEditor.ts
    - src/features/teams/team/hooks/useTeamInvites.ts
    - src/features/work/cycles/hooks/useActiveCycle.ts
    - src/features/people/profile/hooks/useProfileEditor.ts
    - convex/teams/startups.ts (getWorkspace and setActive deleted)
    - src/routeTree.gen.ts (regenerated, no /app routes)
  deleted:
    - src/routes/app/** (15 files: route.tsx, index.tsx, explore, messages, opportunities, profile, startup/index, startup/roles/new, startup/trials/new, startups/new, team, trials/$trialCycleId, trials/index, upgrade, work)
    - 10 ui/ page components rebuilt by later phases (D-10/D-11): MessagesPage, OpportunitiesPage, CreateRolePage, CreateTrialPage, TrialDetailPage, TrialsPage, EditProfilePage, PitchEditorPage, TeamPage, CyclePage
    - src/features/app/ (12 files: layout/AppLayout, AppNav, AppShell, BuildFrame, BuildNav; ui/NotificationBell, ScoreChip, StartupSwitcher, UserMenu; hooks/useCurrentUser, useNotifications, useWorkspace)

key-decisions:
  - "Two still-live /app routes (routes/app/startups/new.tsx, routes/app/upgrade/index.tsx) imported the ui/ paths Task 1 moved; repointed their imports to pages/ (Rule 3) rather than deleting them early, since Task 3 owns deleting the whole /app tree together"
  - "TrialsPage.tsx (deleted in Task 3) called WorkspaceTrials without the new required slug prop after Task 2's change; passed active.startup.slug so pnpm check-types stayed green until Task 3 removed the file (Rule 3)"
  - "WorkspaceRoles/WorkspaceTrials keep their old startupId/isFounder props exactly, only adding action (and slug on WorkspaceTrials) — minimizes churn for the later Hiring-screen callers that will supply the action button"

patterns-established:
  - "features/*/ui/ is gone project-wide; every feature's page components live in pages/ (ADR 0006 complete for Phase 1's scope)"

requirements-completed: [SHELL-06, SHELL-02]

coverage:
  - id: D1
    description: "Creating a Startup lands the User on /s/$slug/cycles with the new Startup already focused"
    requirement: "SHELL-02"
    verification:
      - kind: other
        ref: "grep for 'to: \"/s/$slug/cycles\"' in useCreateStartupWizard.ts + pnpm build + pnpm check-types"
        status: pass
    human_judgment: true
    rationale: "Confirming the Cycles stub actually renders with the Startup focused in the sidebar needs a live Convex dev deployment and browser interaction, per this plan's own <verification> block"
  - id: D2
    description: "Accepting an Invite and returning from checkout both land on /my-pulses"
    requirement: "SHELL-02"
    verification:
      - kind: other
        ref: "grep for 'to: \"/my-pulses\"' in useAcceptInvite.ts and '/my-pulses' in useUpgrade.ts + pnpm check-types"
        status: pass
    human_judgment: true
    rationale: "The redirect-after-accept and returnUrl behavior needs a real invite token and checkout round-trip to observe in a browser"
  - id: D3
    description: "CreateStartupPage, PricingPage and LandingPage moved into pages/, GoogleButton into components/, with all links repointed off /app"
    requirement: "SHELL-06"
    verification:
      - kind: other
        ref: "test -f for each new path + empty grep for old ui/ paths + grep -n rounded-2xl (empty) + pnpm build + pnpm check-types"
        status: pass
    human_judgment: false
  - id: D4
    description: "Kept components (CycleGuest, WorkspaceRoles, WorkspaceTrials) link only to routes that exist in the new tree"
    requirement: "SHELL-02"
    verification:
      - kind: other
        ref: "grep for the new to= targets in CycleGuest.tsx + grep -rn '\"/app' across src/features/{work,teams,marketing,people} (empty) + pnpm check-types"
        status: pass
    human_judgment: false
  - id: D5
    description: "The /app route tree, ten rebuilt-later page components, and the old src/features/app shell no longer exist; no features/*/ui/ directory remains"
    requirement: "SHELL-06"
    verification:
      - kind: other
        ref: "test ! -e src/routes/app && test ! -e src/features/app; find src/features -type d -name ui (empty); grep -rn '\"/app' src (empty, includes routeTree.gen.ts)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The backend exposes exactly one Focused-Startup API: getBySlug, listMemberships, focus. getWorkspace and setActive are deleted."
    requirement: "SHELL-02"
    verification:
      - kind: other
        ref: "grep -rnE 'getWorkspace|setActive' convex src (empty) + pnpm test (133/133 pass)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Kept hooks (usePitchEditor, useTeamInvites, useActiveCycle, useProfileEditor) compile against the new shell, sourcing the Startup from the URL via useStartupRoute rather than hidden state"
    requirement: "SHELL-06"
    verification:
      - kind: other
        ref: "pnpm check-types (clean) + pnpm check (clean) + pnpm test (133/133)"
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-09-29
status: complete
---

# Phase 1 Plan 8: Old /App Removal and No-`/app` URL Scheme Summary

**Deleted the entire old `/app` frontend (15 routes, 10 rebuilt-later pages, 12 old-shell files) and the hidden-state Startup backend (`getWorkspace`/`setActive`), retargeting Create Startup/Accept Invite/Upgrade to `/s/$slug/cycles` and `/my-pulses` and moving the last four kept pages/components into their ADR 0006 homes.**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-09-29T03:14:00+05:30 (approx.)
- **Completed:** 2026-09-29T03:27:38+05:30
- **Tasks:** 3
- **Files modified:** 59 (4 moved/renamed, 18 modified, 37 deleted)

## Accomplishments

- `useCreateStartupWizard.ts` now keeps `createStartup`'s result and navigates to `/s/$slug/cycles` with the new Startup already focused (#19 user story 50); `CreateStartupPage.tsx` moved `ui/` → `pages/` (D-12) and its Cancel link now goes to `/my-pulses`.
- `useAcceptInvite.ts` navigates to `/my-pulses` after acceptance (the invite's `redeemInvite` already focused the Startup, so the sidebar shows it); `useUpgrade.ts`'s `returnUrl` is now the fixed `${window.location.origin}/my-pulses` path (T-01-23, closing the open-redirect surface).
- `PricingPage.tsx` moved `ui/` → `pages/`; both "Back to Build" buttons became "Back to My Pulses" linking `/my-pulses`.
- `CycleGuest.tsx`'s Trial Cycle link now uses `/s/$slug/trials/$trialCycleId` with `item.startupSlug`; its two old Opportunities/Explore buttons collapsed into one "Find a Trial Cycle" link to `/discover`, and its create button now links `/startups/new`.
- `WorkspaceRoles`/`WorkspaceTrials` replaced their Founder-only create `Link`s (which pointed at routes that don't exist until Phase 4, D-19) with an optional `action?: React.ReactNode` prop; `WorkspaceTrials` also takes a `slug` prop for its typed Trial Cycle link.
- `LandingPage.tsx` moved into `pages/` and `GoogleButton.tsx` into `components/` (it's a component, not a page); `GoogleButton` dropped its `rounded-2xl` class (D-06 — the Button primitive is `rounded-md` since plan 01-03).
- Deleted, with `git rm` and no reads: the whole `src/routes/app/` tree (15 files), the ten `ui/` page components later phases rebuild, and `src/features/app/` (12 files) — its replacements have lived in `src/shell/` since plans 01-04/01-06/01-07. Removed the now-empty `features/*/ui/` directories (landing, pricing, auth, startup/public) and `features/hiring/messages/` (its only file was deleted).
- Repointed the kept hooks to the new shell: `usePitchEditor`/`useTeamInvites` swap `useWorkspace()` for `useStartupRoute()`'s `member`; `useActiveCycle` does the same plus `useFocusedStartup().hasStartups`; `useProfileEditor` imports `useCurrentUser` from `~/shell/hooks/useCurrentUser`.
- `convex/teams/startups.ts`: deleted the hidden-state `getWorkspace` query and the old `setActive` mutation (T-01-22) — `getBySlug`, `listMemberships` and `focus` are the only Focused-Startup API. `loadMemberships` stays because `listMemberships` uses it.
- `pnpm build` regenerated `src/routeTree.gen.ts` with zero `/app` routes; `pnpm check` and `pnpm test` (133/133) both pass clean.

## Task Commits

Each task was committed atomically:

1. **Task 1: Creating a Startup, accepting an Invite and upgrading all land on the new URLs** (tracer) - `333425d` (feat) — tracer feedback gate re-verified (`pnpm build` + `pnpm check-types`) before expansion, per checkpoint row 3 (interactive/end-of-phase, automated-only verify).
2. **Task 2: Kept components link to the new routes; the landing page and GoogleButton reach their ADR 0006 homes** - `143b60d` (feat)
3. **Task 3: Delete the old /app app, repoint kept hooks to the shell, and drop the hidden-state backend functions** - `6adfefd` (feat)

**Plan metadata:** committed separately after this summary.

## Files Created/Modified

- `src/features/teams/startup/public/pages/CreateStartupPage.tsx` - moved from `ui/`, Cancel now links `/my-pulses`
- `src/features/marketing/pricing/pages/PricingPage.tsx` - moved from `ui/`, both footer buttons link `/my-pulses`
- `src/features/marketing/landing/pages/LandingPage.tsx` - moved from `ui/`
- `src/features/people/auth/components/GoogleButton.tsx` - moved from `ui/`, dropped `rounded-2xl`
- `src/features/teams/startup/public/hooks/useCreateStartupWizard.ts` - navigates to `/s/$slug/cycles`
- `src/features/teams/team/hooks/useAcceptInvite.ts` - navigates to `/my-pulses`
- `src/features/marketing/pricing/hooks/useUpgrade.ts` - fixed `/my-pulses` returnUrl
- `src/features/work/cycles/components/CycleGuest.tsx` - new Trial Cycle/discover/create-startup links
- `src/features/teams/startup/workspace/components/WorkspaceRoles.tsx` - `action?` prop
- `src/features/teams/startup/workspace/components/WorkspaceTrials.tsx` - `action?`/`slug` props
- `src/features/teams/startup/workspace/hooks/usePitchEditor.ts` - reads `useStartupRoute()`
- `src/features/teams/team/hooks/useTeamInvites.ts` - reads `useStartupRoute()`
- `src/features/work/cycles/hooks/useActiveCycle.ts` - reads `useStartupRoute()` + `useFocusedStartup()`
- `src/features/people/profile/hooks/useProfileEditor.ts` - reads `~/shell/hooks/useCurrentUser`
- `convex/teams/startups.ts` - `getWorkspace`/`setActive` deleted
- `src/routeTree.gen.ts` - regenerated, no `/app` routes
- 37 files deleted (see frontmatter `key-files.deleted`)

## Decisions Made

- Two still-live `/app` routes (`routes/app/startups/new.tsx`, `routes/app/upgrade/index.tsx`) imported the `ui/` paths Task 1 moved out from under them; repointed their imports to `pages/` (Rule 3 — blocking import break) instead of deleting them in Task 1, since the plan's own scope note assigns all `/app` deletion to Task 3 together.
- `TrialsPage.tsx` (itself deleted in Task 3) called `WorkspaceTrials` without the new required `slug` prop after Task 2's change; passed `active.startup.slug` so `pnpm check-types` stayed green until Task 3 removed the file (Rule 3).
- `WorkspaceRoles`/`WorkspaceTrials` kept their existing `startupId`/`isFounder` props unchanged, only adding `action` (and `slug` on `WorkspaceTrials`), minimizing churn for the Phase 3/4 Hiring screens that will supply the action button.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Repointed two still-live /app routes' stale ui/ imports**
- **Found during:** Task 1 (`pnpm build` failed with `UNLOADABLE_DEPENDENCY`)
- **Issue:** `src/routes/app/startups/new.tsx` and `src/routes/app/upgrade/index.tsx` imported `CreateStartupPage`/`PricingPage` from their old `ui/` paths, which Task 1's `git mv` had just moved to `pages/`. These two files aren't in Task 1's `files_modified` list — the plan defers their deletion to Task 3 — but the broken import made Task 1's own `pnpm build` verify fail.
- **Fix:** Updated both imports to the new `pages/` paths. Both files are deleted wholesale in Task 3, so this is a minimal, temporary fix scoped to keeping the build green between tasks.
- **Files modified:** `src/routes/app/startups/new.tsx`, `src/routes/app/upgrade/index.tsx`
- **Verification:** `pnpm build` and `pnpm check-types` both pass after the fix.
- **Committed in:** `333425d` (Task 1 commit)

**2. [Rule 3 - Blocking] Passed WorkspaceTrials' new required `slug` prop at its one remaining old call site**
- **Found during:** Task 2 (would have failed Task 3's `pnpm check-types`, caught proactively during Task 2)
- **Issue:** `TrialsPage.tsx` (`src/features/hiring/trialCycles/ui/`) called `<WorkspaceTrials startupId={...} isFounder={...} />` without the `slug` prop Task 2 made required. `TrialsPage.tsx` is itself deleted in Task 3, but it still compiles until then.
- **Fix:** Added `slug={active.startup.slug}` to the call site (the full Startup doc, including `slug`, is already available via the old `useWorkspace()` shape this page still uses).
- **Files modified:** `src/features/hiring/trialCycles/ui/TrialsPage.tsx`
- **Verification:** `pnpm check-types` passes after the fix.
- **Committed in:** `143b60d` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 — blocking import/prop breaks caused by moving/changing files ahead of their callers' own scheduled deletion in Task 3)
**Impact on plan:** Both fixes are minimal, temporary repoints on files this same plan deletes in its final task. No scope creep; no behavior change beyond keeping the build/typecheck green between atomic task commits.

## Issues Encountered

None beyond the two deviations above, both anticipated by the plan's own `scope_note` ("typed links in the kept code only compile once the whole old tree is gone at once") but not fully accounted for in Task 1/2's own file lists.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `pnpm build`, `pnpm check` (exit 0) and `pnpm test` (133/133) are all clean.
- The frontend now matches ADR 0006 exactly for Phase 1's scope: `src/shell/` (frame), `features/<domain>/<feature>/pages/` (page components), `discover`/`marketing` (frontend-only). No `features/*/ui/` directory remains anywhere in `src`.
- `convex/teams/startups.ts` exposes exactly one Focused-Startup API (`getBySlug`, `listMemberships`, `focus`); the hidden-state `getWorkspace` query and old `setActive` mutation are gone (T-01-22 mitigated).
- Plan 01-09 (command palette) touches `DiscoverPage` and shell chrome only — no overlap with this plan's files, confirmed by this plan's own `coupling_justified` note.
- Manual verification (create a Startup and confirm the Cycles-stub landing with the sidebar focused; accept an Invite and confirm My Pulses landing with the new Startup focused; visit `/app` and confirm the not-found screen) is deferred to `/gsd-verify-work` per this plan's own `<verification>` block — no blockers, just unexercised by automated checks.

---
*Phase: 01-shell-navigation-foundation*
*Completed: 2026-09-29*

## Self-Check: PASSED

- FOUND: src/features/teams/startup/public/pages/CreateStartupPage.tsx, src/features/marketing/pricing/pages/PricingPage.tsx, src/features/marketing/landing/pages/LandingPage.tsx, src/features/people/auth/components/GoogleButton.tsx
- FOUND: src/features/teams/startup/workspace/hooks/usePitchEditor.ts, useTeamInvites.ts, useActiveCycle.ts, useProfileEditor.ts (all repointed to the new shell hooks)
- CONFIRMED ABSENT: src/routes/app, src/features/app, all 10 rebuilt-later ui/ pages, every features/*/ui/ directory
- FOUND commits 333425d, 143b60d, 6adfefd (all present in `git log --oneline`)
- Re-ran `pnpm build` (clean, no /app routes), `pnpm check-types` (clean), `pnpm check` (exit 0) and `pnpm test` (133/133) immediately before writing this summary
- All acceptance criteria from all three tasks re-verified via grep/build/typecheck/test commands during execution
- `git status --short` confirms only this plan's files changed; the user's pre-existing unrelated changes (deleted CONTEXT.md/docs/agents/*.md, untracked .gsd/.planning/*) are untouched
