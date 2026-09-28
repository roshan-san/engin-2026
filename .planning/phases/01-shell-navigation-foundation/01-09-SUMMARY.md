---
phase: 01-shell-navigation-foundation
plan: 09
subsystem: ui
tags: [tanstack-router, cmdk, radix-tooltip, radix-sheet, convex, keyboard-shortcuts]

# Dependency graph
requires:
  - phase: 01-shell-navigation-foundation (plan 01-05)
    provides: "DiscoverPage's per-tab search Inputs"
  - phase: 01-shell-navigation-foundation (plan 01-06)
    provides: "useFocusedStartup, AppSidebar, StartupAvatar"
  - phase: 01-shell-navigation-foundation (plan 01-07)
    provides: "AppShell's mobile chrome, MobileTopBar's reserved right-hand 44px slot"
provides:
  - "src/shell/shortcuts/registry.ts: the single SHELL-05 registry (SHORTCUTS, findShortcut) feeding the palette, the ? sheet, and every tooltip/menu hint"
  - "CommandPalette: mod+K/Ctrl+K palette with Screens/Startups/Cycles groups (D-18)"
  - "ShortcutSheet: the ? sheet, one row per keyed registry entry grouped by scope"
  - "CommandProvider: palette/sheet open state, useCommands, useRegisterSearch (D-20)"
  - "ShortcutHint: the only component that renders a shortcut label"
affects: [Phase 2 (adds C / Create Pulse / Create Cycle entries to SHORTCUTS), Phase 4 (adds Create Role / Trial Cycle and J/K entries)]

actuals:
  tokens: 6728
  tasks: 3
  commits: 3
  plan_head_before: 11f811ed40adb18013374015efb5c5f0d25255d4
  plan_head_after: 79d406d97447f9433fcac4d121672d995aafa798

tech-stack:
  added: []
  patterns:
    - "One shortcut registry (SHORTCUTS in registry.ts) is the only place a shortcut is defined — the palette, the ? sheet, and every tooltip/menu hint read from it via findShortcut/ShortcutHint, never hard-coding a label"
    - "useShortcuts attaches exactly one window keydown listener via a ref-held ShortcutContext, so the effect mounts once while always acting on the latest navigate/focusedSlug/callbacks"
    - "CommandProvider's togglePalette/openShortcutSheet are mutually exclusive (edge SHELL-05/concurrency); useShortcutContext is the single place that assembles the ShortcutContext for both the keyboard hook and the palette's row actions"

key-files:
  created:
    - src/shell/shortcuts/registry.ts
    - src/shell/shortcuts/platform.ts
    - src/shell/shortcuts/useShortcuts.ts
    - src/shell/shortcuts/ShortcutHint.tsx
    - src/shell/command/CommandProvider.tsx
    - src/shell/command/CommandPalette.tsx
    - src/shell/command/usePaletteData.ts
    - src/shell/command/ShortcutSheet.tsx
  modified:
    - src/shell/layout/AppShell.tsx
    - src/features/discover/pages/DiscoverPage.tsx
    - src/shell/sidebar/AppSidebar.tsx
    - src/shell/mobile/MobileTopBar.tsx
    - src/shell/account/AccountMenu.tsx

key-decisions:
  - "useShortcuts reads ctx via a ref updated on every render, so the keydown listener attaches once on mount rather than re-subscribing whenever navigate/focusedSlug change"
  - "useShortcutContext (CommandProvider.tsx) is the single builder of ShortcutContext, shared by ShellKeyboard (the keydown hook) and CommandPalette (row actions), instead of duplicating the navigate/focusedSlug/callbacks assembly in both places"
  - "Discover's contributors tab registers its 'Filter by skill' Input as the page's search field (the closer analog to a search box); the 'Filter by location' Input is not registered"
  - "Doc comments avoid the literal ⌘ glyph in .tsx files (written as 'mod+K' instead), keeping the plan's negative grep for hard-coded shortcut labels literally true rather than just true in spirit"

