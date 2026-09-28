---
phase: 01-shell-navigation-foundation
plan: 06
subsystem: ui
tags: [tanstack-router, shadcn-sidebar, convex, desktop-shell]

# Dependency graph
requires:
  - phase: 01-shell-navigation-foundation (plan 01-01)
    provides: "api.teams.startups.listMemberships (feeds the switcher), focusedStartupId"
  - phase: 01-shell-navigation-foundation (plan 01-03)
    provides: "shadcn sidebar primitive, dark-only tokens (--sidebar-*), soft-square avatars"
  - phase: 01-shell-navigation-foundation (plan 01-04)
    provides: "AppShell (empty outer row), the /_shell/_authed/s/$slug route id"
provides:
  - "AppSidebar: desktop sidebar (SHELL-01) — Inbox/My Pulses/Threads -> switcher + Cycles/Hiring/Team/Pitch/Activity -> Discover"
  - "useFocusedStartup: URL-first Focused Startup resolution for every shell component (01-07, 01-08, 01-09 consume it)"
  - "src/shell/nav.ts: PERSONAL_NAV/STARTUP_NAV/DISCOVER_NAV, the shared nav-item constants"
  - "AccountMenu + ScoreChip in the sidebar footer, no user-level Pro indicators (#19, ADR-0005)"
  - "Inbox unread badge that never reads as a false zero while loading"
affects: [01-07 (mobile shell/bottom tabs reuse nav.ts), 01-08 (deletes the old src/features/app switcher/menu/hooks), 01-09 (command palette reuses useFocusedStartup)]

actuals:
  tokens: 4529
  tasks: 2
  commits: 2
  plan_head_before: 94f434d6020ff69a630c0b5688e3105f3ac8b817
  plan_head_after: b5d2e4464b9555407b35b6bbc357bb670ac3bbec

tech-stack:
  added: []
  patterns:
    - "useFocusedStartup: the Focused Startup is resolved URL-first (useMatch on /_shell/_authed/s/$slug), then isFocused, then the first name-sorted membership — the sidebar always matches the screen (ADR 0006)"
    - "Selecting a Startup in the switcher only navigates; the /s/$slug layout's own effect (01-04) is the single place that calls the focus mutation"

key-files:
  created:
    - src/shell/hooks/useFocusedStartup.ts
    - src/shell/nav.ts
    - src/shell/sidebar/StartupAvatar.tsx
    - src/shell/sidebar/StartupSwitcher.tsx
    - src/shell/sidebar/AppSidebar.tsx
    - src/shell/hooks/useCurrentUser.ts
    - src/shell/hooks/useNotifications.ts
    - src/shell/account/ScoreChip.tsx
    - src/shell/account/AccountMenu.tsx
  modified:
    - src/shell/layout/AppShell.tsx

key-decisions:
  - "useFocusedStartup resolution order is URL slug -> isFocused -> list[0] (list is already name-sorted by listMemberships), matching edge SHELL-02/ordering exactly"
  - "StartupAvatar and AccountMenu's avatar are sized down (size-6) from the shared Avatar primitive's default size-8, to fit the h-8 sidebar row density (D-05)"
  - "ScoreChip dropped its Pro/isPro prop entirely rather than defaulting it — the old per-user Pro variant has no equivalent in the new shell (#19, ADR-0005)"

requirements-completed: [SHELL-01, SHELL-02, SHELL-04]

