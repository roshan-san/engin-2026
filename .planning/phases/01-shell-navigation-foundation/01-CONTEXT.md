# Phase 1: Shell & Navigation Foundation - Context

**Gathered:** 2026-09-28
**Status:** Ready for planning

<domain>
## Phase Boundary

The Linear-style app frame that every later screen lives in, plus the backend it needs:

- **Shell:** the desktop sidebar, the mobile tab bar, top bar and sheets, the Startup switcher, the ⌘K command palette, the single shortcut registry, the `?` shortcut sheet, and the layouts (the signed-in shell vs. the signed-out public header).
- **Routes:** the new scheme with no `/app` prefix. Startup-scoped screens live under `/s/$slug/...`, and `/` sends a signed-in User to My Pulses.
- **Look:** dark-only design tokens and the new typeface, replacing the stock theme.
- **Folders:** reorganised per ADR-0006 into `src/shell/`, `features/<domain>/<feature>/pages/`, and the frontend-only `discover`/`marketing`.
- **Backend:** a Startup-by-slug query (the Startup, the caller's role, and the Plan with its limits and usage), a memberships list for the switcher, and the rename of `users.activeStartupId` → `focusedStartupId`, which is cleared when membership ends.

Requirements: SHELL-01…SHELL-07.

**Not in this phase:** the real content of My Pulses, Cycles, Inbox, Hiring, Team, Activity, Threads, Settings/Billing, and the merged Discover. Phases 2–6 build those. In Phase 1 they are route stubs.

</domain>

<decisions>
## Implementation Decisions

### Look & feel (SHELL-04)
- **D-01:** The choices are made now and tuned later. There is no separate prototype or sketch step. Tokens are defined once in `src/styles/globals.css`, so changing them later is cheap.
- **D-02:** The typeface is **Geist**, from `@fontsource-variable/geist`. It is the only typeface. There is no mono font; keycaps and counts use tabular numbers.
- **D-03:** The accent is **Twitter blue `#1D9BF0`** (about `hsl(204 88% 53%)`). The user first picked lime, then switched to Twitter-like blue. Because the accent is blue, success states (Verified Pulse, passed Verdict, accepted Offer) can use a normal green token (X uses `#00BA7C`).
- **D-04:** The background is **pure black, "Lights out"**: page `#000`, raised surfaces `#16181C`, borders `#2F3336`. Muted text and destructive colours follow the same palette (X: muted `#71767B`, foreground `#E7E9EA`, destructive `#F4212E`). These are starting values; the exact shades are Claude's discretion.
- **D-05:** Density is **compact and Linear-like**: 13–14px body text, ~32px rows and controls, touch targets growing to 44px on mobile.
- **D-06:** Corners are **soft-square everywhere, with no pills**: about a 6px radius on buttons, inputs, cards and menus. This replaces today's `--radius: 0.75rem`.
- **D-07:** The **sidebar is the same black as the page**, separated by a `#2F3336` hairline. The active nav item gets a subtle `#16181C` fill, white text and a blue icon.
- **D-08:** **Avatars are rounded-squares for everything**, people and Startups alike. Nothing is round.
- **D-09:** **Blue is used sparingly.** It appears only on the single primary action per screen, links, focus rings, the active nav icon, and unread counts. Everything else is white or grey on black.

### Screens between phases (SHELL-02, SHELL-06)
- **D-10:** The app is not launched and has no users, so **Phase 1 does not need to keep the app usable between phases**. Every screen a later phase rebuilds becomes a **bare empty-state stub route** in Phase 1. This covers My Pulses, Inbox, Threads, Cycles list and Cycle, Hiring, Trial Cycle, Team, Pitch editor, Activity, Settings/Billing, and profile edit.
- **D-11:** **Old `ui/` page components are deleted, but their `hooks/` and `components/` stay** (Convex wrappers, cards, forms) so later phases can reuse them. Fix any `/app/...` links inside what's kept so `pnpm check` passes. Old `/app/*` routes are removed with no redirects, as #19 specifies.
- **D-12:** These pages **move over as-is** (new route, `ui/`→`pages/`, restyled only through the new tokens):
  - the public Pitch (`/startup/$slug`), the public profile (`/u/$username`) and Discover (today's `ExplorePage` at `/discover`), because SHELL-03 requires them inside the shell
  - **Create Startup** and **Accept Invite** (`/invite/$token`), so the switcher, `/s/$slug` resolution, the non-Member redirect and Focused-Startup behaviour can be tested with real Founder and Member data
- **D-13:** The **rename `users.activeStartupId` → `focusedStartupId` happens in Phase 1 as a plain schema rename, with no migration.** There are no users, so dev data gets reset or patched by hand. **PLAN-05 (Phase 6) should drop "renames the Focused-Startup field" from its migration list**, and the planner should update REQUIREMENTS.md/ROADMAP.md to match. **Reversibility:** reversible. No production data exists and every call site is in this repo.

### Mobile navigation (SHELL-01)
- **D-14:** The bottom tab bar stays exactly as specified: **Inbox · My Pulses · Startup · Discover**.
- **D-15:** Tapping the **Startup tab opens a bottom sheet**, not a screen. The sheet shows the switcher at the top (the current Startup, tap to change), then Cycles, Hiring, Team, Pitch and Activity. It is the mobile twin of the desktop sidebar's Focused-Startup section. With no Startup, the sheet offers "Create a Startup".
- **D-16:** **Threads live inside Inbox on mobile only**, as a Notifications | Threads segment toggle at the top of the Inbox screen. Desktop keeps Threads as its own sidebar item, per SHELL-01. The routes are the same (`/inbox`, `/threads`); only how you reach them differs.
- **D-17:** Mobile gets a **slim top bar**. The avatar sits top-left and opens an account sheet (profile, Score chip, sign out). The screen title is centred. A search icon top-right opens the command palette full-screen, which is how mobile reaches ⌘K.

### Palette & search scope (SHELL-05)
- **D-18:** ⌘K / Ctrl+K lists screens, every Startup the User belongs to (picking one focuses it), and the **Cycles of the Focused Startup only** that the caller can see. This reuses the existing per-Startup Cycle query and Cycle-scoped visibility (Members see only their Cycles). There is no cross-Startup Cycle search.
- **D-19:** The **registry holds only working entries in Phase 1**: navigation, switching Startup, Create Startup, and opening the `?` sheet. **Each later phase registers its own entries.** Phase 2 adds `C` / Create Pulse and Create Cycle; Phase 4 adds Create Role / Trial Cycle and `J`/`K`. The UI never shows disabled "coming soon" entries.
- **D-20:** **`/` focuses the current page's search field if the page has registered one** (e.g. Discover), **and otherwise opens the palette in search mode**. Pages register their search input with the shell, so `/` always does something.

### Carried forward from issue #19 and ADR-0006 (already locked, not re-discussed)
- The sidebar order is: personal (Inbox, My Pulses, Threads, spanning every Startup) → Startup switcher + Focused-Startup section (Cycles, Hiring, Team, Pitch, Activity) → Discover.
- `/` sends a signed-in User to My Pulses. A non-Member opening `/s/$slug/...` is sent to the public Pitch, except on a Trial Cycle screen, where the existing Trial Cycle access rule decides. A pathless layout route gates signed-in pages.
- The root layout picks the app shell when signed in and the public header when signed out. A page that requires sign-in redirects to sign-in instead of breaking.
- `focusedStartupId` is set whenever the User opens a screen scoped to a Startup they belong to, and cleared when they stop belonging to it. A Startup the User creates becomes Focused immediately.
- One registry entry is `{ key, label, scope, action }`. It feeds the palette, tooltip and menu hints, and the `?` sheet. Single-key shortcuts are ignored while focus is in an editable field. There are no two-key chords.
- The user-level Pro indicators (the Score chip's Pro state and the header Upgrade button) are removed. The Score chip moves into the account menu.
- The libraries allowed in this phase are `@fontsource-variable/geist` and the shadcn primitives the shell needs (sidebar, command, dialog, sheet, tabs, tooltip, and popover/select/toggle-group only if used). There is no animation or form library. dnd-kit belongs to Phase 2.

### Claude's Discretion
- The exact grey and green shades, the token names (e.g. adding `--success`), and the type scale, all within D-02 to D-09.
- Breakpoints (where the sidebar hands over to the tabs) and whether the desktop sidebar can collapse.
- What the stub empty states contain (the title plus an `EmptyState`, reusing `src/components/shared/EmptyState.tsx`).
- The platform-aware shortcut label (⌘ on macOS, Ctrl elsewhere).
- The restyle of the signed-out public header, reusing `PublicHeader.tsx`.
- **The slug query's Plan block before Phase 6.** SHELL-07 wants the Plan, limits and usage in Phase 1, but the Plan only moves to the Startup in Phase 6. Recommended approach: ship the final return shape now and derive it from existing data (the Founders' `planTier` via `isProUser`, with limits from `convex/lib/limits.ts`). Phase 6 then swaps the source, not the shape.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture and URL scheme
- `docs/adr/0006-frontend-is-a-shell-plus-domain-features.md`: the `src/shell/` + `features/<domain>/<feature>/pages/` split, `/s/$slug` URLs, no `/app` prefix, dark-only, and the root layout choosing the shell or the public header.
- `docs/adr/0004-code-is-grouped-by-domain-not-listed-flat.md`: the backend half, which still holds (`convex/{people,teams,hiring,work}/`, `convex/lib/<domain>/`).
- `docs/adr/0005-startups-pay-talent-and-visibility-are-never-for-sale.md`: the Plan belongs to the Startup, which affects the Plan block in the slug query.

### Spec
- GitHub issue **#19** (`gh issue view 19`). Relevant sections:
  - "Solution → Navigation and shell / Keyboard"
  - User Stories 1–19, 50, 111, 113
  - "Implementation Decisions → Frontend structure and routing"
  - "Implementation Decisions → Shortcuts / Visuals / Libraries / Existing frontend changes"
  - "Implementation Decisions → Backend: Focused Startup and Startup lookup"
  - "Testing Decisions → Seam 1" (looking up a Startup by slug, including non-Members and Participants)
- `.planning/REQUIREMENTS.md`: SHELL-01 to SHELL-07. PLAN-05 needs the rename item dropped, per D-13.
- `.planning/ROADMAP.md`: the Phase 1 goal and success criteria.

### Project rules
- `CLAUDE.md`: commands, conventions, semantic tokens only, mobile-first, files under 250 lines, thin pages.
- `CONTEXT.md` (repo root): the glossary. Use Focused Startup, Inbox, My Pulses, Discover, Capacity and Plan, and avoid the listed synonyms.
- `convex/_generated/ai/guidelines.md`: Convex coding guidelines for the new queries.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/app/ui/StartupSwitcher.tsx`, `UserMenu.tsx`, `ScoreChip.tsx`, `NotificationBell.tsx` and `hooks/useWorkspace.ts`, `useCurrentUser.ts`, `useNotifications.ts` move into `src/shell/` and get rewritten. `useWorkspace` currently reads the hidden-state `getWorkspace`, which gets replaced.
- `src/components/shared/PublicHeader.tsx` is the basis for the signed-out header, and `src/components/shared/EmptyState.tsx` is used for the stub screens.
- `src/components/globals/*` (spinner, error, not-found) stay as router-level screens.
- `tw-animate-css` is already imported, so it can handle sheet and palette transitions without an animation library.
- The shadcn primitives present today are button, card, dropdown-menu, input, avatar, badge, label, skeleton, sonner and textarea. Sidebar, command, dialog, sheet, tabs and tooltip still need adding via `pnpm ui`.

### Established Patterns
- Routes are thin (`createFileRoute` plus a page component). Hooks are thin wrappers over `useQuery`/`useMutation`.
- Every Convex function starts with `requireUserId(ctx)`, then `requireMembership`/`requireFounderMembership` (`convex/lib/teams/membership.ts`). Every query uses `withIndex`.
- The current shell is a top-header layout (`src/features/app/layout/AppShell.tsx`, `AppNav.tsx` with header and dock placements, `BuildFrame.tsx`/`BuildNav.tsx`). All of it is replaced.
- `src/styles/globals.css` defines shadcn-style tokens including `--sidebar-*`. The values are replaced; the token names are kept.

### Integration Points
- **`activeStartupId` call sites to rename:** `convex/schema.ts:131`, `convex/teams/startups.ts:93,145,261` (`getWorkspace`, `create`, `setActive`), `convex/people/users.ts:94`, `convex/lib/teams/invites.ts:95`. Membership-removal paths also need to clear `focusedStartupId`.
- **Notification `href`s are hard-coded `/app/...` strings in the backend** and must move to the new scheme. Trial Cycle links need the Startup slug (`/s/$slug/trials/$id`):
  - `convex/hiring/applications.ts` (5 places)
  - `convex/hiring/offers.ts:52`
  - `convex/lib/hiring/offers.ts:17`
  - `convex/lib/hiring/threads.ts:86`
  - `convex/lib/hiring/trialCycles.ts:70,84`
  - `convex/lib/hiring/verdicts.ts:83`
  - `convex/lib/work/cycles.ts:69`
  - `convex/lib/work/pulses.ts:165`
- `convex/teams/startups.ts` `getWorkspace` (hidden-state lookup) is replaced by the slug query plus a memberships list. `setActive` becomes the "focus" write.
- `convex/work/cycles.ts` `list` feeds the palette's Cycle entries (Focused Startup only, D-18).
- `src/routes/__root.tsx` gains the signed-in/signed-out layout switch. `src/routes/app/**` is deleted. `src/routes/explore/` becomes `src/routes/discover/`.
- Backend tests for the slug query and focus/clear behaviour belong in `convex/teams/*.test.ts`, using the `convex/test.helpers.ts` helpers (`signUp`, `setUpStartup`, `joinAsMember`).

</code_context>

<specifics>
## Specific Ideas

- "Twitter-like": the accent is Twitter blue `#1D9BF0` on X's "Lights out" pure-black palette. The mobile top bar follows X's mobile app, with the avatar top-left opening an account sheet.
- Linear is the reference for density and the keyboard-first feel. Blue plus black should carry the Twitter identity, not pill shapes (the user explicitly rejected pills).

</specifics>

<deferred>
## Deferred Ideas

None. The discussion stayed within the phase scope.

Considered and not chosen, so it shouldn't be re-proposed without a reason: palette search across every Startup's Cycles (D-18 keeps it to the Focused Startup), and merging Threads into Inbox on desktop (D-16 keeps it mobile-only).

</deferred>

---

*Phase: 01-shell-navigation-foundation*
*Context gathered: 2026-09-28*
