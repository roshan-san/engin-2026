---
phase: 01-shell-navigation-foundation
reviewed: 2026-09-29T00:00:00Z
depth: standard
files_reviewed: 90
files_reviewed_list:
  - convex/hiring/applications.ts
  - convex/hiring/offers.test.ts
  - convex/hiring/offers.ts
  - convex/hiring/trialMessages.ts
  - convex/lib/hiring/offers.ts
  - convex/lib/hiring/threads.ts
  - convex/lib/hiring/trialCycles.ts
  - convex/lib/hiring/verdicts.ts
  - convex/lib/limits.ts
  - convex/lib/links.ts
  - convex/lib/teams/invites.ts
  - convex/lib/teams/plan.ts
  - convex/lib/work/cycles.ts
  - convex/lib/work/pulses.ts
  - convex/notifications.test.ts
  - convex/people/users.ts
  - convex/schema.ts
  - convex/teams/invitations.test.ts
  - convex/teams/members.test.ts
  - convex/teams/members.ts
  - convex/teams/startups.test.ts
  - convex/teams/startups.ts
  - convex/work/pulses.ts
  - src/components/shared/PublicHeader.tsx
  - src/components/shared/StubScreen.tsx
  - src/features/hiring/trialCycles/hooks/useTrialCycle.ts
  - src/features/hiring/trialCycles/pages/TrialCyclePage.tsx
  - src/features/marketing/pricing/hooks/useUpgrade.ts
  - src/features/people/auth/hooks/useGoogleSignIn.ts
  - src/features/people/profile/hooks/useProfileEditor.ts
  - src/features/people/profile/pages/PublicProfilePage.tsx
  - src/features/teams/startup/public/components/PublicOpenings.tsx
  - src/features/teams/startup/public/hooks/useCreateStartupWizard.ts
  - src/features/teams/startup/public/pages/PublicStartupPage.tsx
  - src/features/teams/startup/workspace/components/WorkspaceRoles.tsx
  - src/features/teams/startup/workspace/components/WorkspaceTrials.tsx
  - src/features/teams/startup/workspace/hooks/usePitchEditor.ts
  - src/features/teams/team/hooks/useAcceptInvite.ts
  - src/features/teams/team/hooks/useTeamInvites.ts
  - src/features/work/cycles/components/CycleGuest.tsx
  - src/features/work/cycles/hooks/useActiveCycle.ts
  - src/hooks/use-mobile.ts
  - src/main.tsx
  - src/routes/_shell/_authed/inbox/index.tsx
  - src/routes/_shell/_authed/my-pulses/index.tsx
  - src/routes/_shell/_authed/profile/index.tsx
  - src/routes/_shell/_authed/route.tsx
  - src/routes/_shell/_authed/s/$slug/_member/activity/index.tsx
  - src/routes/_shell/_authed/s/$slug/_member/cycles/$cycleId.tsx
  - src/routes/_shell/_authed/s/$slug/_member/cycles/index.tsx
  - src/routes/_shell/_authed/s/$slug/_member/hiring/index.tsx
  - src/routes/_shell/_authed/s/$slug/_member/pitch/index.tsx
  - src/routes/_shell/_authed/s/$slug/_member/route.tsx
  - src/routes/_shell/_authed/s/$slug/_member/settings/index.tsx
  - src/routes/_shell/_authed/s/$slug/_member/team/index.tsx
  - src/routes/_shell/_authed/s/$slug/index.tsx
  - src/routes/_shell/_authed/s/$slug/route.tsx
  - src/routes/_shell/_authed/s/$slug/trials/$trialCycleId.tsx
  - src/routes/_shell/_authed/threads/index.tsx
  - src/routes/_shell/discover/index.tsx
  - src/routes/_shell/pricing/index.tsx
  - src/routes/_shell/route.tsx
  - src/routes/index.tsx
  - src/shell/account/AccountMenu.tsx
  - src/shell/account/ScoreChip.tsx
  - src/shell/command/CommandPalette.tsx
  - src/shell/command/CommandProvider.tsx
  - src/shell/command/ShortcutSheet.tsx
  - src/shell/command/usePaletteData.ts
  - src/shell/hooks/useFocusedStartup.ts
  - src/shell/hooks/useStartupBySlug.ts
  - src/shell/layout/AppShell.tsx
  - src/shell/layout/AuthLayouts.tsx
  - src/shell/layout/PublicShell.tsx
  - src/shell/mobile/AccountSheet.tsx
  - src/shell/mobile/BottomTabBar.tsx
  - src/shell/mobile/InboxSegments.tsx
  - src/shell/mobile/MobileTopBar.tsx
  - src/shell/mobile/StartupSheet.tsx
  - src/shell/nav.ts
  - src/shell/shortcuts/ShortcutHint.tsx
  - src/shell/shortcuts/platform.ts
  - src/shell/shortcuts/registry.ts
  - src/shell/shortcuts/useShortcuts.ts
  - src/shell/sidebar/AppSidebar.tsx
  - src/shell/sidebar/StartupAvatar.tsx
  - src/shell/sidebar/StartupSwitcher.tsx
  - src/shell/startup/MemberGate.tsx
  - src/shell/startup/StartupRoute.tsx
  - src/styles/globals.css
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-09-29T00:00:00Z
**Depth:** standard
**Files Reviewed:** 90
**Status:** issues_found

