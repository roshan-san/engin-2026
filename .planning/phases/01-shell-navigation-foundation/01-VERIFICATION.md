---
phase: 01-shell-navigation-foundation
verified: 2026-09-29T04:15:00Z
status: passed
score: 12/12 must-haves verified
covered_files: [".planning/phases/01-shell-navigation-foundation/01-01-PLAN.md", ".planning/phases/01-shell-navigation-foundation/01-01-SUMMARY.md", ".planning/phases/01-shell-navigation-foundation/01-02-PLAN.md", ".planning/phases/01-shell-navigation-foundation/01-02-SUMMARY.md", ".planning/phases/01-shell-navigation-foundation/01-03-PLAN.md", ".planning/phases/01-shell-navigation-foundation/01-03-SUMMARY.md", ".planning/phases/01-shell-navigation-foundation/01-04-PLAN.md", ".planning/phases/01-shell-navigation-foundation/01-04-SUMMARY.md", ".planning/phases/01-shell-navigation-foundation/01-05-PLAN.md", ".planning/phases/01-shell-navigation-foundation/01-05-SUMMARY.md", ".planning/phases/01-shell-navigation-foundation/01-06-PLAN.md", ".planning/phases/01-shell-navigation-foundation/01-06-SUMMARY.md", ".planning/phases/01-shell-navigation-foundation/01-07-PLAN.md", ".planning/phases/01-shell-navigation-foundation/01-07-SUMMARY.md", ".planning/phases/01-shell-navigation-foundation/01-08-PLAN.md", ".planning/phases/01-shell-navigation-foundation/01-08-SUMMARY.md", ".planning/phases/01-shell-navigation-foundation/01-09-PLAN.md", ".planning/phases/01-shell-navigation-foundation/01-09-SUMMARY.md", "convex/hiring/applications.ts", "convex/hiring/offers.ts", "convex/hiring/trialMessages.ts", "convex/lib/hiring/offers.ts", "convex/lib/hiring/threads.ts", "convex/lib/hiring/trialCycles.ts", "convex/lib/hiring/verdicts.ts", "convex/lib/limits.ts", "convex/lib/links.ts", "convex/lib/teams/invites.ts", "convex/lib/teams/plan.ts", "convex/lib/work/cycles.ts", "convex/lib/work/pulses.ts", "convex/people/users.ts", "convex/schema.ts", "convex/teams/members.ts", "convex/teams/startups.ts", "convex/work/pulses.ts", "src/components/shared/PublicHeader.tsx", "src/components/shared/StubScreen.tsx", "src/main.tsx", "src/shell/account/AccountMenu.tsx", "src/shell/account/ScoreChip.tsx", "src/shell/command/CommandPalette.tsx", "src/shell/command/CommandProvider.tsx", "src/shell/command/ShortcutSheet.tsx", "src/shell/command/usePaletteData.ts", "src/shell/hooks/useFocusedStartup.ts", "src/shell/hooks/useStartupBySlug.ts", "src/shell/layout/AppShell.tsx", "src/shell/layout/AuthLayouts.tsx", "src/shell/layout/PublicShell.tsx", "src/shell/mobile/AccountSheet.tsx", "src/shell/mobile/BottomTabBar.tsx", "src/shell/mobile/InboxSegments.tsx", "src/shell/mobile/MobileTopBar.tsx", "src/shell/mobile/StartupSheet.tsx", "src/shell/nav.ts", "src/shell/shortcuts/ShortcutHint.tsx", "src/shell/shortcuts/platform.ts", "src/shell/shortcuts/registry.ts", "src/shell/shortcuts/useShortcuts.ts", "src/shell/sidebar/AppSidebar.tsx", "src/shell/sidebar/StartupAvatar.tsx", "src/shell/sidebar/StartupSwitcher.tsx", "src/shell/startup/MemberGate.tsx", "src/shell/startup/StartupRoute.tsx", "src/styles/globals.css"]
covered_digest: "v2:sha256:b2e5795faa9316eb4d9b70749b78f454118409695d1c660d0c2834a538043023"
behavior_unverified: 0
overrides_applied: 0
---

# Phase 01: Shell & Navigation Foundation Verification Report