coverage:
  - id: D1
    description: "Desktop sidebar renders Inbox/My Pulses/Threads, then the switcher plus Cycles/Hiring/Team/Pitch/Activity, then Discover, with the active item getting a blue icon"
    requirement: "SHELL-01"
    verification:
      - kind: other
        ref: "grep for collapsible=\"none\"/PERSONAL_NAV/STARTUP_NAV/DISCOVER_NAV/StartupSwitcher in AppSidebar.tsx + pnpm check-types + pnpm check"
        status: pass
    human_judgment: true
    rationale: "The visual order, #16181C active fill and blue active icon can only be confirmed by loading the app signed-in with real Startup data in a browser — no UI test harness exists per CLAUDE.md"
  - id: D2
    description: "StartupSwitcher's loading/empty/populated branches (UI E1), including zero-one-many and long-name truncation"
    requirement: "SHELL-02"
    verification:
      - kind: other
        ref: "grep for 'h-8 w-24 rounded-md'/'Create Startup'/truncate/'to: \"/s/$slug/cycles\"' in StartupSwitcher.tsx"
        status: pass
    human_judgment: true
    rationale: "Rendering each of the loading/empty/populated/zero-one-many/long-text states needs real or seeded membership data in a browser to observe"
  - id: D3
    description: "useFocusedStartup resolves the Focused Startup from the URL slug first, then isFocused, then the first name-sorted membership"
    requirement: "SHELL-02"
    verification:
      - kind: other
        ref: "grep for useMatch/isFocused in useFocusedStartup.ts + pnpm check-types (typed against listMemberships' return shape)"
        status: pass
    human_judgment: true
    rationale: "Confirming the URL-first fallback under a real focus/re-render cycle needs a live Convex dev deployment and browser interaction, per this plan's own <verification> block"
  - id: D4
    description: "Sidebar-footer account menu with avatar, name, Score chip, Profile/Edit profile links and Sign out — no user-level Pro indicators anywhere in the new shell"
    requirement: "SHELL-04"
    verification:
      - kind: other
        ref: "grep -rnE 'isPro|Upgrade|pro-score-shine|planTier' src/shell (no matches, exit 1) + grep for ScoreChip/to=\"/profile\"/to=\"/u/$username\"/signOut in AccountMenu.tsx"
        status: pass
    human_judgment: false
  - id: D5
    description: "The Inbox item shows a blue tabular-nums unread badge only once the notification count has loaded and is above zero"
    requirement: "SHELL-01"
    verification:
      - kind: other
        ref: "grep for SidebarMenuBadge/isLoading in AppSidebar.tsx and useNotifications.ts"
        status: pass
    human_judgment: true
    rationale: "A slow-load window not flashing a false zero (UI E3 backstop) can only be observed against a real query in a browser"

duration: 20min
completed: 2026-09-29
status: complete
---

# Phase 1 Plan 6: Desktop Sidebar, Startup Switcher, Account Menu Summary

**The Linear-style desktop shell (SHELL-01/02/04 applied): `AppSidebar` mounted through `SidebarProvider`, a `listMemberships`-backed `StartupSwitcher` with rounded-square avatars, URL-first `useFocusedStartup`, and a sidebar-footer `AccountMenu` with the Score chip and a loading-safe Inbox unread badge.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-09-29T02:40:00+05:30 (approx.)
- **Completed:** 2026-09-29T02:46:38+05:30
- **Tasks:** 2
- **Files modified:** 10 (9 created, 1 modified)

## Accomplishments