## Summary

Reviewed the shell/navigation rework (the `_shell` → `_authed` → `s/$slug/_member` route tree, the sidebar/mobile chrome, the command palette and shortcut registry) plus every Convex backend file the workflow flagged as changed in this phase.

Backend authorization held up under scrutiny: every reviewed `query`/`mutation` calls `requireUserId` (or the intentionally-public `getAuthUserId`/`getPublic` path) before touching data, `getBySlug` correctly collapses "no such Startup" and "Stealth Startup, not a Member" into the same `null` so a non-Member can't probe for Stealth Startups, and the Trial Cycle screen's exemption from `MemberGate` is consistent with its own server-side access check. `tsc --noEmit` (both `tsconfig.json` and `convex/tsconfig.json`) and `biome lint` both pass clean on the reviewed tree, and no hardcoded secrets, `eval`/`innerHTML`, or empty catch blocks were found.

The issues found are all quality/maintainability: this phase's "replace real screens with `StubScreen` placeholders" pass left several previously-wired components and hooks orphaned (not imported anywhere), and `useFocusedStartup` has a fallback path that can present the wrong Startup as "focused" in the sidebar/switcher when the URL slug isn't one of the caller's memberships.

## Warnings

### WR-01: Six files were left importable but unreachable after this phase's stub-out pass

**File:** `src/features/work/cycles/components/CycleGuest.tsx`, `src/features/work/cycles/hooks/useActiveCycle.ts`, `src/features/teams/startup/workspace/components/WorkspaceRoles.tsx`, `src/features/teams/startup/workspace/components/WorkspaceTrials.tsx`, `src/features/teams/startup/workspace/hooks/usePitchEditor.ts`, `src/features/teams/team/hooks/useTeamInvites.ts`

**Issue:** All six files were touched by this phase's diff (confirmed via `git diff b44fbb4..HEAD --stat`), but none is imported from anywhere else in `src/` (verified with a repo-wide grep for each export). The routes that would have rendered them (`/s/$slug/_member/cycles`, `/pitch`, `/team`, and `/my-pulses` for a startup-less user) were all replaced with the generic `StubScreen` in this same phase, so:
- `CycleGuest` (a fully-built "you're not on a startup yet" screen wired to `useMyWork`) is dead.
- `useActiveCycle` (a hook selecting the active/planned Cycle for a Startup) is dead.
- `WorkspaceRoles` / `WorkspaceTrials` (Roles/Trial Cycles lists with founder close-role mutation wiring) are dead.
- `usePitchEditor` (full Pitch-editing form state + `teams.startups.update` wiring) is dead.
- `useTeamInvites` (invite creation/revocation/copy-link wiring) is dead.

This is real, unreachable code: it still compiles and lints clean today, but it will silently bit-rot (e.g. against future `schema.ts`/API changes) with no route or test exercising it, and it makes the workspace/team/pitch/cycles feature folders misleading to a reader trying to find where those screens actually live now.

**Fix:** Either delete these files now and let the phase that rebuilds each screen re-add them from the (already-preserved) git history, or — if keeping them as a deliberate head start for the next phase — add a one-line comment on each file noting it is not yet wired to a route, so it isn't mistaken for live code during the next review.

### WR-02: `useFocusedStartup` can highlight the wrong Startup for a non-Member viewing a Trial Cycle