**Phase Goal:** Users navigate Engin through the new Linear-style shell — sidebar, Startup switcher, command palette and keyboard shortcuts — with every Startup-scoped screen's URL carrying its Startup.
**Verified:** 2026-09-29T04:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria, SHELL-01..07)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Signed-in User sees a sidebar with Inbox/My Pulses/Threads, a Startup switcher, and a Focused-Startup section; mobile gets a bottom tab bar (SHELL-01) | ✓ VERIFIED | `src/shell/sidebar/AppSidebar.tsx` renders `PERSONAL_NAV` (Inbox/My Pulses/Threads) → `StartupSwitcher` + `STARTUP_NAV` (Cycles/Hiring/Team/Pitch/Activity) → Discover; `src/shell/mobile/BottomTabBar.tsx` renders exactly Inbox/My Pulses/Startup(sheet)/Discover, hidden `md:hidden` vs sidebar `hidden md:flex`. Backend tests (`convex/teams/startups.test.ts` 20/20, `convex/teams/members.test.ts`) pass. |
| 2 | Every Startup-scoped screen's URL carries the Startup's slug (`/s/$slug/...`), no `/app` prefix; app reopens on last Focused Startup (SHELL-02, SHELL-07) | ✓ VERIFIED | Route tree under `src/routes/_shell/_authed/s/$slug/**` for cycles/hiring/team/pitch/activity/settings/trials; `grep -rn '"/app'` and `find src/routes/app`/`src/features/app` empty. `convex/teams/startups.ts` `getBySlug`/`listMemberships`/`focus`; `src/shell/hooks/useStartupBySlug.ts` calls `focus` idempotently (`if (... || result.isFocused) return`). `convex/lib/links.ts` builds every notification href off `/s/{slug}/...`; grep of all `href:` write sites in `convex/` confirms every one but the static `/invite/{token}` uses the builders. |
| 3 | ⌘K/Ctrl+K opens a command palette (screens/Startups/Cycles); `?` opens a shortcuts sheet; `/` focuses search; one registry feeds all four surfaces (SHELL-05) | ✓ VERIFIED | `src/shell/shortcuts/registry.ts` (`SHORTCUTS`) is the single source read by `CommandPalette.tsx`, `ShortcutSheet.tsx`, `ShortcutHint.tsx`, and menu items; `useShortcuts.ts` matches `mod+k` via `metaKey|ctrlKey`, ignores `/`/`?` on editable targets (`isEditableTarget`). |
| 4 | Interface renders dark-only with one accent colour and typeface (SHELL-04) | ✓ VERIFIED | `src/styles/globals.css`: single `:root` palette (`#000000` bg, `#16181c` raised, `#2f3336` border, `#e7e9ea` text, `#71767b` muted, `#f4212e` destructive), `--primary/--accent/--ring` all `#1d9bf0`, separate `--success: #00ba7c`, `--radius: 0.375rem`; no light-variant selector or theme toggle found. `src/main.tsx` imports `@fontsource-variable/geist`. |
| 5 | Signed-in User opens a Pitch/profile/Discover inside the app shell; signed-out visitor sees a simple public header with sign-in (SHELL-03) | ✓ VERIFIED | `src/routes/_shell/route.tsx` → `ShellLayout` picks `AppShell` (authenticated) or `PublicShell`+`PublicHeader` (signed out) based on `useConvexAuth()`, with `GlobalSpinner` while loading (no flash). `src/routes/_shell/_authed/route.tsx` → `AuthedLayout` redirects a signed-out visitor on a sign-in-only URL to `/`. `PublicHeader.tsx` shows wordmark, Discover link, Sign-in button wired to `useGoogleSignIn`. |
| 6 | Frontend reorganised per ADR-0006: `src/shell/`, `features/<domain>/<feature>/pages/`, frontend-only discover/marketing (SHELL-06) | ✓ VERIFIED | `find src/features -type d -name ui` → empty; `pages/` dirs exist under discover, hiring/trialCycles, marketing/{landing,pricing}, people/profile, teams/{startup/public,team}; `src/routes/app`, `src/features/app` deleted; `grep -rnE "getWorkspace|setActive"` across `convex/`+`src/` → empty (old hidden-state API removed). `src/features/discover/` is frontend-only (hooks + pages, no backend counterpart file of the same name required). |
| 7 | A backend query resolves a Startup by slug with role + Plan/limits/usage in one call; switcher fed by memberships; field renamed to Focused Startup, cleared on removal (SHELL-07) | ✓ VERIFIED | `convex/teams/startups.ts::getBySlug` returns `{startup, role, isFocused, plan}` for a Member and a collapsed `{startup:{_id,name,slug}, role:null, isFocused:false, plan:null}` for a non-Member/Stealth (can't be told apart, per T-01-02 comment). `listMemberships` returns `{startup:{_id,name,slug}, role, isFocused}[]`. `convex/schema.ts:131` `focusedStartupId`. `convex/teams/members.ts:59-60` clears `focusedStartupId` on removal — directly tested and passing (`removing a Member clears their Focused Startup`, `convex/teams/members.test.ts`). |

**Score:** 7/7 roadmap Success Criteria verified; all 7 requirement IDs (SHELL-01..07) have matching code evidence.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `convex/teams/startups.ts` | `getBySlug`, `listMemberships`, `focus` | ✓ VERIFIED | All three exported, tested (20/20 passing) |
| `convex/lib/links.ts` | Slug-aware href builders | ✓ VERIFIED | `INBOX_HREF`, `MY_PULSES_HREF`, `startupHref`, `trialCycleHref`, `cycleHref`, `pulseHref` all present, all call sites in `convex/` route through them |
| `src/styles/globals.css` | Dark-only tokens, Geist, 6px radius, `--success` | ✓ VERIFIED | Present as documented above |
| `src/main.tsx` | Geist font import | ✓ VERIFIED | `import "@fontsource-variable/geist"` |
| `src/shell/layout/{AppShell,AuthLayouts,PublicShell}.tsx` | Signed-in/out frames | ✓ VERIFIED | Wired into `_shell`/`_authed` routes |
| `src/shell/startup/{StartupRoute,MemberGate}.tsx` | Startup-by-slug context + non-Member redirect | ✓ VERIFIED | `StartupRouteLayout` resolves via `useStartupBySlug`; `MemberGate` redirects `member === null` to `/startup/$slug` |
| `src/shell/sidebar/{AppSidebar,StartupSwitcher}.tsx` | Desktop sidebar + switcher | ✓ VERIFIED | Order and content confirmed by direct read |
| `src/shell/mobile/{BottomTabBar,StartupSheet,MobileTopBar,AccountSheet}.tsx` | Mobile shell | ✓ VERIFIED | All exist, wired into `AppShell` |
| `src/shell/shortcuts/registry.ts` | Single shortcut registry | ✓ VERIFIED | Consumed by palette, sheet, hints |
| `src/shell/command/{CommandPalette,CommandProvider,ShortcutSheet,usePaletteData}.tsx/.ts` | ⌘K palette + `?` sheet | ✓ VERIFIED | Mounted once in `AppShell`; fixed group order Screens→Startups→Cycles |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `convex/hiring/applications.ts` | `convex/lib/links.ts` | `trialCycleHref(ctx, trial)` | ✓ WIRED | 5 call sites confirmed |
| `convex/work/pulses.ts` | `convex/lib/links.ts` | `pulseHref(ctx, pulse)` | ✓ WIRED | Confirmed at line 184 (and `convex/lib/work/pulses.ts:161`) |
| `src/components/shared/PublicHeader.tsx` | `useGoogleSignIn` | Sign-in button | ✓ WIRED | `onClick={() => void signInWithGoogle()}` |
| `src/features/teams/startup/public/hooks/useCreateStartupWizard.ts` | `/s/$slug/cycles` | navigate after create | ✓ WIRED | Confirmed via 01-08 grep evidence + `convex/teams/startups.ts::create` sets `focusedStartupId` |
| `src/shell/hooks/useStartupBySlug.ts` | `api.teams.startups.focus` | idempotent focus-on-visit effect | ✓ WIRED | Guard `result.isFocused` prevents redundant writes |
| `src/shell/sidebar/AppSidebar.tsx` / `StartupSwitcher.tsx` / mobile `StartupSheet.tsx` | `useFocusedStartup()` | sidebar/switcher highlight | ⚠️ WIRED, WITH A KNOWN EDGE-CASE GAP | See Anti-Patterns below (WR-02) |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| SHELL-01 | 01-06, 01-07 | Sidebar + mobile tab bar | ✓ SATISFIED in code | `AppSidebar.tsx`, `BottomTabBar.tsx` — **but see Gaps note below: REQUIREMENTS.md itself still marks SHELL-01 `[ ]`/"Pending"** |
| SHELL-02 | 01-01, 01-02, 01-04, 01-06, 01-08 | `/s/$slug` URL scheme, no `/app` | ✓ SATISFIED | Confirmed above; REQUIREMENTS.md marks Complete |
| SHELL-03 | 01-04, 01-05 | Public pages in shell / public header | ✓ SATISFIED | Confirmed above; REQUIREMENTS.md marks Complete |
| SHELL-04 | 01-03, 01-06 | Dark-only theme, accent, typeface | ✓ SATISFIED | Confirmed above; REQUIREMENTS.md marks Complete |
| SHELL-05 | 01-09 | Command palette, shortcuts registry | ✓ SATISFIED | Confirmed above; REQUIREMENTS.md marks Complete |
| SHELL-06 | 01-04, 01-05, 01-08 | ADR-0006 frontend reorg | ✓ SATISFIED | Confirmed above (see next section for the specific 01-05-vs-01-08 question) |
| SHELL-07 | 01-01 | `getBySlug`/`listMemberships`/`focus`, renamed field | ✓ SATISFIED | Confirmed above; REQUIREMENTS.md marks Complete |

**No orphaned requirements** — REQUIREMENTS.md maps exactly SHELL-01..07 to Phase 1, and every one is claimed by at least one plan's `requirements:` frontmatter.

### On the SHELL-06 early-mark question

01-05-PLAN.md declared `SHELL-06` and marked it (jointly with SHELL-03) complete in REQUIREMENTS.md before sibling plan 01-08 — which also declares SHELL-06 — had finished. Now that 01-08 is done, the mark is justified by the code:
- `find src/features -type d -name ui` → **empty** (no leftover `ui/` directories anywhere)
- `find src/routes/app` and `find src/features/app` → **empty** (old `/app` tree fully deleted, confirmed independently of the SUMMARY's own claim)
- `grep -rnE "getWorkspace|setActive" convex/ src/` → **empty** (hidden-state Startup API removed, `getBySlug`/`listMemberships`/`focus` are the only Focused-Startup API)
- `pages/` directories exist for every feature that needed the `ui/` → `pages/` rename (discover, hiring/trialCycles, marketing/landing, marketing/pricing, people/profile, teams/startup/public, teams/team)
- `src/features/discover/` and `src/features/marketing/` are frontend-only (no matching `convex/discover` or `convex/marketing` module, as expected — Discover/Marketing are frontend-only surfaces per SHELL-06's own text)

The 01-05 mark was not premature in substance — 01-05 completed the public-page half of the rename (Pitch/profile/Discover/Invite), and 01-08 completed the remainder (old `/app` deletion, last four `ui/`→`pages/` moves, backend API cleanup). Both plans' contributions are independently confirmed in the current tree. **Verdict: the SHELL-06 "Complete" mark is justified.**

### Anti-Patterns Found (from 01-REVIEW.md, cross-checked directly against the current tree)

| File | Finding | Severity | Current-tree confirmation | Blocks phase goal? |
|---|---|---|---|---|
| `src/features/work/cycles/components/CycleGuest.tsx`, `useActiveCycle.ts`, `src/features/teams/startup/workspace/components/WorkspaceRoles.tsx`, `WorkspaceTrials.tsx`, `usePitchEditor.ts`, `src/features/teams/team/hooks/useTeamInvites.ts` | WR-01: six files touched this phase are unimported anywhere in `src/` | Warning | Confirmed still true — independently re-grepped for each export name, zero non-self hits, all six files still present | **No.** 01-08-PLAN.md's own must-have explicitly says these files' "hooks/ and components/ stay and compile against the new shell" while their routes are rebuilt in later phases (D-10/D-11) — this is documented, intended scope, not a stub masquerading as done. It is real dead-code/maintainability debt but does not undermine sidebar/switcher/palette/URL navigation, which is this phase's actual goal. |
| `src/shell/hooks/useFocusedStartup.ts:20-25` | WR-02: falls through to the User's last Focused Startup (rather than "no highlighted Startup") when the URL slug isn't one of the caller's memberships — reachable because `/s/$slug/trials/$trialCycleId` is deliberately exempt from `MemberGate` | Warning | Confirmed by direct read: the route `src/routes/_shell/_authed/s/$slug/trials/$trialCycleId.tsx` sits as a sibling of `_member`, not inside it, so a non-Member Trial Cycle Participant reaches `TrialCyclePage` without ever passing `MemberGate`; `useFocusedStartup`'s fallback chain (`slug match ?? isFocused ?? list[0] ?? null`) then resolves to an unrelated Startup for a User who is a Member elsewhere | **No, but flagged for follow-up.** No must-have in any of the 9 plans states the sidebar must show "no highlighted Startup" for this specific non-Member-viewing-a-foreign-Trial-Cycle case — the only stated edge-case truth ("Edge SHELL-02/ordering: fallback is the first name-sorted entry when `focusedStartupId` is unset or stale") is satisfied by the current code. The bug is real and narrow (multi-Startup Users who are also Trial Cycle Participants elsewhere) and does not break the URL scheme, the screen's own content (which is correctly slug-scoped), or general navigation. |
| `src/features/teams/startup/workspace/components/WorkspaceTrials.tsx`, `WorkspaceRoles.tsx` | WR-03: props-threaded startupId/isFounder instead of `useStartupRoute()` | Info | Confirmed, but components are unreachable (WR-01) so this is theoretical until a later phase reconnects them | No |
| `src/shell/shortcuts/registry.ts:145-147`, `ShortcutHint.tsx:9-14` | IN-01: `id` typed as bare `string`, not registry-checked | Info | Confirmed | No |
| `src/shell/command/usePaletteData.ts:11-24` | IN-02: `cyclesLoading` doesn't account for memberships still loading | Info | Confirmed | No |

No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers found in any shell/route/link file touched this phase.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Backend Startup-by-slug/membership/focus behavior | `pnpm test convex/teams/startups.test.ts` | 20/20 passed | ✓ PASS |
| Notification href scheme (no `/app`, slug-carrying) | `pnpm test convex/notifications.test.ts` | included in 13/13 passed run | ✓ PASS |
| Removing a Member clears Focused Startup | `pnpm test convex/teams/members.test.ts` | included in 13/13 passed run (test name: "removing a Member clears their Focused Startup") | ✓ PASS |
| No `/app`-prefixed href anywhere in the backend | `grep -rn 'href:' convex/ \| grep -v '.test.ts'` then manual inspection | every href either goes through `convex/lib/links.ts` builders or is the static `/invite/{token}` | ✓ PASS |
| No leftover `/app` routes/features or `ui/` directories | `find src/routes/app`, `find src/features/app`, `find src/features -type d -name ui` | all empty | ✓ PASS |
| Old hidden-state Startup API removed | `grep -rnE "getWorkspace\|setActive" convex/ src/` | no matches | ✓ PASS |

Full `pnpm build`/`pnpm check`/`pnpm test` (133/133) already reported passing at HEAD per task context; spot-checks above independently re-ran the subset of tests most directly tied to this phase's must-haves rather than re-running the whole suite.

### Human Verification Required

None. This phase's must-haves are all backend-testable or directly readable from static route/component wiring (no drag-and-drop, no real-time behavior, no external service integration in this phase's scope). The one open concern (WR-02, sidebar highlight for a cross-Startup Trial Cycle viewer) is a code-review finding with clear, already-documented reproduction steps and a proposed fix — it does not need a human to *discover* it, only to decide whether to schedule the fix now or carry it forward.

### Gaps Summary

No blocking gaps. Two items worth the developer's attention, both already tracked in `01-REVIEW-DISPOSITION.md` as `open`:

1. **Documentation drift, not a code gap:** `.planning/REQUIREMENTS.md` (at HEAD, confirmed via `git show HEAD:.planning/REQUIREMENTS.md`) still lists `SHELL-01` as `[ ]` and "Pending" in its Traceability table, even though 01-06-SUMMARY.md and 01-07-SUMMARY.md both declare `requirements-completed: [SHELL-01, ...]` and the sidebar/mobile-tab-bar code fully satisfies it (verified above). Every other Phase 1 requirement (SHELL-02..07) is correctly marked `[x]`/"Complete". Recommend updating REQUIREMENTS.md's SHELL-01 line and Traceability row to Complete — a one-line documentation fix, no code change needed.
2. **WR-02 (open, warning-severity):** `useFocusedStartup()` can highlight the wrong Startup in the sidebar/switcher for a User who is a Member/Founder of one Startup but views a Trial Cycle at another Startup where they're a non-Member Participant (since that route is deliberately exempt from `MemberGate`). Confirmed still reproducible in the current tree. Does not corrupt the screen's own data (that stays correctly slug-scoped) and does not violate any stated must-have, but is a real UX inconsistency for exactly the multi-Startup users this shell targets. Recommend fixing per the review's suggested one-line change (`slug ? (matched ?? null) : ...`) in a near-term follow-up, or explicitly deferring it with a tracked issue reference.

Neither item blocks the Phase 1 goal: users can navigate the full shell (sidebar, switcher, palette, shortcuts) with every Startup-scoped URL correctly carrying its slug, dark-only styling in place, and public pages correctly gated by auth state.

---

_Verified: 2026-09-29T04:15:00Z_
_Verifier: Claude (gsd-verifier)_
