---
phase: 01-shell-navigation-foundation
plan: 05
subsystem: ui
tags: [tanstack-router, routing, shell, adr-0006, discover]

# Dependency graph
requires:
  - phase: 01-shell-navigation-foundation (plan 01-04)
    provides: "The _shell/_authed/s/$slug/_member route chain and PublicShell/AppShell layouts every route in this plan mounts under"
provides:
  - "Public Pitch (/startup/$slug), profile (/u/$username), Discover (/discover) and Accept Invite (/invite/$token) all render inside the _shell layout chain, chrome supplied once by PublicShell/AppShell"
  - "Discover as its own frontend-only surface (src/features/discover/) per ADR 0006, replacing marketing/explore; the /explore URL is gone"
  - "PublicHeader restyled with a Discover link and a Sign in button wired to useGoogleSignIn"
  - "PublicOpenings' signed-in Trial Cycle link uses the /s/$slug/trials/$trialCycleId scheme"
affects: [01-06 (desktop sidebar), 01-07 (mobile shell), 01-08 (removes the old /app tree, including /app/explore which still renders DiscoverPage until then), 05-marketing-and-billing (Discover's Trial Cycles/Startups/Contributors tab merge)]

actuals:
  tokens: 11060
  tasks: 3
  commits: 4
  plan_head_before: b1c089c09874ca7662864a191140103ba2e8f752
  plan_head_after: fae3a5dd97cd443bf219da47126ef66d59288598

tech-stack:
  added: []
  patterns:
    - "Public pages no longer render their own PublicHeader/min-h-dvh wrapper — _shell (PublicShell/AppShell) is the only chrome source, per ADR 0006"
    - "A page moved to pages/ that needs the Startup's slug for an internal link (PublicOpenings) takes it as an explicit prop rather than re-deriving it, keeping the slug-scoped URL scheme consistent"

key-files:
  created:
    - src/features/discover/pages/DiscoverPage.tsx
    - src/features/discover/hooks/useDiscoverStartups.ts
    - src/features/discover/hooks/useContributors.ts
    - src/features/teams/startup/public/pages/PublicStartupPage.tsx
    - src/features/people/profile/pages/PublicProfilePage.tsx
    - src/features/teams/team/pages/InviteAcceptPage.tsx
    - src/routes/_shell/startup/$slug.tsx
    - src/routes/_shell/u/$username.tsx
    - src/routes/_shell/invite/$token.tsx
  modified:
    - src/components/shared/PublicHeader.tsx
    - src/features/teams/startup/public/components/PublicOpenings.tsx
    - src/routes/_shell/discover/index.tsx
    - src/routes/app/explore/index.tsx
    - src/routeTree.gen.ts

key-decisions:
  - "PublicOpenings gained a required slug prop instead of deriving it from context, so its Trial Cycle Link can build /s/$slug/trials/$trialCycleId directly, matching the scheme plan 01-04 established"
  - "src/routes/app/explore/index.tsx keeps rendering DiscoverPage (not deleted) since plan 01-08 owns removing the old /app tree; only the top-level /explore route is deleted here"

requirements-completed: [SHELL-03, SHELL-06]

coverage:
  - id: D1
    description: "A signed-in User opens the Pitch, a profile, Discover and Accept Invite inside the app shell, with no second header on the page"
    requirement: "SHELL-03"
    verification:
      - kind: other
        ref: "grep -rn PublicHeader src/features returns nothing; pnpm build clean (routeTree regenerated, no duplicate-route errors)"
        status: pass
    human_judgment: true
    rationale: "Confirming the AppShell chrome actually renders (not a blank/duplicate frame) for a signed-in User needs a live browser session — no UI test harness exists per CLAUDE.md"
  - id: D2
    description: "A signed-out visitor sees the same four pages under a simple public header: Engin wordmark, Discover link and a Sign in button that starts Google sign-in"
    requirement: "SHELL-03"
    verification:
      - kind: other
        ref: "grep for useGoogleSignIn/Sign in/to=\"/discover\" in PublicHeader.tsx; pnpm check-types clean"
        status: pass
    human_judgment: true
    rationale: "Visual confirmation of the restyled header and a real Google OAuth round-trip need a browser session"
  - id: D3
    description: "Discover lives at /discover as a frontend-only surface (src/features/discover/); the old /explore URL no longer exists"
    requirement: "SHELL-06"
    verification:
      - kind: other
        ref: "src/features/marketing/explore does not exist; src/routes/explore/index.tsx does not exist; grep -n \"'/explore/'\" src/routeTree.gen.ts matches only the still-mounted /app/explore/ id, not a top-level /explore route; grep -rn 'to=\"/explore\"' src returns nothing"
        status: pass
    human_judgment: false
  - id: D4
    description: "On a Pitch, a signed-in User's Trial Cycle link opens /s/$slug/trials/$trialCycleId"
    requirement: "SHELL-03"
    verification:
      - kind: other
        ref: "grep -n 'to=\"/s/$slug/trials/$trialCycleId\"' src/features/teams/startup/public/components/PublicOpenings.tsx"
        status: pass
    human_judgment: false
  - id: D5
    description: "E11 overflow backstop: at 360px width the public header does not wrap or overflow horizontally"
    verification: []
    human_judgment: true
    rationale: "Backstop truth explicitly requires visual evidence at a specific viewport width — no automated check can confirm layout wrapping"

duration: 45min
completed: 2026-09-29
status: complete
---

# Phase 1 Plan 5: Public Pages Move Into the Shell Summary

**The public Pitch, profile, Discover and Accept Invite pages now render once inside `_shell`'s chrome instead of drawing their own `PublicHeader`; Discover moves to `src/features/discover/` per ADR 0006 and `/explore` is gone; `PublicHeader` gets a restyled Discover link and a working Sign in button.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-09-29T~10:00 (approx.)
- **Completed:** 2026-09-29T~10:45 (approx.)
- **Tasks:** 3
- **Files modified:** 14 (9 created/moved, 5 modified)

## Accomplishments

- `/startup/$slug` moved under `_shell` (`createFileRoute("/_shell/startup/$slug")`); `PublicStartupPage` moved `ui/` → `pages/`, dropped its own `PublicHeader`/`min-h-dvh` wrapper, and its "Back to Explore" link now reads "Back to Discover" (`to="/discover"`).
- `PublicOpenings` takes a new `slug` prop; its signed-in Trial Cycle link now points at `/s/$slug/trials/$trialCycleId`, matching the notification-link scheme from plan 01-02/01-04.
- `PublicHeader` restyled to spec: `h-14` row, Engin wordmark left, a `Discover` link and a primary "Sign in" button (calls `signInWithGoogle` from `useGoogleSignIn`, disabled while pending) right, `whitespace-nowrap` throughout for the 360px overflow backstop.
- `src/features/discover/` created per ADR 0006: `DiscoverPage` (renamed from `ExplorePage`, `inApp`/`PublicHeader` branch removed, `<h1>` now reads "Discover"), `useDiscoverStartups` (renamed from `useExplore`), and `useContributors`. `src/features/marketing/explore/` is gone.
- `/_shell/discover/` and the still-mounted `/app/explore/` both render `DiscoverPage` from its new path; `src/routes/explore/index.tsx` is deleted (nothing links to it after 01-04 and this plan's Task 1 retargeted their `/explore` links to `/discover`).
- `/u/$username` and `/invite/$token` moved under `_shell` (ids `/_shell/u/$username`, `/_shell/invite/$token`); `PublicProfilePage` and `InviteAcceptPage` moved `ui/` → `pages/`. `PublicProfilePage` dropped its `PublicHeader`/`min-h-dvh` wrapper; `InviteAcceptPage`'s three centred containers use `py-10` instead of `min-h-dvh` so the page sits inside the shell's `<main>` instead of forcing a second full-viewport height.
- `pnpm build` and `pnpm check` are clean; the route tree contains all three new `_shell` public routes and no top-level `/explore` route.

## Task Commits

Each task was committed atomically:

1. **Task 1: A Pitch opens inside the shell for signed-in Users and under the public header for visitors** (tracer) - `5470988` (feat) — tracer feedback gate re-verified (`pnpm build` + `pnpm check-types`) before expansion, per checkpoint row 3 (interactive/end-of-phase, automated-only verify).
2. **Task 2: Discover becomes its own frontend-only surface at /discover; /explore is gone** - `b47d7a3` (feat), fixed by `da4da65` (fix) — see Deviations.
3. **Task 3: Profiles and Invite acceptance open inside the shell** - `fae3a5d` (feat)

**Plan metadata:** committed separately after this summary.

## Files Created/Modified

- `src/routes/_shell/startup/$slug.tsx`, `src/routes/_shell/u/$username.tsx`, `src/routes/_shell/invite/$token.tsx` - moved routes, ids updated to `_shell`, URLs unchanged
- `src/features/teams/startup/public/pages/PublicStartupPage.tsx` - `ui/` → `pages/`, no own header, "Back to Discover"
- `src/features/teams/startup/public/components/PublicOpenings.tsx` - `slug` prop, `/s/$slug/trials/$trialCycleId` link
- `src/components/shared/PublicHeader.tsx` - restyled, `useGoogleSignIn`-wired Sign in button
- `src/features/discover/pages/DiscoverPage.tsx`, `hooks/useDiscoverStartups.ts`, `hooks/useContributors.ts` - new frontend-only surface (ADR 0006)
- `src/routes/_shell/discover/index.tsx`, `src/routes/app/explore/index.tsx` - both render `DiscoverPage` from its new path
- `src/features/people/profile/pages/PublicProfilePage.tsx`, `src/features/teams/team/pages/InviteAcceptPage.tsx` - `ui/` → `pages/`, no own header / `py-10` instead of `min-h-dvh`
- `src/routeTree.gen.ts` - regenerated by `pnpm build`, never hand-edited

## Decisions Made

- `PublicOpenings` takes `slug` as an explicit prop rather than deriving it, since the component only has the `startupId`/`isAuthenticated` context otherwise and the Trial Cycle link needs the slug for the URL.
- `src/routes/app/explore/index.tsx` was updated in place (not deleted) — the plan's own scope keeps the old `/app` tree compiling until plan 01-08 removes it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task 2's first commit landed with stale content**
- **Found during:** Post-commit verification after Task 2 (`git diff HEAD~1 HEAD` review)
- **Issue:** `git mv` stages a rename immediately; the subsequent `Write` edits to `DiscoverPage.tsx` and `useDiscoverStartups.ts` (export renames, `inApp`/`PublicHeader` removal, h1 copy) were not re-staged before running `git add` a second time (a first attempt failed atomically on an already-deleted pathspec and silently staged nothing), so commit `b47d7a3` recorded the renamed *files* but with their pre-edit content (`ExplorePage`/`useExplore` still present) — a state that would have broken the app despite `pnpm build` passing against the working tree.
- **Fix:** Diffed `HEAD` against the working tree, confirmed the discrepancy, staged the missed content (`useDiscoverStartups.ts`, `DiscoverPage.tsx`) and committed the fix.
- **Files modified:** `src/features/discover/hooks/useDiscoverStartups.ts`, `src/features/discover/pages/DiscoverPage.tsx`
- **Verification:** `git diff HEAD` empty afterward; `pnpm build` and `pnpm check-types` re-run clean against the corrected `HEAD`
- **Committed in:** `da4da65` (fix, immediately following Task 2's commit)

---

**Total deviations:** 1 auto-fixed (1 bug, self-introduced during execution, caught by post-commit verification before proceeding)
**Impact on plan:** No change to what the plan specified — the final committed state matches the plan's intent exactly; the deviation is a staging-process bug in this execution, not a plan or design issue.

## Issues Encountered

None beyond the deviation above. `pnpm check`'s `biome format --write` pass reformatted `PublicStartupPage.tsx` (Task 1's file, committed in `5470988`) as part of Task 3's `pnpm check` run — indentation left over from that earlier edit, no logic change, folded into Task 3's commit since that's what triggered the reformat. The pre-existing unused-parameter warning in `convex/test.helpers.ts::cyclePulseFor` (flagged in 01-03/01-04's SUMMARYs) resurfaced as a warning again, produced no file change, and is unrelated to this plan's files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All four public pages (Pitch, profile, Discover, Accept Invite) render inside `_shell`'s chrome; `pnpm build` and `pnpm check` are clean.
- Plan 01-06 can mount the desktop sidebar into `AppShell`'s now-empty outer row; plan 01-07 mounts the mobile shell; plan 01-08 removes the old `/app` tree (including `/app/explore`, still pointed at `DiscoverPage` by this plan) and the old `getWorkspace`/`setActive` callers.
- Manual verification (signed-in vs. signed-out chrome for all four pages, the 360px E11 overflow backstop) is deferred to `/gsd-verify-work` per this plan's `<verification>` block — no blockers, just unexercised by this plan's own automated checks.

---
*Phase: 01-shell-navigation-foundation*
*Completed: 2026-09-29*

## Self-Check: PASSED

- FOUND: src/features/discover/pages/DiscoverPage.tsx, hooks/useDiscoverStartups.ts, hooks/useContributors.ts
- FOUND: src/features/teams/startup/public/pages/PublicStartupPage.tsx, src/features/people/profile/pages/PublicProfilePage.tsx, src/features/teams/team/pages/InviteAcceptPage.tsx
- FOUND: src/routes/_shell/startup/$slug.tsx, src/routes/_shell/u/$username.tsx, src/routes/_shell/invite/$token.tsx
- FOUND commits 5470988, b47d7a3, da4da65, fae3a5d (all present in `git log --oneline`)
- Re-ran `pnpm build` (clean) and `pnpm check` (exit 0) immediately before writing this summary
- All acceptance criteria from all 3 tasks re-verified via grep/build/check commands during execution
- `git status --short` shows no uncommitted changes to any file this plan touched (only pre-existing, unrelated working-tree state: deleted CONTEXT.md/docs/agents/*.md, untracked .gsd/ and .planning/{config,milestone.lock,state}.json)