**File:** `src/shell/hooks/useFocusedStartup.ts:20-25`
**Issue:**
```ts
const focused =
	(slug ? list.find((entry) => entry.startup.slug === slug) : undefined) ??
	list.find((entry) => entry.isFocused) ??
	list[0] ??
	null;
```
The doc comment states "the URL always wins" when a Startup slug is in the route, but that's only true when the URL's Startup is one of the caller's memberships. `/s/$slug/trials/$trialCycleId` is intentionally exempt from `MemberGate` (per `TrialCyclePage`'s own comment) so a Trial Cycle Participant who is not a Member can open it. If that same user is a Founder/Member of a *different* Startup, `list.find(slug match)` returns `undefined` (their memberships list doesn't contain the trial's Startup), and the chain falls through to their last-focused Startup elsewhere. `AppSidebar`'s `STARTUP_NAV` section, `StartupSwitcher`'s highlighted row, and `StartupSheet` will then all point at that unrelated Startup while the page itself is showing a Trial Cycle for a completely different one — a real navigation-context mismatch for exactly the multi-Startup user this shell is built for.

**Fix:** When `slug` is present but not found in `list`, resolve `focused` to `null` (no highlighted Startup) instead of falling through to the global default, e.g.:
```ts
const matched = slug ? list.find((entry) => entry.startup.slug === slug) : undefined;
const focused = slug ? (matched ?? null) : (list.find((entry) => entry.isFocused) ?? list[0] ?? null);
```

### WR-03: `WorkspaceTrials`/`WorkspaceRoles` unused, but if reconnected later would double-fetch startup context

**File:** `src/features/teams/startup/workspace/components/WorkspaceTrials.tsx:9-22`, `src/features/teams/startup/workspace/components/WorkspaceRoles.tsx:10-21`
**Issue:** Both components take `startupId`/`slug`/`isFounder` as props rather than reading them from `useStartupRoute()` (the context every other file under `/s/$slug` uses, per `StartupRoute.tsx`'s own doc comment: "the screen's Startup always comes from this URL slug ... never from `focusedStartupId`"). This is low-impact today since the components are unreachable (see WR-01), but flagging it now so whoever reconnects them doesn't reintroduce a second source of truth for which Startup is being shown, which is exactly the class of bug SHELL-02/ADR 0006 was written to prevent.
**Fix:** When rewiring these into a route, source `startupId`/`isFounder` from `useStartupRoute()` inside the component rather than threading them through props from the caller.

## Info

### IN-01: `ShortcutHint`/`findShortcut` accept any `string`, not a registry-checked id

**File:** `src/shell/shortcuts/ShortcutHint.tsx:9-14`, `src/shell/shortcuts/registry.ts:145-147`
**Issue:** `ShortcutHint({ id })` and `findShortcut(id)` type `id` as a bare `string`. A typo'd id (e.g. `"palette.opne"`) silently resolves to `undefined` and the component just renders nothing — there's no compile-time or runtime signal that the hint is missing because of a typo versus the entry intentionally having no key. All six call sites (`AccountMenu`, `AppSidebar`, `CommandPalette`, `ShortcutSheet`) currently use string literals that happen to match, so this is latent rather than active.
**Fix:** Derive a union type from `SHORTCUTS` (e.g. `type ShortcutId = (typeof SHORTCUTS)[number]["id"]`) and type `id` as `ShortcutId` in both `findShortcut` and `ShortcutHint`'s props, so a typo is a build error.

### IN-02: `usePaletteData`'s `cyclesLoading` doesn't account for the memberships query still loading

**File:** `src/shell/command/usePaletteData.ts:11-24`
**Issue:** `cyclesLoading` is `focused !== null && cycles === undefined`, which is `false` while `useFocusedStartup()`'s own `memberships` query is still loading (since `focused` resolves to `null` when the list is empty during load). `CommandPalette` only guards `CommandEmpty` on `!cyclesLoading`, so on a slow connection the "Startups" and "Cycles" groups can render as absent (correctly, they're empty) while the palette's empty-state gating doesn't reflect that memberships haven't arrived yet. Low practical impact since the static "Screens" group always renders and keeps `CommandEmpty` from actually triggering, but the loading flag itself is subtly incomplete.
**Fix:** Thread `useFocusedStartup()`'s `isLoading` into `usePaletteData`'s return value and OR it into `cyclesLoading` (or rename to `dataLoading`) so callers get one accurate signal.

---

_Reviewed: 2026-09-29T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
