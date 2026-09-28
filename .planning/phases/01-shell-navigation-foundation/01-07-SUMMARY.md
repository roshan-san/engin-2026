---
phase: 01-shell-navigation-foundation
plan: 07
subsystem: ui
tags: [tanstack-router, shadcn-sheet, shadcn-tabs, convex, mobile-shell]

# Dependency graph
requires:
  - phase: 01-shell-navigation-foundation (plan 01-06)
    provides: "useFocusedStartup, useCurrentUser, useNotifications, PERSONAL_NAV/STARTUP_NAV/DISCOVER_NAV, StartupAvatar, ScoreChip, AppShell's outer frame"
  - phase: 01-shell-navigation-foundation (plan 01-03)
    provides: "Sheet and Tabs primitives"
provides:
  - "BottomTabBar: mobile bottom tab bar (SHELL-01) — Inbox/My Pulses/Startup/Discover, no hamburger"
  - "StartupSheet: mobile twin of the sidebar's Focused-Startup section (D-15)"
  - "MobileTopBar + AccountSheet: slim top bar with a centred title and an account sheet (D-17)"
  - "InboxSegments: Notifications | Threads segment toggle, mobile-only (D-16)"
  - "SCREEN_TITLES map in src/shell/nav.ts, one entry per route id the mobile top bar can show"
  - "pb-safe CSS utility for the device bottom safe-area inset"
