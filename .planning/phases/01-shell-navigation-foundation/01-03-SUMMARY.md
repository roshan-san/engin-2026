---
phase: 01-shell-navigation-foundation
plan: 03
subsystem: ui
tags: [tailwind-v4, shadcn, radix-ui, geist, design-tokens, dark-theme]

# Dependency graph
requires:
  - phase: 01-shell-navigation-foundation (plans 01-01, 01-02)
    provides: backend Focused Startup rename and notification link routing (unrelated surface, no coupling)
provides:
  - Dark-only semantic token palette in src/styles/globals.css (SHELL-04)
  - Geist Variable as the only typeface, wired via @fontsource-variable/geist
  - Single Twitter-blue accent (#1D9BF0) plus a new --success (#00BA7C) token
  - Soft-square corners (0.375rem radius) on button/badge/avatar/card, no pills or circles
  - shadcn sidebar, command, dialog, sheet, tabs, tooltip, separator primitives and the use-mobile hook, ready for plans 01-06/01-07/01-09
affects: [01-06 (desktop sidebar), 01-07 (mobile shell), 01-09 (command palette + shortcut registry)]

actuals:
  tokens: 12211
  tasks: 2
  commits: 2

tech-stack:
  added: ["@fontsource-variable/geist@5.3.0", "cmdk@1.1.1", "radix-ui@1.6.7 (unified package)"]
  patterns:
    - "Tailwind v4 @theme inline maps semantic --color-*/--font-sans tokens to :root hex values; no light variant, no .dark class"
    - "shadcn CLI additions get their generated `import { cn } from \"cn\"` rewritten to the project's ~/lib/utils alias before committing"

key-files:
  created:
    - src/components/ui/sidebar.tsx
    - src/components/ui/command.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/sheet.tsx
    - src/components/ui/tabs.tsx
    - src/components/ui/tooltip.tsx
    - src/components/ui/separator.tsx
    - src/hooks/use-mobile.ts
  modified:
    - src/styles/globals.css
    - src/main.tsx
    - src/components/ui/button.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/avatar.tsx
    - src/components/ui/card.tsx
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "Rewrote the shadcn CLI's generated `import { cn } from \"cn\"` (an unvetted, unlisted package) to `~/lib/utils` in all 7 new primitive files, then removed the stray `cn` dependency the CLI had added to package.json — the plan's T-01-SC mitigation applied literally"
  - "Deleted the CLI's `.dark` selector block and `@custom-variant dark` line from globals.css to preserve the single dark-only palette (no light variant, no toggle)"
  - "Removed the sidebar's built-in Cmd/Ctrl+B keyboard shortcut and cookie persistence write, per plan: SHELL-05 owns the one shortcut registry (plan 01-09), and nothing collapses the desktop sidebar in this phase"

requirements-completed: [SHELL-04]

coverage:
  - id: D1
    description: "Dark-only palette: :root is the only palette, page/raised/border/text/muted/destructive hex values match SHELL-04, no light variant or toggle"
    requirement: "SHELL-04"
    verification:
      - kind: other
        ref: "grep -n 'prefers-color-scheme' src/styles/globals.css (no match) + grep -nE '^\\.dark|@custom-variant dark' src/styles/globals.css (no match) + pnpm build"
        status: pass
    human_judgment: false
  - id: D2
    description: "Single Twitter-blue accent (#1D9BF0) on --primary/--accent/--ring/--sidebar-primary, plus a new --success (#00BA7C) token"
    requirement: "SHELL-04"
    verification:
      - kind: other
        ref: "grep -il '1d9bf0' dist/assets/*.css (match) + grep -n 'success: #00ba7c' src/styles/globals.css"
        status: pass
    human_judgment: false
  - id: D3
    description: "Geist Variable is the only typeface, imported as a side-effecting module and reaching the built CSS"
    requirement: "SHELL-04"
    verification:
      - kind: other
        ref: "grep -il 'Geist Variable' dist/assets/*.css (match) + package.json exact version 5.3.0"
        status: pass
    human_judgment: false
  - id: D4
    description: "Soft-square corners: --radius is 0.375rem; button, badge, avatar and card no longer use rounded-full/rounded-xl"
    requirement: "SHELL-04"
    verification:
      - kind: other
        ref: "grep -n 'rounded-full' src/components/ui/button.tsx src/components/ui/badge.tsx src/components/ui/avatar.tsx (no match)"
        status: pass
    human_judgment: false
  - id: D5
    description: "shadcn sidebar, command, dialog, sheet, tabs, tooltip and separator primitives installed and pinned, with no keyboard shortcut owned outside the future registry"
    requirement: "SHELL-04"
    verification:
      - kind: other
        ref: "pnpm check-types + pnpm exec biome check src/components/ui src/hooks src/styles src/main.tsx + pnpm build + grep -n 'SIDEBAR_KEYBOARD_SHORTCUT' src/components/ui/sidebar.tsx (no match)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Blue accent is reserved for D-09's list only (primary action, links, focus rings, active nav icon, unread counts) — everything else stays white/grey on black"
    human_judgment: true
    rationale: "No mechanical test exists for restrained accent usage across future screens; plan itself records this as a judgment-tier prohibition for the verifier's visual review, since this plan ships tokens/primitives only and no screens consume them yet"

duration: 35min
completed: 2026-09-28
status: complete
---

# Phase 01 Plan 03: Dark Theme Tokens & Shell Primitives Summary

**Dark-only Twitter-blue token palette (Geist Variable, #000000/#16181C/#1D9BF0, 6px radius) plus 7 pinned shadcn primitives (sidebar, command, dialog, sheet, tabs, tooltip, separator) for the app shell.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-09-28T16:20:23Z
- **Completed:** 2026-09-28T16:55:00Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Rewrote `src/styles/globals.css`'s `:root` tokens to SHELL-04's dark-only palette, added `--success`/`--success-foreground`, set `--radius: 0.375rem`, and forced `color-scheme: dark` with no light variant or toggle
- Installed `@fontsource-variable/geist@5.3.0` and wired it as the only typeface (`--font-sans`), verified present in the built CSS
- Installed the sidebar, command, dialog, sheet, tabs, tooltip and separator shadcn primitives plus the `use-mobile` hook, needed by plans 01-06/01-07/01-09
- Restyled button, badge, avatar and card to soft-square corners (`rounded-md`/`rounded-lg`), eliminating every pill and circle shape
- Removed the sidebar's built-in Cmd/Ctrl+B shortcut and cookie persistence so no primitive owns a keyboard shortcut outside the future SHELL-05 registry

## Task Commits

Each task was committed atomically:

1. **Task 1: The app renders black, in Geist, with the blue accent** - `fa6bb01` (feat)
2. **Task 2: Shell primitives installed, soft-square everywhere, no stray shortcut** - `6389761` (feat)

**Plan metadata:** commit follows this SUMMARY

## Files Created/Modified
- `src/styles/globals.css` - Dark-only token rewrite, `--success`, `--font-sans`, `--radius: 0.375rem`, removed CLI's `.dark` block
- `src/main.tsx` - `import "@fontsource-variable/geist"` above the globals.css import
- `src/components/ui/button.tsx` - `rounded-full` → `rounded-md`
- `src/components/ui/badge.tsx` - `rounded-full` → `rounded-md`
- `src/components/ui/avatar.tsx` - both `rounded-full` occurrences → `rounded-md`
- `src/components/ui/card.tsx` - `rounded-xl` → `rounded-lg`
- `src/components/ui/sidebar.tsx` - new; keyboard shortcut and cookie write removed, `cn` import fixed
- `src/components/ui/command.tsx` - new; `cn` import fixed
- `src/components/ui/dialog.tsx` - new; `cn` import fixed
- `src/components/ui/sheet.tsx` - new; `cn` import fixed
- `src/components/ui/tabs.tsx` - new; `cn` import fixed
- `src/components/ui/tooltip.tsx` - new; `cn` import fixed
- `src/components/ui/separator.tsx` - new; `cn` import fixed
- `src/hooks/use-mobile.ts` - new `useIsMobile` hook
- `package.json` / `pnpm-lock.yaml` - added `@fontsource-variable/geist`, `cmdk`, `radix-ui` (all exact-pinned, no `^` ranges)

## Decisions Made
- Fixed the shadcn CLI's generated `import { cn } from "cn"` (a package not on the plan's verified-OK allowlist) to `~/lib/utils` in all 7 new files, then removed the `cn` dependency the CLI had silently added — direct application of the plan's T-01-SC mitigation ("if anything else appears, stop and report it; do not keep it")
- Deleted the CLI's `.dark` selector block and `@custom-variant dark` line to preserve the single dark-only palette
- Fixed two Biome `useExhaustiveDependencies` errors in the generated `sidebar.tsx` (removing the now-redundant `setOpenMobile` from two dependency arrays) since the file is directly in this task's scope and the errors blocked `pnpm check`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed the shadcn CLI's unlisted `cn` dependency and fixed its imports**
- **Found during:** Task 2 (shell primitives installation)
- **Issue:** The shadcn CLI wrote `import { cn } from "cn"` into all 7 new primitive files and added `"cn": "^0.4.0"` to `package.json` — a package not on the plan's verified-OK allowlist (only `cmdk`, `@radix-ui/react-*` or `radix-ui`, and the font were pre-approved)
- **Fix:** Rewrote each `import { cn } from "cn"` to `import { cn } from "~/lib/utils"` (the project's existing utility, matching every other primitive), removed `cn` from `package.json`, and ran `pnpm install` to drop it from the lockfile
- **Files modified:** `src/components/ui/{command,dialog,separator,sheet,sidebar,tabs,tooltip}.tsx`, `package.json`, `pnpm-lock.yaml`
- **Verification:** `grep -rn 'from "cn"' src/components/ui` returns nothing; `pnpm check-types` and `pnpm build` pass
- **Committed in:** `6389761` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed two Biome `useExhaustiveDependencies` errors in generated sidebar.tsx**
- **Found during:** Task 2 (soft-square + verify gate)
- **Issue:** The CLI-generated `sidebar.tsx` listed `setOpenMobile` in two `useCallback`/`useMemo` dependency arrays where it was already redundant (a stable `useState` setter), which `pnpm exec biome check` flagged as errors, blocking the task's verify gate
- **Fix:** Removed `setOpenMobile` from the `toggleSidebar` callback's and the `contextValue` memo's dependency arrays, per Biome's own suggested fix
- **Files modified:** `src/components/ui/sidebar.tsx`
- **Verification:** `pnpm exec biome check src/components/ui src/hooks src/styles src/main.tsx` exits 0
- **Committed in:** `6389761` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking/supply-chain, 1 bug)
**Impact on plan:** Both fixes were necessary to satisfy the plan's own T-01-SC mitigation and verify gate. No scope creep — no functionality was added beyond what the plan specified.

## Issues Encountered
- Pre-existing Biome warning `convex/test.helpers.ts:175` (unused `t` parameter) is unrelated to this plan's scope (confirmed present at the plan's starting commit) and was left as-is per the scope boundary rule; logged to `.planning/phases/01-shell-navigation-foundation/deferred-items.md`. It is a warning, not an error, so `pnpm check` still exits 0.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Tokens and primitives are in place for plan 01-06 (desktop sidebar), 01-07 (mobile shell) and 01-09 (command palette + shortcut registry) to consume directly
- No screens yet render these tokens beyond the existing (unmoved) pages, so the D-09 blue-restraint prohibition remains a judgment call for the verifier once later plans build real screens
- No blockers

## Self-Check: PASSED

---
*Phase: 01-shell-navigation-foundation*
*Completed: 2026-09-28*