requirements-completed: [SHELL-05]

coverage:
  - id: D1
    description: "mod+K/Ctrl+K opens the palette; the Screens group (navigation + Focused-Startup entries + ? sheet) is driven entirely by the registry; selecting a row navigates and closes the palette"
    requirement: "SHELL-05"
    verification:
      - kind: other
        ref: "grep for SHORTCUTS/CommandDialog in CommandPalette.tsx, addEventListener(\"keydown\") count in useShortcuts.ts, plus pnpm check"
        status: pass
    human_judgment: true
    rationale: "Opening the palette with a real keypress, watching it toggle closed on a second press, and confirming navigation lands on the right screen needs a browser, per this plan's own <verification> block"
  - id: D2
    description: "Palette groups render in fixed order Screens -> Startups -> Cycles; Startups omitted when the caller has none; Cycles shown only for the Focused Startup; CommandEmpty never flashes before Cycles finish loading"
    requirement: "SHELL-05"
    verification:
      - kind: other
        ref: "grep for the Screens/Startups/Cycles heading order and cyclesLoading gate in CommandPalette.tsx and usePaletteData.ts, plus pnpm check"
        status: pass
    human_judgment: true
    rationale: "The loading-safe CommandEmpty behavior (E7 backstop) and real membership/Cycle data can only be observed against a live Convex deployment in a browser"
  - id: D3
    description: "The ? sheet lists one row per registry entry with a key (mod+K, /, ?), grouped by scope, label left and ShortcutHint right, scrollable body"
    requirement: "SHELL-05"
    verification:
      - kind: other
        ref: "grep for 'Keyboard shortcuts'/overflow-y-auto/ShortcutHint in ShortcutSheet.tsx, plus pnpm check"
        status: pass
    human_judgment: true
    rationale: "Confirming the sheet opens on ?, never opens a second instance, and closes the palette (edge SHELL-05/idempotency and concurrency) needs a browser"
  - id: D4
    description: "ShortcutHint is the only component that renders a shortcut label; every palette row, sidebar Search button, mobile top-bar search button and account-menu item shows its hint from the registry"
    requirement: "SHELL-05"
    verification:
      - kind: other
        ref: "grep -rn \"⌘\" src --include=*.tsx returns nothing (no hard-coded label); grep for ShortcutHint across CommandPalette.tsx/ShortcutSheet.tsx/AppSidebar.tsx/AccountMenu.tsx"
        status: pass
    human_judgment: false
  - id: D5
    description: "/ focuses Discover's registered search input when connected; on a page without one (e.g. My Pulses) it opens the palette instead (D-20)"
    requirement: "SHELL-05"
    verification:
      - kind: other
        ref: "grep for isConnected/useRegisterSearch in CommandProvider.tsx and useRegisterSearch usage in DiscoverPage.tsx, plus pnpm check and pnpm build"
        status: pass
    human_judgment: true
    rationale: "Confirming / focuses the live Discover input versus opening the palette elsewhere needs a browser, per this plan's own <verification> block"
  - id: D6
    description: "Single-key shortcuts (/ and ?) are ignored while focus is in an input/textarea/select/contenteditable element; mod+K still works there; a bare k never opens the palette (edge SHELL-05/adjacency)"
    requirement: "SHELL-05"
    verification:
      - kind: other
        ref: "grep for isContentEditable/TEXTAREA/event.key in useShortcuts.ts confirming the editable-field guard and event.key matching"
        status: pass
    human_judgment: true
    rationale: "Typing / and ? inside a real text field versus pressing mod+K there needs a browser to confirm the guard behaves as coded"
  - id: D7
    description: "The registry holds only working Phase 1 entries (navigation, Startup switching, Create Startup, mod+K, /, ?) — no disabled or 'coming soon' rows anywhere in the palette or ? sheet (D-19)"
    requirement: "SHELL-05"
    verification:
      - kind: other
        ref: "grep -rniE \"coming soon|disabled\" src/shell/shortcuts src/shell/command returns nothing"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-09-29