affects: [01-08 (deletes the old src/features/app dock/AppNav), 01-09 (command palette fills MobileTopBar's right-hand 44px slot)]

actuals:
  tokens: 4967
  tasks: 3
  commits: 3
  plan_head_before: 1a10492a5747bd612df538581a451ffd06c2cc8a
  plan_head_after: 74d960257f38e029b113fcffdce10ffab5fe9ea7

tech-stack:
  added: []
  patterns:
    - "Mobile sheets (StartupSheet, AccountSheet) are built from the raw Sheet primitive, never the shadcn Sidebar's own mobile mode — matches the sidebar's own Focused-Startup section rather than duplicating a second navigation model"
    - "MobileTopBar reads the current screen title via useMatches().at(-1)?.routeId against a route-id-keyed SCREEN_TITLES map in nav.ts, rather than per-route title props"

key-files:
  created:
    - src/shell/mobile/BottomTabBar.tsx
    - src/shell/mobile/StartupSheet.tsx
    - src/shell/mobile/MobileTopBar.tsx
    - src/shell/mobile/AccountSheet.tsx
    - src/shell/mobile/InboxSegments.tsx
  modified:
    - src/shell/layout/AppShell.tsx
    - src/shell/nav.ts
    - src/styles/globals.css
    - src/routes/_shell/_authed/inbox/index.tsx
    - src/routes/_shell/_authed/threads/index.tsx

key-decisions:
  - "The Startup tab in BottomTabBar is a button (not a Link) that opens StartupSheet via local state — it never gets its own route, matching D-15"
  - "pb-safe is a Tailwind @utility (env(safe-area-inset-bottom)) rather than the old dock's arbitrary pb-[env(...)] value, per CLAUDE.md's no-arbitrary-values rule"
  - "StartupSheet's membership list is an inline expand/collapse under the switcher row (not a nested sheet/dropdown), since Radix DropdownMenu inside a Sheet is the pattern the sidebar avoids on mobile"

requirements-completed: [SHELL-01]

coverage:
  - id: D1
    description: "Bottom tab bar (Inbox/My Pulses/Startup/Discover) renders below md, each tab a 44px+ touch target, active icon blue, Startup opens a sheet instead of navigating"
    requirement: "SHELL-01"
    verification:
      - kind: other
        ref: "grep for md:hidden/grid-cols-4/to=\"/inbox\"/to=\"/my-pulses\"/to=\"/discover\"/StartupSheet/h-14 in BottomTabBar.tsx, plus empty grep for to=\"/s/ (Startup tab never navigates) + pnpm check"
        status: pass
    human_judgment: true
    rationale: "The visual layout, 44px touch targets and blue active-icon styling at true phone widths (360-414px) can only be confirmed in a browser, per this plan's own <verification> block"
  - id: D2
    description: "StartupSheet shows the switcher (loading/empty/populated, zero/one/many) then STARTUP_NAV rows, scrollable when content overflows"
    requirement: "SHELL-01"
    verification:
      - kind: other
        ref: "grep for side=\"bottom\"/overflow-y-auto/Create Startup/STARTUP_NAV/truncate in StartupSheet.tsx, empty grep for Sidebar in src/shell/mobile + pnpm check"
        status: pass
    human_judgment: true
    rationale: "Loading/empty/populated states and scroll overflow need real or seeded membership data in a browser to observe"
  - id: D3
    description: "MobileTopBar shows a 44px account avatar (opens AccountSheet), a centred truncating screen title from SCREEN_TITLES, and a 44px right-hand slot for 01-09's search button"
    requirement: "SHELL-01"
    verification:
      - kind: other
        ref: "grep for md:hidden/size-11/truncate/text-xl font-semibold/SCREEN_TITLES/AccountSheet in MobileTopBar.tsx + nav.ts SCREEN_TITLES export + pnpm check"
        status: pass
    human_judgment: true
    rationale: "Title truncation between the two 44px columns and avatar image-load fallback need a real browser render to confirm"
  - id: D4
    description: "AccountSheet shows avatar/name/username (link to profile), the Score chip, Edit profile and Sign out, with Skeletons while the current User loads"
    requirement: "SHELL-01"
    verification:
      - kind: other
        ref: "grep for ScoreChip/Sign out/to=\"/profile\"/Skeleton in AccountSheet.tsx, empty grep for isPro|Upgrade|planTier in src/shell/mobile + pnpm check"
        status: pass
    human_judgment: false
  - id: D5
    description: "On mobile, Inbox and Threads share a Notifications | Threads segment toggle; desktop is unaffected"
    requirement: "SHELL-01"
    verification:
      - kind: other
        ref: "grep for md:hidden/Notifications/Threads/\"/inbox\"/\"/threads\" in InboxSegments.tsx, one InboxSegments match per stub route + pnpm check"
        status: pass
    human_judgment: true
    rationale: "The toggle's live navigation between /inbox and /threads needs a browser to click through, per this plan's own <verification> block"

duration: 18min
completed: 2026-09-29
status: complete
---

# Phase 1 Plan 7: Mobile Bottom Tab Bar, Startup Sheet, Top Bar, Account Sheet Summary

**Mobile half of the Linear-style shell (SHELL-01, D-14–D-17): a four-tab `BottomTabBar` with a button-triggered `StartupSheet`, a slim `MobileTopBar` with a centred title and an `AccountSheet`, and a mobile-only `InboxSegments` toggle — all hand-built on the raw Sheet/Tabs primitives, reusing plan 01-06's hooks and nav constants.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-09-28T21:12:00Z (approx.)
- **Completed:** 2026-09-28T21:29:28Z
- **Tasks:** 3
- **Files modified:** 10 (7 created, 5 modified — 2 modified in more than one task)

## Accomplishments

- `BottomTabBar` renders Inbox · My Pulses · Startup · Discover in a `grid-cols-4`, `md:hidden` bar with `h-14` (56px) touch targets; Inbox is active on both `/inbox` and `/threads` (D-16), and its unread badge only shows once `useNotifications()` has resolved and is above zero (E3 backstop) — confirmed by the same loading-safe pattern plan 01-06 used in the desktop sidebar.
- The Startup tab is a `button`, not a `Link` — confirmed by `grep -n 'to="/s/' BottomTabBar.tsx` returning nothing — that opens `StartupSheet` via local state, never navigating on its own (D-15).
- `StartupSheet` is the mobile twin of the sidebar's Focused-Startup section: a `Sheet side="bottom"` with `overflow-y-auto` (E4/overflow), following `useFocusedStartup()`'s loading/empty/populated branches, an inline expand/collapse membership list (E1 zero/one/many), and `STARTUP_NAV` rows below — confirmed to render no shadcn Sidebar (`grep -rn "Sidebar" src/shell/mobile` empty).
- `MobileTopBar` shows a 44px (`size-11`) account button wrapping an initials-fallback `Avatar`, a centred `h1` title read from `SCREEN_TITLES[routeId]` via `useMatches().at(-1)?.routeId` (falling back to "Engin"), and an empty 44px right-hand slot plan 01-09 will fill with the search button.
- `AccountSheet` shows the avatar/name/`@username` (linking `/u/$username` when set, else `/profile`), the `ScoreChip`, "Edit profile" and "Sign out" (`useAuthActions().signOut()`), with `Skeleton`s replacing name/username/Score chip while the User loads (E6) — confirmed to carry no Pro/plan-tier surface (`grep -rnE "isPro|Upgrade|planTier" src/shell/mobile` empty).
- `src/shell/nav.ts` gained `SCREEN_TITLES`, one entry per route id from the plan's table (My Pulses, Inbox, Threads, Edit profile, Create Startup, the six Focused-Startup screens, Trial Cycle, Discover, Pricing, Pitch, Profile, Invite).
- `InboxSegments` is a `md:hidden` `Tabs` toggle (Notifications | Threads) whose value follows the pathname and whose `onValueChange` navigates between `/inbox` and `/threads`; the `/inbox` and `/threads` stub routes render it above their unchanged `StubScreen` (one match each via `grep -n "InboxSegments"`).
- `AppShell` now mounts `MobileTopBar` above `main` and `BottomTabBar` after the content column, with `main` reserving `pb-20 md:pb-4` so the last row of content never sits under the tab bar.
- `src/styles/globals.css` gained a `@utility pb-safe { padding-bottom: env(safe-area-inset-bottom); }`, replacing the old dock's arbitrary `pb-[env(...)]` value per CLAUDE.md's no-arbitrary-values rule.

## Task Commits

Each task was committed atomically:

1. **Task 1: On a phone, the tab bar navigates and the Startup tab opens the Startup sheet** (tracer) - `5b0e8e7` (feat) — tracer feedback gate re-verified (`pnpm check`) before expansion, per checkpoint row 3 (interactive/end-of-phase, automated-only verify).
2. **Task 2: Slim mobile top bar with the account sheet** - `3611114` (feat)
3. **Task 3: On mobile, Inbox switches between Notifications and Threads** - `74d9602` (feat)

**Plan metadata:** committed separately after this summary.

## Files Created/Modified

- `src/shell/mobile/BottomTabBar.tsx` - four-tab bar, Startup-tab-opens-sheet, unread badge
- `src/shell/mobile/StartupSheet.tsx` - switcher row + STARTUP_NAV rows, bottom sheet
- `src/shell/mobile/MobileTopBar.tsx` - account avatar, centred title, search-button slot
- `src/shell/mobile/AccountSheet.tsx` - avatar/name/username, Score chip, profile links, sign out
- `src/shell/mobile/InboxSegments.tsx` - Notifications | Threads toggle
- `src/shell/layout/AppShell.tsx` - mounts MobileTopBar and BottomTabBar, adjusts main padding
- `src/shell/nav.ts` - adds `SCREEN_TITLES`
- `src/styles/globals.css` - adds `@utility pb-safe`
- `src/routes/_shell/_authed/inbox/index.tsx` - renders `InboxSegments` above `StubScreen`
- `src/routes/_shell/_authed/threads/index.tsx` - renders `InboxSegments` above `StubScreen`

## Decisions Made

- The Startup tab is a `button` (not a `Link`) that only sets local sheet-open state — the `/s/$slug` layout's own focus effect (from 01-04) is still the single place that writes focus, matching the sidebar switcher's own pattern from 01-06.
- `pb-safe` is a Tailwind `@utility`, not an arbitrary bracket value, so both the safe-area padding and CLAUDE.md's Tailwind convention are satisfied in one utility class.
- `StartupSheet`'s membership list expands inline under the switcher row rather than opening a nested `DropdownMenu`, avoiding a Radix popover stacked inside a Radix Dialog-based Sheet.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. `pnpm check`'s formatting pass reformatted only whitespace; the pre-existing unused-parameter warning in `convex/test.helpers.ts::cyclePulseFor` (flagged in every prior phase 01 SUMMARY since 01-03) resurfaced with no file change, confirmed out of scope for this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `pnpm check` (exit 0) and `pnpm test` (133/133) are both clean.
- Plan 01-08 can now delete `src/features/app/layout/AppNav.tsx`'s `"dock"` branch and the old `/app/*` route tree — the mobile shell has its own tab bar, sheets, top bar and segment toggle.
- Plan 01-09's command palette fills `MobileTopBar`'s empty right-hand 44px slot with the search button.
- Manual verification (phone-width viewport 360-414px, resizing across 768px to confirm exactly one nav set renders, throttled-network badge-hidden-while-loading) is deferred to `/gsd-verify-work` per this plan's own `<verification>` block — no blockers, just unexercised by automated checks.

---
*Phase: 01-shell-navigation-foundation*
*Completed: 2026-09-29*

## Self-Check: PASSED

- FOUND: src/shell/mobile/BottomTabBar.tsx, StartupSheet.tsx, MobileTopBar.tsx, AccountSheet.tsx, InboxSegments.tsx
- FOUND: src/shell/layout/AppShell.tsx, src/shell/nav.ts, src/styles/globals.css
- FOUND: src/routes/_shell/_authed/inbox/index.tsx, src/routes/_shell/_authed/threads/index.tsx
- FOUND commits 5b0e8e7, 3611114, 74d9602 (all present in `git log --oneline`)
- Re-ran `pnpm check` (exit 0) and `pnpm test` (133/133) immediately before writing this summary
- All acceptance criteria from all three tasks re-verified via grep/build/typecheck commands during execution