- `useFocusedStartup` resolves the Focused Startup for every shell component: URL slug first (via `useMatch` on `/_shell/_authed/s/$slug`), then `isFocused`, then the first entry of the already name-sorted `listMemberships` list (edge SHELL-02/ordering) — the URL always wins so the sidebar matches the screen (ADR 0006).
- `src/shell/nav.ts` centralizes `PERSONAL_NAV`/`STARTUP_NAV`/`DISCOVER_NAV` with lucide icons and glossary labels, ready for 01-07's mobile tab bar and 01-09's command palette to reuse.
- `StartupSwitcher` is rewritten against `useFocusedStartup`, keeping the proven loading/empty/populated three-way branch (UI E1) and adding the rounded-square `StartupAvatar` to every row and the trigger; selecting a Startup only navigates to `/s/$slug/cycles` — the `/s/$slug` layout's own effect writes focus, confirmed by the required `grep -rn "api.teams.startups.focus" src/shell/sidebar` returning nothing.
- `AppSidebar` renders the full desktop order (Inbox, My Pulses, Threads → switcher + Cycles, Hiring, Team, Pitch, Activity → Discover), scoping the Focused-Startup section to only the switcher's "Create Startup" row when there's no Focused Startup (E2/empty, edge SHELL-01/empty), and colors each active item's icon blue.
- `AppShell` now wraps the frame in `SidebarProvider` (which already renders the outer `flex min-h-svh w-full` wrapper) and mounts `AppSidebar` inside `hidden md:flex`, leaving 01-07 to add the mobile bars below `md`.
- `AccountMenu` (sidebar footer) shows the avatar/name trigger, then a header with name and `@username`, the `ScoreChip`, "Profile" (only when `username` is set), "Edit profile", and "Sign out" — `ScoreChip` carries no Pro variant at all (#19, ADR-0005), confirmed by an empty `grep -rnE "isPro|Upgrade|pro-score-shine|planTier" src/shell`.
- The Inbox `SidebarMenuButton` gets a blue `tabular-nums` `SidebarMenuBadge` only when `!isLoading && count > 0`, so a slow load never reads as a definite zero (D-09).

## Task Commits

Each task was committed atomically:

1. **Task 1: A signed-in desktop User navigates from the sidebar and switches Startup** (tracer) - `994a0a4` (feat) — tracer feedback gate re-verified (`pnpm check-types` + `pnpm check`) before expansion, per checkpoint row 3 (interactive/end-of-phase, automated-only verify).
2. **Task 2: Account menu with the Score chip, and the Inbox unread badge** - `b5d2e44` (feat)

**Plan metadata:** committed separately after this summary.

## Files Created/Modified

- `src/shell/hooks/useFocusedStartup.ts` - URL-first Focused Startup resolution (`memberships`, `focused`, `isLoading`, `hasStartups`)
- `src/shell/nav.ts` - `PERSONAL_NAV`, `STARTUP_NAV`, `DISCOVER_NAV` constants with lucide icons
- `src/shell/sidebar/StartupAvatar.tsx` - rounded-square Startup avatar (initials only)
- `src/shell/sidebar/StartupSwitcher.tsx` - rewritten switcher: loading/empty/populated, avatar + role Badge + Check per row
- `src/shell/sidebar/AppSidebar.tsx` - the full desktop sidebar: nav groups, active-item styling, footer, Inbox badge
- `src/shell/layout/AppShell.tsx` - now wraps the frame in `SidebarProvider`, mounts `AppSidebar` in `hidden md:flex`
- `src/shell/hooks/useCurrentUser.ts` - moved copy of the existing hook (unchanged)
- `src/shell/hooks/useNotifications.ts` - moved copy, plus `isLoading: invites === undefined || feed === undefined`
- `src/shell/account/ScoreChip.tsx` - `Score {score}` chip, no Pro variant
- `src/shell/account/AccountMenu.tsx` - avatar/name trigger, header, Score chip, Profile/Edit profile links, Sign out

## Decisions Made

- `useFocusedStartup`'s fallback chain (URL slug → `isFocused` → `list[0]`) relies on `listMemberships` already being name-sorted server-side (01-01), so no client-side re-sort is needed.
- `StartupAvatar` and `AccountMenu`'s trigger avatar use `size-6` (not the shared `Avatar` primitive's default `size-8`) to fit the `h-8` sidebar row density from D-05.
- The old `src/features/app` copies of `useCurrentUser`/`useNotifications`/`StartupSwitcher`/`UserMenu`/`ScoreChip` are left untouched — plan 01-08 removes their last callers and deletes them.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. `pnpm check`'s formatting pass reformatted only whitespace; the pre-existing unused-parameter warning in `convex/test.helpers.ts::cyclePulseFor` (flagged in 01-03's and 01-04's SUMMARYs) resurfaced as a warning with no actual file change, confirmed out of scope for this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `pnpm check-types`, `pnpm check` (exit 0) and `pnpm test` (133/133) are all clean.
- Plan 01-07 can reuse `src/shell/nav.ts` for the mobile bottom tab bar and Startup sheet, and `useFocusedStartup` for the sheet's switcher slot.
- Plan 01-08 removes the old `src/features/app` shell (`AppNav.tsx`, `StartupSwitcher.tsx`, `UserMenu.tsx`, `ScoreChip.tsx`, `useWorkspace.ts`) and the `/app/*` route tree now that the new shell has its own switcher and account menu.
- Manual verification (real Founder/Member switcher data, the blue active-icon styling, sidebar overflow scroll, the Inbox badge's no-false-zero behavior) is deferred to `/gsd-verify-work` per this plan's own `<verification>` block — no blockers, just unexercised by this plan's own automated checks.

---
*Phase: 01-shell-navigation-foundation*
*Completed: 2026-09-29*

## Self-Check: PASSED

- FOUND: src/shell/hooks/useFocusedStartup.ts, src/shell/nav.ts
- FOUND: src/shell/sidebar/StartupAvatar.tsx, StartupSwitcher.tsx, AppSidebar.tsx
- FOUND: src/shell/hooks/useCurrentUser.ts, useNotifications.ts
- FOUND: src/shell/account/ScoreChip.tsx, AccountMenu.tsx
- FOUND commits 994a0a4, b5d2e44 (both present in `git log --oneline`)
- Re-ran `pnpm check-types` (clean), `pnpm check` (exit 0), and `pnpm test` (133/133) immediately before writing this summary
- All acceptance criteria from both tasks re-verified via grep/build/typecheck commands during execution