status: complete
---

# Phase 1 Plan 9: Command Palette, Keyboard Shortcuts, ? Sheet Summary

**The single SHELL-05 shortcut registry driving a mod+K/Ctrl+K command palette (Screens/Startups/Cycles), a `?` shortcut sheet, and `/`-focuses-search — all hints sourced from one registry via `ShortcutHint`, with the editable-field guard keeping single-key shortcuts out of text inputs.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-09-29T03:38:00+05:30 (approx.)
- **Completed:** 2026-09-29T03:45:00+05:30 (approx.)
- **Tasks:** 3
- **Files modified:** 13 (8 created, 5 modified)

## Accomplishments

- `src/shell/shortcuts/registry.ts` is the single SHELL-05 registry: `SHORTCUTS` holds global (`mod+k`, `/`, `?`), navigation (Inbox/My Pulses/Threads/Discover/Create Startup) and Focused-Startup (Cycles/Hiring/Team/Pitch/Activity/Settings) entries, plus `findShortcut(id)`. Later phases append entries here rather than defining shortcuts elsewhere (D-19).
- `useShortcuts` attaches exactly one `window` `keydown` listener (confirmed by `grep -rn "addEventListener(\"keydown\""` returning a single line): `mod+k` fires even in editable fields, `/`/`?` are ignored there (`isEditableTarget`), and matching on `event.key` means a bare `k` never opens the palette (edge SHELL-05/adjacency).
- `CommandPalette` renders `Screens -> Startups -> Cycles` in that fixed order (edge SHELL-05/ordering): Screens from the registry (never showing `palette.open`/`search.focus` themselves), Startups from `listMemberships` (omitted when empty), Cycles from the Focused Startup only via `usePaletteData` — `CommandEmpty` is gated on `cyclesLoading` so it never flashes before Cycles arrive (E7 backstop). Below `md` the dialog goes full-screen (D-17).
- `ShortcutSheet` lists every keyed registry entry grouped by scope, in a scrollable body (E8 overflow).
- `CommandProvider` owns mutually-exclusive palette/sheet state (edge SHELL-05/concurrency) and, from Task 3, page search registration: `useRegisterSearch()` returns a no-op outside a provider (signed out), and `focusSearch()` focuses+selects the registered input when `isConnected`, else opens the palette (D-20) — `DiscoverPage` registers its active tab's search field.
- Hints are wired into the sidebar's new "Search" button (with a `Tooltip`), the mobile top bar's right-hand 44px slot (previously an empty placeholder from plan 01-07), and the account menu's new "Keyboard shortcuts" item — all reading `ShortcutHint`, the only component that ever prints a shortcut label (confirmed by an empty `grep -rn "⌘" src --include=*.tsx`).

## Task Commits

Each task was committed atomically:

1. **Task 1: mod+K/Ctrl+K opens the palette and jumps to a screen, driven by the registry** (tracer) - `69c06a4` (feat) — tracer feedback gate re-verified (`pnpm check`) before expansion, per checkpoint row 3 (interactive/end-of-phase, automated-only verify).
2. **Task 2: The palette lists Startups and the Focused Startup's Cycles; ? lists every shortcut; hints come from the registry** - `4dd2838` (feat)
3. **Task 3: / focuses Discover's search or opens the palette; hints on the sidebar, top bar and account menu** - `79d406d` (feat)

**Plan metadata:** committed separately after this summary.

## Files Created/Modified

- `src/shell/shortcuts/registry.ts` - the single registry: `SHORTCUTS`, `ShortcutEntry`, `ShortcutScope`, `ShortcutContext`, `findShortcut`
- `src/shell/shortcuts/platform.ts` - `isApplePlatform`, `formatShortcut` (⌘K vs Ctrl K)
- `src/shell/shortcuts/useShortcuts.ts` - the one global keydown listener, `isEditableTarget`
- `src/shell/shortcuts/ShortcutHint.tsx` - the only component rendering a shortcut label
- `src/shell/command/CommandProvider.tsx` - palette/sheet state, `useCommands`, `useShortcutContext`, `ShellKeyboard`, `useRegisterSearch`
- `src/shell/command/CommandPalette.tsx` - the mod+K/Ctrl+K palette
- `src/shell/command/usePaletteData.ts` - memberships + Focused-Startup Cycles for the palette
- `src/shell/command/ShortcutSheet.tsx` - the `?` sheet
- `src/shell/layout/AppShell.tsx` - mounts `CommandProvider`, `ShellKeyboard`, `CommandPalette`, `ShortcutSheet`
- `src/features/discover/pages/DiscoverPage.tsx` - registers its active tab's search Input
- `src/shell/sidebar/AppSidebar.tsx` - "Search" button + Tooltip under the header
- `src/shell/mobile/MobileTopBar.tsx` - right-hand 44px slot now opens the palette
- `src/shell/account/AccountMenu.tsx` - "Keyboard shortcuts" item

## Decisions Made

- `useShortcuts` reads the `ShortcutContext` through a ref updated on every render rather than re-running the effect on every context change, so the listener mounts once.
- `useShortcutContext` (in `CommandProvider.tsx`) is the single place that assembles `ShortcutContext` from `useNavigate`, `useFocusedStartup` and `useCommands`, shared by both `ShellKeyboard` and `CommandPalette` instead of duplicating that assembly.
- Discover's contributors tab registers its "Filter by skill" input (not "Filter by location") as the page's search field, since it's the closer analog to a search box.
- Doc comments spell the mod key as "mod+K" rather than the literal ⌘ glyph in `.tsx` files, so the plan's negative grep for hard-coded shortcut labels holds literally, not just in spirit.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. `pnpm check`'s formatting pass reformatted only whitespace/import wrapping; the pre-existing unused-parameter warning in `convex/test.helpers.ts::cyclePulseFor` (flagged in every prior Phase 1 SUMMARY since 01-03) resurfaced with no file change, confirmed out of scope for this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `pnpm check` (exit 0), `pnpm build` (exit 0, "built in" present) and `pnpm test` (133/133) are all clean.
- The negative grep for disabled/"coming soon" entries in `src/shell/shortcuts` and `src/shell/command` prints nothing.
- Phase 2 can append `C`/Create Pulse/Create Cycle entries to `SHORTCUTS`; Phase 4 appends Create Role/Trial Cycle and `J`/`K` — both without touching any consuming component, since the palette, sheet and hints all read the registry directly.
- Manual verification (pressing mod+K/Ctrl+K, `?`, `/` in a real browser; phone-viewport full-screen palette; throttled-network "No results found." backstop) is deferred to `/gsd-verify-work` per this plan's own `<verification>` block — no blockers, just unexercised by automated checks.

---
*Phase: 01-shell-navigation-foundation*
*Completed: 2026-09-29*

## Self-Check: PASSED

- FOUND: src/shell/shortcuts/registry.ts, platform.ts, useShortcuts.ts, ShortcutHint.tsx
- FOUND: src/shell/command/CommandProvider.tsx, CommandPalette.tsx, usePaletteData.ts, ShortcutSheet.tsx
- FOUND: src/shell/layout/AppShell.tsx, src/features/discover/pages/DiscoverPage.tsx
- FOUND: src/shell/sidebar/AppSidebar.tsx, src/shell/mobile/MobileTopBar.tsx, src/shell/account/AccountMenu.tsx
- FOUND commits 69c06a4, 4dd2838, 79d406d (all present in `git log --oneline`)
- Re-ran `pnpm check` (exit 0), `pnpm build` (exit 0), `pnpm test` (133/133), and the negative grep for disabled/coming-soon entries (empty) immediately before writing this summary
- All acceptance criteria from all three tasks re-verified via grep/build/typecheck commands during execution
