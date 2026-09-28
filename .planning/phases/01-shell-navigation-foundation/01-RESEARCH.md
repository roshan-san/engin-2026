# Phase 1: Shell & Navigation Foundation - Research

**Researched:** 2026-09-28
**Domain:** TanStack Router file-based routing + shadcn/ui shell composition + Convex backend rename/query work
**Confidence:** HIGH (routing mechanics, shadcn primitives, backend call-site inventory — all verified by reading this repo's code and the router/shadcn docs) / MEDIUM (Plan-block shape, exact route-name choices — these are recommendations, not locked facts)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Look & feel (SHELL-04)**
- D-01: Tokens chosen now, tuned later, defined once in `src/styles/globals.css`.
- D-02: Typeface is Geist (`@fontsource-variable/geist`), the only typeface, no mono font; keycaps/counts use tabular numbers.
- D-03: Accent is Twitter blue `#1D9BF0` (~`hsl(204 88% 53%)`); success states use a green token separate from the blue accent (X uses `#00BA7C`).
- D-04: Background is pure black "Lights out": page `#000`, raised surfaces `#16181C`, borders `#2F3336`, muted `#71767B`, foreground `#E7E9EA`, destructive `#F4212E`. Starting values; exact shades are Claude's discretion.
- D-05: Density is compact/Linear-like: 13–14px body, ~32px rows/controls, 44px touch targets on mobile.
- D-06: Corners are soft-square everywhere, no pills: ~6px radius on buttons/inputs/cards/menus, replacing `--radius: 0.75rem`.
- D-07: Sidebar is the same black as the page, separated by a `#2F3336` hairline; active nav item gets subtle `#16181C` fill, white text, blue icon.
- D-08: Avatars are rounded-squares for everything (people and Startups), nothing round.
- D-09: Blue is used sparingly — one primary action per screen, links, focus rings, active nav icon, unread counts. Everything else white/grey on black.

**Screens between phases (SHELL-02, SHELL-06)**
- D-10: App not launched, no users — Phase 1 does not need to keep the app usable between phases. Every screen a later phase rebuilds becomes a bare empty-state stub route: My Pulses, Inbox, Threads, Cycles list and Cycle, Hiring, Trial Cycle, Team, Pitch editor, Activity, Settings/Billing, profile edit.
- D-11: Old `ui/` page components are deleted; their `hooks/` and `components/` stay for later phases to reuse. Fix any `/app/...` links inside what's kept so `pnpm check` passes. Old `/app/*` routes removed with no redirects.
- D-12: These pages move over as-is (new route, `ui/`→`pages/`, restyled only through new tokens): public Pitch (`/startup/$slug`), public profile (`/u/$username`), Discover (today's `ExplorePage` at `/discover`); Create Startup and Accept Invite (`/invite/$token`).
- D-13: Rename `users.activeStartupId` → `focusedStartupId` happens in Phase 1 as a plain schema rename, no migration (no users exist). PLAN-05 (Phase 6) drops "renames the Focused-Startup field" from its migration list; planner updates REQUIREMENTS.md/ROADMAP.md to match. Reversible.

**Mobile navigation (SHELL-01)**
- D-14: Bottom tab bar is exactly: Inbox · My Pulses · Startup · Discover.
- D-15: Tapping Startup opens a bottom sheet (not a screen): switcher at top, then Cycles, Hiring, Team, Pitch, Activity — mobile twin of the desktop sidebar's Focused-Startup section. With no Startup: "Create a Startup".
- D-16: Threads live inside Inbox on mobile only (Notifications | Threads segment toggle at top of Inbox). Desktop keeps Threads as its own sidebar item. Routes are the same (`/inbox`, `/threads`); only how you reach them differs.
- D-17: Mobile gets a slim top bar: avatar top-left opens an account sheet (profile, Score chip, sign out); screen title centred; search icon top-right opens the command palette full-screen (mobile's route to ⌘K).

**Palette & search scope (SHELL-05)**
- D-18: ⌘K/Ctrl+K lists screens, every Startup the User belongs to (picking one focuses it), and the Cycles of the Focused Startup only that the caller can see. Reuses the existing per-Startup Cycle query and Cycle-scoped visibility. No cross-Startup Cycle search.
- D-19: Registry holds only working entries in Phase 1: navigation, switching Startup, Create Startup, opening the `?` sheet. Later phases register their own entries (Phase 2: `C`/Create Pulse/Create Cycle; Phase 4: Create Role/Trial Cycle, `J`/`K`). UI never shows disabled "coming soon" entries.
- D-20: `/` focuses the current page's search field if the page has registered one (e.g. Discover), otherwise opens the palette in search mode. Pages register their search input with the shell.

**Carried forward from issue #19 / ADR-0006 (already locked)**
- Sidebar order: personal (Inbox, My Pulses, Threads, spanning every Startup) → Startup switcher + Focused-Startup section (Cycles, Hiring, Team, Pitch, Activity) → Discover.
- `/` sends a signed-in User to My Pulses. A non-Member opening `/s/$slug/...` is sent to the public Pitch, except on a Trial Cycle screen, where the existing Trial Cycle access rule decides.
- A pathless layout route gates signed-in pages.
- The root layout picks the app shell when signed in and the public header when signed out. A page requiring sign-in redirects to sign-in instead of breaking.
- `focusedStartupId` is set whenever the User opens a screen scoped to a Startup they belong to, cleared when they stop belonging to it. A Startup the User creates becomes Focused immediately.
- One registry entry is `{ key, label, scope, action }`. Feeds the palette, tooltip/menu hints, the `?` sheet. Single-key shortcuts ignored while focus is in an editable field. No two-key chords.
- User-level Pro indicators (Score chip's Pro state, header Upgrade button) are removed. Score chip moves into the account menu.
- Libraries allowed this phase: `@fontsource-variable/geist` and shadcn primitives the shell needs (sidebar, command, dialog, sheet, tabs, tooltip, and popover/select/toggle-group only if used). No animation or form library. dnd-kit belongs to Phase 2.

### Claude's Discretion
- Exact grey/green shades, token names (e.g. adding `--success`), type scale — within D-02 to D-09.
- Breakpoints (sidebar → tabs handover) and whether the desktop sidebar can collapse.
- Stub empty-state contents (title + `EmptyState`, reusing `src/components/shared/EmptyState.tsx`).
- Platform-aware shortcut label (⌘ on macOS, Ctrl elsewhere).
- Restyle of the signed-out public header, reusing `PublicHeader.tsx`.
- The slug query's Plan block before Phase 6: ship the final return shape now, derive it from existing data (Founders' `planTier` via `isProUser`, limits from `convex/lib/limits.ts`); Phase 6 swaps the source, not the shape.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Considered and rejected: palette search across every Startup's Cycles (D-18 keeps it Focused-Startup only); merging Threads into Inbox on desktop (D-16 keeps it mobile-only).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHELL-01 | Sidebar (Inbox/My Pulses/Threads, switcher, Focused-Startup section) + mobile bottom tab bar | Architecture Patterns → Shell composition; Code Examples → Sidebar/mobile tab bar |
| SHELL-02 | `/s/$slug/...` URLs, no `/app` prefix, reopens on last Focused Startup, "Create a Startup" when none | Architecture Patterns → Route tree; Backend section → slug query, `focusedStartupId` |
| SHELL-03 | Signed-in Users browse public pages inside shell; signed-out see `PublicHeader`; sign-in redirect | Architecture Patterns → `_shell` pathless layout, `_authed` gate |
| SHELL-04 | Dark-only, one accent, one typeface | Standard Stack → Geist; `globals.css` token plan |
| SHELL-05 | ⌘K palette, `?` sheet, one shortcut registry, ignore single-key in editable fields | Architecture Patterns → Shortcut registry; Common Pitfalls → Command input vs global handler |
| SHELL-06 | Frontend reorganised per ADR-0006 (`src/shell/`, `pages/`, frontend-only `discover`/`marketing`) | Architecture Patterns → Recommended Project Structure |
| SHELL-07 | Slug-by-Startup query (Startup, role, Plan block), memberships list, `focusedStartupId` rename+clear | Backend section → full query/mutation design, call-site inventory |
</phase_requirements>

## Summary

This phase has no unknown framework to learn — TanStack Router 1.170, Convex 1.46 and shadcn/ui are all already in use in this repo. The research risk is entirely in **getting the routing composition right** (a pathless layout that swaps chrome by auth state, nested under it a second pathless layout that gates sign-in, and under that a Startup-slug layout that resolves membership) and in **not fighting the shadcn Sidebar's built-in mobile behaviour**, which auto-swaps to a Sheet triggered by a hamburger — the opposite of this phase's persistent bottom-tab-bar-plus-custom-sheet design (D-14/D-15).

The codebase already contains the exact pattern this phase needs for auth gating: `LandingPage.tsx` and `AppLayout.tsx` both do `useConvexAuth()` → loading spinner → `<Navigate>`, entirely in the React component tree, not in a router `beforeLoad`. This matters because TanStack Router's textbook auth-guard pattern (`beforeLoad` + `context.auth`) assumes a synchronously-available auth context, which Convex Auth does not provide client-side (it is a React hook with an `isLoading` state). The recommendation is to keep the proven component-level pattern, just move it into pathless layout route components instead of inline in feature pages.

The backend half is small and well-scoped: rename one field across 5 already-identified call sites, add one slug-lookup query, one memberships-list query, and update ~13 hard-coded `/app/...` notification `href` strings across 8 files. The one open design question — the shape of the Plan block ahead of PLAN-01/Phase 6 — has no existing precedent in the code to copy (billing today is 100% per-User, not per-Startup), so this research proposes a concrete shape and derivation, flagged for user confirmation.

**Primary recommendation:** Build the route tree as three nested pathless layouts (`_shell` picks chrome by auth state → `_authed` redirects to sign-in → `s.$slug` resolves the Startup and gates membership, with the Trial Cycle route explicitly exempted from that last gate), reuse the existing `useConvexAuth()`-in-component gating pattern rather than router `beforeLoad`, and do not let the shadcn `Sidebar` component drive mobile layout — hide it below `md:` and hand-build the bottom tab bar and Startup sheet with the raw `Sheet` primitive.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Sidebar / mobile tabs / command palette / shortcut registry | Browser / Client | — | Pure UI state (open/closed, focused index); no data of its own beyond what queries feed it |
| Startup switcher list, slug resolution, role/Plan lookup | API / Backend (Convex query) | Browser (client cache via `useQuery`) | Membership and Plan are authoritative server data; must not be trusted from client state |
| Route-level auth gating (redirect to sign-in) | Browser / Client (React Router component tree) | — | Convex Auth's `isAuthenticated`/`isLoading` is only available as a React hook, not synchronously in `beforeLoad` |
| Route-level Startup membership gating (redirect to Pitch) | Browser / Client (component, backed by the slug query) | API / Backend (the query still enforces access on every read) | UI redirect is a UX convenience; the *authorization* is enforced again server-side by `requireMembership`/`requireTrialAccess` on every Convex call, per this repo's existing pattern |
| `focusedStartupId` persistence | API / Backend (Convex mutation, patches `users`) | — | Must survive reload/reopen; URL slug is the source of truth per-request, this field is only "where to land next" |
| Dark theme tokens, typeface | Browser / Client (CSS) | — | No backend involvement |
| Notification `href` scheme | API / Backend (string built at write time) | Browser (Link/Navigate consumes it) | `href`s are stored in the `notifications` table at insert time; changing the scheme is a backend-only edit, no migration needed (no data yet) |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-router` | 1.170.38 (already installed) | File-based routing, pathless layouts, `<Navigate>` | Already the project's router; no alternative considered |
| `convex` | 1.46.0 (already installed) | Slug query, memberships query, `focusedStartupId` mutation | Already the project's backend |
| `@fontsource-variable/geist` | `5.3.0` `[VERIFIED: npm registry — package-legitimacy check + npm view, 2026-07-19 publish, 2.4M weekly downloads, repo github.com/fontsource/font-files]` | Self-hosted variable Geist font, no external font CDN | D-02 names this exact package |
| shadcn `sidebar` | CLI-managed, no independent npm version | Desktop sidebar building blocks (`Sidebar`, `SidebarProvider`, `SidebarMenu*`) | Named in CONTEXT.md's allowed-library list |
| shadcn `command` | CLI-managed; pulls `cmdk` `1.1.1` `[VERIFIED: npm registry — package-legitimacy check, 52M weekly downloads, repo github.com/pacocoursey/cmdk]` | Command palette (⌘K), fuzzy filtering, keyboard nav | Same |
| shadcn `dialog` | CLI-managed; pulls `@radix-ui/react-dialog` | Base primitive `sheet` and `command`'s `CommandDialog` build on | Same |
| shadcn `sheet` | CLI-managed; built on the Dialog primitive `[CITED: github.com/shadcn-ui/ui sheet.tsx source]` | Mobile Startup sheet (D-15), mobile account sheet (D-17), mobile Inbox item view (later phase) | Same |
| shadcn `tabs` | CLI-managed; pulls `@radix-ui/react-tabs` | Mobile Inbox's Notifications\|Threads segment toggle (D-16) | Same |
| shadcn `tooltip` | CLI-managed; pulls `@radix-ui/react-tooltip` | Shortcut hints on nav items/buttons (SHELL-05) | Same |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn `popover` / `select` / `toggle-group` | CLI-managed | Only if a concrete Phase 1 screen needs one | CONTEXT.md: add only if actually used — don't pre-install |
| `tw-animate-css` | 1.4.0 (already installed) | Sheet/palette open-close transitions | Already imported in `globals.css`; CONTEXT.md explicitly rules out adding an animation library, and this one is already present |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn `Sidebar`'s built-in mobile Sheet-swap | A hand-rolled `<nav>` for desktop + separate bottom tab bar for mobile | CONTEXT.md's design (persistent bottom tabs, not a hamburger-triggered sheet) is incompatible with `Sidebar`'s default `isMobile` behaviour (see Common Pitfalls). Recommendation: use `Sidebar`'s desktop-only rendering path (wrap it so it only mounts `md:` and up, or don't use `SidebarProvider`'s mobile state at all), and build the bottom tab bar as a plain component using the same `Sheet` primitive directly for the Startup sheet. |
| TanStack Router `beforeLoad` + router-context auth guard (textbook pattern) | Component-level `useConvexAuth()` + `<Navigate>`, already proven in this repo (`AppLayout.tsx`, `LandingPage.tsx`) | The textbook pattern assumes synchronous/cached auth context (e.g. SSR frameworks). Convex Auth's `useConvexAuth()` has an `isLoading` state that can't be awaited inside `beforeLoad` without wiring a router `context.auth` promise this repo doesn't have. Keep the working pattern; move it into layout route components. |

**Installation:**
```bash
pnpm add @fontsource-variable/geist
pnpm ui sidebar command dialog sheet tabs tooltip
```
(`pnpm ui` = `pnpm dlx shadcn@latest add`, confirmed to accept multiple component names in one invocation `[CITED: github.com/shadcn-ui/ui add-multiple-components docs]`.)

**Version verification:** `@fontsource-variable/geist@5.3.0` and `cmdk@1.1.1` confirmed live via `npm view <pkg> version` on 2026-09-28; both pass `gsd-tools query package-legitimacy check`. The Radix packages (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`) will be added automatically by the shadcn CLI when those components are added — do not hand-pin their versions; let the CLI resolve what its component source imports.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@fontsource-variable/geist` | npm | published 2026-07-19 (this exact version; package family is older) | 2,399,223/wk | github.com/fontsource/font-files | OK | Approved |
| `cmdk` | npm | published 2025-03-14 (this exact version; package is years old) | 52,353,196/wk | github.com/pacocoursey/cmdk | OK | Approved (pulled transitively by shadcn `command`, not installed directly — still audited because it lands in `package.json`) |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

The Radix packages (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`) pulled in by `pnpm ui sidebar command dialog sheet tabs tooltip` were not independently audited here — they are the same trusted-publisher family (`@radix-ui/*`) as four packages already in this repo's `package.json` (`react-avatar`, `react-dropdown-menu`, `react-label`, `react-slot`). `[ASSUMED]` low risk on that basis; if the shadcn CLI resolves to the newer unified `radix-ui` meta-package instead of per-primitive packages (a possible CLI-version-dependent behavior), that would be a deviation from this repo's existing per-primitive convention — flag for a quick look after running `pnpm ui`, not a blocker.

## Architecture Patterns

### System Architecture Diagram

```
Browser
  │
  ├─ GET any URL
  ▼
__root.tsx  (AppProviders: ConvexAuthProvider + Outlet + Toaster — unchanged, always renders)
  │
  ▼
routes/_shell/route.tsx   (pathless layout — picks chrome by auth state)
  │
  ├─ useConvexAuth() ── isLoading ──────────────► <GlobalSpinner/>
  │
  ├─ !isAuthenticated ──────────────────────────► <PublicHeader/> + <Outlet/>
  │                                                 (renders: /discover, /startup/$slug,
  │                                                  /u/$username, /invite/$token — same
  │                                                  components signed-in Users see)
  │
  └─ isAuthenticated ───────────────────────────► <AppShell/> (sidebar/mobile-tabs) + <Outlet/>
        │
        ▼
    routes/_shell/_authed/route.tsx   (pathless layout — redirect to sign-in if ever
        │                              reached unauthenticated; mostly a safety net since
        │                              _shell already branched on auth)
        │
        ├─ /inbox, /my-pulses, /threads, /startups/new  (personal, no slug)
        │
        └─ routes/_shell/_authed/s/$slug/route.tsx   (resolves Startup by slug via
              │                                        api.teams.startups.getBySlug,
              │                                        sets focusedStartupId as a side
              │                                        effect, exposes {startup, role}
              │                                        to children via route context)
              │
              ├─ role === null AND route is NOT the Trial Cycle route
              │     └──────────────────────────────► <Navigate to={"/startup/"+slug}/>
              │                                        (public Pitch — non-Member fallback)
              │
              ├─ role === null AND route IS the Trial Cycle route
              │     └─ delegate to requireTrialAccess-equivalent check
              │        (Participant/Applicant may still view)
              │
              └─ role !== null (Member or Founder)
                    └─ /s/$slug/cycles, /s/$slug/cycles/$cycleId, /s/$slug/hiring,
                       /s/$slug/hiring/trials/$trialCycleId, /s/$slug/team,
                       /s/$slug/pitch, /s/$slug/activity, /s/$slug/settings

Convex backend (unchanged tiers, new functions only)
  teams/startups.ts   getBySlug(slug) -> {startup, role|null, plan{tier,limits,usage}}
                       listMemberships() -> [{startup, role}]   (feeds switcher + palette)
                       focus(startupId) -> void                  (renamed from setActive,
                                                                    patches users.focusedStartupId)
  people/users.ts      getMe() -> ...focusedStartupId (renamed field)
```

### Recommended Project Structure
Per ADR-0006, verified against the existing `src/features/app/*` files this phase relocates:
```
src/
├── shell/                        # NEW — app frame, no backend counterpart
│   ├── layout/
│   │   ├── AppShell.tsx          # desktop sidebar + content area (replaces AppShell.tsx)
│   │   ├── MobileShell.tsx       # bottom tab bar + slim top bar (D-17)
│   │   └── PublicShell.tsx       # wraps PublicHeader.tsx for signed-out Users
│   ├── sidebar/
│   │   ├── AppSidebar.tsx        # personal + Startup switcher + Focused-Startup section
│   │   └── StartupSwitcher.tsx   # moved from features/app/ui/, rewritten off the new query
│   ├── mobile/
│   │   ├── BottomTabBar.tsx      # D-14 (Inbox · My Pulses · Startup · Discover)
│   │   ├── StartupSheet.tsx      # D-15 (Sheet primitive, not Sidebar's mobile mode)
│   │   └── AccountSheet.tsx      # D-17 (avatar tap target on mobile)
│   ├── command/
│   │   ├── CommandPalette.tsx    # ⌘K/Ctrl+K (shadcn CommandDialog)
│   │   └── ShortcutSheet.tsx     # `?` sheet, renders the registry
│   └── shortcuts/
│       ├── registry.ts           # { key, label, scope, action }[] — single source of truth
│       └── useShortcuts.ts       # global keydown listener, ignores editable fields
├── features/
│   ├── people/…/pages/           # ui/ renamed to pages/ (ADR-0006)
│   ├── teams/…/pages/
│   ├── hiring/…/pages/
│   ├── work/…/pages/
│   ├── discover/                 # NEW frontend-only surface, composes teams/hiring/people cards
│   └── marketing/                # frontend-only: landing, pricing (unchanged location)
├── components/
│   ├── ui/                       # shadcn primitives (unchanged location)
│   ├── shared/                   # EmptyState.tsx, PublicHeader.tsx (unchanged)
│   └── globals/                  # router-level spinner/error/not-found (unchanged)
└── routes/
    ├── __root.tsx                # unchanged
    ├── index.tsx                 # unchanged path, same self-gating pattern as today
    ├── _shell/
    │   ├── route.tsx             # picks AppShell vs PublicHeader by auth state
    │   ├── discover/index.tsx    # was routes/explore/index.tsx
    │   ├── startup/$slug.tsx     # unchanged path (public Pitch)
    │   ├── u/$username.tsx       # unchanged path (public profile)
    │   ├── invite/$token.tsx     # unchanged path (Accept Invite)
    │   └── _authed/
    │       ├── route.tsx         # redirect-to-sign-in safety net
    │       ├── inbox/index.tsx
    │       ├── my-pulses/index.tsx
    │       ├── threads/index.tsx
    │       ├── startups/new.tsx
    │       └── s/
    │           └── $slug/
    │               ├── route.tsx         # resolves Startup, sets Focused, gates non-Member
    │               ├── index.tsx         # redirect to cycles (or whichever default screen)
    │               ├── cycles/index.tsx
    │               ├── cycles/$cycleId.tsx
    │               ├── hiring/index.tsx
    │               ├── hiring/trials/$trialCycleId.tsx   # exempt from the membership gate
    │               ├── team/index.tsx
    │               ├── pitch/index.tsx
    │               ├── activity/index.tsx
    │               └── settings/index.tsx
```
Route-name choices under `s/$slug/` (`cycles`, `hiring`, `team`, `pitch`, `activity`, `settings`) are **Claude's discretion** — CONTEXT.md names the *sections* (Cycles, Hiring, Team, Pitch, Activity) but not their exact URL segments; the above follows the glossary directly and is the lowest-surprise choice.

### Pattern 1: Pathless layout picks chrome by auth state (not `beforeLoad`)
**What:** A pathless layout route (`_shell/route.tsx`) whose component checks `useConvexAuth()` and renders one of three things: a spinner while loading, `<PublicShell><Outlet/></PublicShell>` when signed out, `<AppShell><Outlet/></AppShell>` when signed in.
**When to use:** Whenever chrome (not access) needs to differ by auth state, on routes that must render for *both* signed-in and signed-out visitors (Discover, Pitch, profile, Accept Invite).
**Why not `beforeLoad`:** TanStack Router's own FAQ states the root route always renders and can't conditionally render — its prescribed fix is a (pathless) layout route, which is exactly this pattern `[CITED: github.com/tanstack/router docs/router/faq.md]`. But `beforeLoad`-based auth guards in the same docs assume a router `context.auth` that resolves synchronously or via an awaited promise — Convex Auth exposes only a React hook with `isLoading`, so gating happens in the layout's **component**, exactly as `AppLayout.tsx` and `LandingPage.tsx` already do in this repo today `[VERIFIED: src/features/app/layout/AppLayout.tsx:1-22; src/features/marketing/landing/ui/LandingPage.tsx:1-16]`.
**Example (adapted from the existing `AppLayout.tsx`):**
```tsx
// src/routes/_shell/route.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useConvexAuth } from "@convex-dev/auth/react";
import { GlobalSpinner } from "~/components/globals/GlobalSpinner";
import { PublicHeader } from "~/components/shared/PublicHeader";
import { AppShell } from "~/shell/layout/AppShell";

export const Route = createFileRoute("/_shell")({
	component: ShellLayout,
});

function ShellLayout() {
	const { isLoading, isAuthenticated } = useConvexAuth();

	if (isLoading) {
		return <GlobalSpinner />;
	}

	if (!isAuthenticated) {
		return (
			<div className="flex min-h-dvh flex-col">
				<PublicHeader />
				<Outlet />
			</div>
		);
	}

	return (
		<AppShell>
			<Outlet />
		</AppShell>
	);
}
```

### Pattern 2: `/` self-gates and stays OUTSIDE `_shell`
**What:** The landing route keeps its own inline header and its own `useConvexAuth()` → `<Navigate>` check, exactly as it does today; it is not wrapped by `_shell`.
**Why:** `LandingPage.tsx` already renders a bespoke marketing header (not `PublicHeader.tsx`) and already redirects signed-in Users away `[VERIFIED: src/features/marketing/landing/ui/LandingPage.tsx:1-29, header at lines 19-29 is Engin logo + Explore link, distinct from src/components/shared/PublicHeader.tsx]`. Neither issue #19's spec nor CONTEXT.md lists the landing page among the public pages that must render "inside the app shell" (that list is Pitch, profile, Discover). Reusing the existing self-redirect avoids a double-render (chrome flash) if `/` were nested under `_shell` and then immediately redirected.
**Change required:** retarget `<Navigate to="/app" />` → `<Navigate to="/my-pulses" />` (or whatever My Pulses' final path is) and the inline `Explore` link → `Discover` pointing at `/discover`.

### Pattern 3: Trial Cycle route is exempt from the blanket Startup-membership gate
**What:** `routes/_shell/_authed/s/$slug/route.tsx` resolves the Startup and role and would, by default, redirect any non-Member to the public Pitch — but the Trial Cycle screen must stay reachable by Participants and Applicants who are *not* Members, per the canonical access rule already enforced server-side by `requireTrialAccess` `[VERIFIED: convex/lib/hiring/trialCycles.ts:137-150 — "if (!membership && !isParticipant) { throw ... }"]`.
**How:** Don't perform the membership redirect inside the `s/$slug` layout route itself (which can't see which *child* route is being entered without inspecting `location.pathname`, which is fragile). Instead:
1. `s/$slug/route.tsx` fetches `getBySlug` and puts `{ startup, role }` into route context (or a React context) — no redirect here.
2. Every page under `s/$slug/` *except* the Trial Cycle page checks `role === null` itself and renders `<Navigate to={"/startup/"+slug} />` — mirroring the existing `requireMembership` pattern used on the backend for every other Startup-scoped query.
3. The Trial Cycle page instead calls a trial-specific query (mirroring `requireTrialAccess`) that allows Participants/Applicants through even when `role === null`.

This trades one central gate for several small per-page checks, but it is the same shape the *backend* already uses (no single "startup access" middleware exists there either — every function calls `requireMembership` or `requireTrialAccess` itself), so it stays consistent with this codebase's established pattern rather than inventing a new one.

### Pattern 4: `getBySlug` sets `focusedStartupId` as a side effect of a query — but Convex queries can't write
**Pitfall this avoids:** Convex `query` functions are read-only; they cannot call `ctx.db.patch`. Setting `focusedStartupId` "whenever the User opens a screen scoped to a Startup they belong to" (a locked decision) therefore cannot happen inside the `getBySlug` **query** itself.
**Recommended split:**
- `api.teams.startups.getBySlug` — a `query`, returns `{ startup, role, plan }`, called by the `s/$slug` route/loader on every navigation. No side effects.
- `api.teams.startups.focus` — a `mutation` (renamed from today's `setActive`), called once from the `s/$slug` layout's effect (e.g. `useEffect` keyed on `slug` + membership confirmed), patches `users.focusedStartupId`.
This mirrors the existing split: `getWorkspace` (query) vs `setActive` (mutation) `[VERIFIED: convex/teams/startups.ts:81-98 getWorkspace is a query; :256-264 setActive is a mutation]`.

### Anti-Patterns to Avoid
- **Using shadcn `Sidebar`'s built-in `isMobile` Sheet-swap for primary navigation:** its mobile mode renders the *entire* sidebar as a hamburger-triggered `Sheet` `[VERIFIED: shadcn sidebar.tsx source via Context7 — `if (isMobile) { return <Sheet open={openMobile} ...>` ]`. D-14/D-15 want a persistent bottom tab bar plus a separate, purpose-built Startup sheet reachable by tapping one tab — not a hamburger. Render `<Sidebar>` only inside a `hidden md:block` wrapper (or skip `SidebarProvider`'s `isMobile` branch entirely by not mounting `<Sidebar>` below the breakpoint), and build `BottomTabBar.tsx` + `StartupSheet.tsx` as independent components using the raw `Sheet` primitive.
- **Hand-editing `src/routeTree.gen.ts`:** it is regenerated by the TanStack Router Vite plugin on `pnpm dev`; CLAUDE.md already forbids this. Deleting `routes/app/**` and adding `routes/_shell/**` requires a `pnpm dev` (or `vite build`) pass to regenerate it — don't hand-patch the generated imports.
- **Redirecting inside `__root.tsx`:** confirmed impossible to gate — the root route always renders `[CITED: github.com/tanstack/router docs/router/faq.md "Can I conditionally render the Root Route component? No..."]`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Command palette fuzzy matching, keyboard nav (arrow keys, Enter, Esc), a11y | Custom filtered-list-plus-keydown component | shadcn `command` (wraps `cmdk`) | `cmdk` already solves fuzzy filtering, roving focus, and screen-reader semantics; this is exactly D-19/D-20's palette |
| Focus-trapped, ESC-closing, backdrop-click-closing sheet/dialog | Custom portal + focus-trap | shadcn `sheet`/`dialog` (Radix Dialog underneath) | Radix's Dialog primitive already handles focus trap, scroll lock, and ARIA; this repo already leans on Radix for dropdown/avatar/label |
| Mobile-vs-desktop breakpoint detection | A `window.innerWidth` listener sprinkled through components | shadcn's `useIsMobile` hook (installed alongside `sidebar`) | Already ships with the `sidebar` component add; matches the codebase's existing `md:` Tailwind breakpoint convention used in `AppShell.tsx`/`AppNav.tsx` today |
| Tooltip positioning/collision | Custom absolutely-positioned `<div>` | shadcn `tooltip` (Radix Tooltip) | Needed for shortcut hints on every nav item (SHELL-05); Radix handles viewport collision |

**Key insight:** every "don't hand-roll" item here is already an approved library in CONTEXT.md's locked library list — the risk in this phase isn't reaching for a forbidden library, it's mis-using an approved one (the Sidebar mobile-mode anti-pattern above) in a way that fights the locked design.

## Runtime State Inventory

> Scoped to the one rename this phase performs: `users.activeStartupId` → `users.focusedStartupId` (D-13).

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | No production users exist; dev data may hold `activeStartupId` values in the local Convex dev deployment, but D-13 explicitly says "dev data gets reset or patched by hand" — no migration function needed. | None (per locked decision) |
| Live service config | None — this is a schema field, not an external service setting. | None |
| OS-registered state | None. | None |
| Secrets/env vars | None — no env var references this field name. | None |
| Build artifacts | None — no compiled/installed artifact embeds the old field name. | None |
| **Code call sites (not a template category, but load-bearing for this rename)** | 5 read/write sites, all confirmed by reading the files: `convex/schema.ts:131` (field definition), `convex/teams/startups.ts:93` (`getWorkspace` read, being replaced by `getBySlug`/`listMemberships` anyway), `convex/teams/startups.ts:145` (`create` mutation sets it), `convex/teams/startups.ts:261` (`setActive` sets it — being renamed to `focus`), `convex/people/users.ts:94` (`getMe` returns it), `convex/lib/teams/invites.ts:95` (`redeemInvite` sets it) `[VERIFIED: each file read directly, line numbers confirmed against current content]` | Rename the field in all 6 locations in the same commit as the schema change |
| **Membership-removal clearing (D-13's "cleared when membership ends")** | **No membership-removal mutation exists anywhere in this codebase today.** `convex/lib/work/pulses.ts:190` has an `unassignPulsesInStartup` helper explicitly commented `"used when someone leaves the team"` but it has **zero callers** — it's forward-looking dead code, not wired to anything `[VERIFIED: grep for the function name across convex/ returns only its own definition and doc comment; no membership `ctx.db.delete` call site exists in the repo today]`. | **No action needed in Phase 1.** The "clear on removal" behavior has nothing to hook into yet — it belongs to whichever future phase (likely TEAM, Phase 3) adds a "leave Startup" or "remove Member" mutation. Don't build a membership-removal flow in this phase just to satisfy this clause; note it in that mutation's own future implementation instead. |

**Nothing found in category:** Stored data, Live service config, OS-registered state, Secrets/env vars, Build artifacts — verified by direct grep and file reads, not assumed.

## Common Pitfalls

### Pitfall 1: shadcn `Sidebar`'s mobile mode silently replaces the bottom-tab-bar design
**What goes wrong:** Adding `sidebar` via the CLI and using `<SidebarProvider><Sidebar>...` as-is gives you a hamburger-triggered full-height Sheet on mobile (`isMobile` branch), not the D-14 persistent bottom tab bar.
**Why it happens:** The shadcn Sidebar component was designed as a single component that "just works" responsively — that's a feature for most apps, a conflict for this one's explicit mobile IA.
**How to avoid:** Treat `<Sidebar>` as desktop-only chrome (`hidden md:flex` on its wrapper, or simply don't render it at all below the breakpoint) and build `BottomTabBar` + `StartupSheet` as siblings using `Sheet` directly for D-15.
**Warning signs:** A hamburger icon appears on mobile where none was designed; the Startup tab opens a full-height sidebar clone instead of the specified switcher-then-links sheet.

### Pitfall 2: `beforeLoad` auth guards look idiomatic but don't fit Convex Auth's async hook
**What goes wrong:** Copying the textbook `_authenticated.tsx` + `beforeLoad: ({context}) => { if (!context.auth.isAuthenticated) throw redirect(...) }` pattern from TanStack Router's own docs requires a `router.context.auth` object that is populated *before* the route resolves — this repo has no such wiring, and `useConvexAuth()` can only be read inside React components/hooks.
**Why it happens:** The pattern is correct for frameworks (or `TanStack Start`/SSR setups) where auth state is resolved server-side or cached before the router runs; Convex Auth in a pure Vite SPA resolves it client-side, asynchronously, after mount.
**How to avoid:** Keep using the existing `isLoading`/`isAuthenticated` component-level pattern (Pattern 1 above), which this repo already proves works (`AppLayout.tsx`, `LandingPage.tsx`).
**Warning signs:** A flash of "redirect to sign-in" on every authenticated page load (because `beforeLoad` ran before auth resolved), or a `context.auth` `undefined` runtime error.

### Pitfall 3: Convex `query` functions can't set `focusedStartupId` as a "read" side effect
**What goes wrong:** Trying to make `getBySlug` both return the Startup *and* update `focusedStartupId` in one call — Convex queries are read-only transactions and will throw if they call `ctx.db.patch`.
**How to avoid:** Split into a `query` (`getBySlug`) and a `mutation` (`focus`), called separately from the route's effect, exactly mirroring today's `getWorkspace`/`setActive` split.

### Pitfall 4: A single blanket "non-Member → redirect to Pitch" gate breaks the Trial Cycle exception
**What goes wrong:** Implementing the membership gate once, at the `s/$slug` layout level, redirects Participants/Applicants away from the Trial Cycle screen they're explicitly allowed to see.
**How to avoid:** See Architecture Pattern 3 — push the redirect decision down to each page, with the Trial Cycle page using its own access check.

### Pitfall 5: Renaming `activeStartupId` everywhere except the one place it matters
**What goes wrong:** `convex/teams/startups.ts`'s `getWorkspace` query is being *replaced* (not just renamed) by `getBySlug` + `listMemberships` per SHELL-07 — it's easy to rename the field inside `getWorkspace` and forget that the function itself should be deleted/superseded, leaving two competing sources of "the active Startup."
**How to avoid:** Treat `getWorkspace` as removed in this phase, not merely edited; `useWorkspace.ts` and `StartupSwitcher.tsx` (both consumers) move into `src/shell/` and are rewritten against the new query, not patched in place `[VERIFIED: src/features/app/hooks/useWorkspace.ts:1-20 and src/features/app/ui/StartupSwitcher.tsx:1-95 both call api.teams.startups.getWorkspace / setActive directly]`.

### Pitfall 6: The 8 hard-coded `/app/...` notification `href`s silently keep working (they just 404)
**What goes wrong:** Notification `href`s are plain strings stored at write time (`notify(ctx, { ..., href: "/app/trials/"+id })`); nothing type-checks them against the route tree, so a missed one won't fail `pnpm check` — it'll only 404 when a User clicks it.
**Where they live (all confirmed by direct read/grep):** `convex/hiring/applications.ts` (5 occurrences: lines 115, 148, 181, 192, 238), `convex/hiring/offers.ts:52`, `convex/lib/hiring/offers.ts:17`, `convex/lib/hiring/threads.ts:86`, `convex/lib/hiring/trialCycles.ts:70,84`, `convex/lib/hiring/verdicts.ts:83`, `convex/lib/work/cycles.ts:69`, `convex/lib/work/pulses.ts:165` `[VERIFIED: grep -n "/app" convex/ output, cross-checked against convex/lib/hiring/trialCycles.ts:120-150 and convex/lib/work/pulses.ts:164-166]`.
**How to avoid:** Grep for `"/app` in `convex/` as a checklist and update every hit to the new scheme (e.g. `/s/${slug}/hiring/trials/${trialCycleId}`) in the same commit as the route rename. Since several of these builders only have the `trialCycleId`/`startupId`, not the `slug`, they'll need to look up (or receive) the Startup's slug — check whether the calling context already has the `Doc<"startups">` in scope (most do, via `ctx.db.get`) before adding an extra lookup.

## Code Examples

### Shortcut registry shape and the "ignore single-key in editable fields" rule
```typescript
// src/shell/shortcuts/registry.ts
export type ShortcutScope = "global" | "palette" | "review";

export type ShortcutEntry = {
	key: string;           // e.g. "mod+k", "?", "/" — "mod" resolves to ⌘ on macOS, Ctrl elsewhere
	label: string;          // shown in the `?` sheet and in tooltips
	scope: ShortcutScope;
	action: () => void;
};

export const registry: ShortcutEntry[] = [
	{ key: "mod+k", label: "Open command palette", scope: "global", action: openPalette },
	{ key: "?", label: "Show all shortcuts", scope: "global", action: openShortcutSheet },
	// Phase 1 only registers navigation + Startup switching + Create Startup + `?`,
	// per D-19 — no "C" (Create Pulse) or "J"/"K" here yet.
];
```
```typescript
// src/shell/shortcuts/useShortcuts.ts
const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return EDITABLE_TAGS.has(target.tagName) || target.isContentEditable;
}

// Inside the global keydown listener: single-key entries (e.g. "?", "/")
// must check isEditableTarget() and bail out; "mod+k" (a modifier combo)
// should still fire even while typing, matching every editor's convention
// that Cmd/Ctrl-combos are never plain text input.
```
This directly implements the locked rule ("single-key shortcuts are ignored while focus is in an editable field") — note the distinction between single-key (`?`, `/`) and modifier-combo (`mod+k`) shortcuts, since D-19/issue #19 never says to block ⌘K while typing (and blocking it would make the palette unreachable from any text field, which contradicts its purpose as a universal jump tool).

### Platform-aware shortcut label (Claude's discretion, but a one-line utility, not a library)
```typescript
// src/shell/shortcuts/platform.ts
export function isApplePlatform(): boolean {
	return typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent);
}

export function modKeyLabel(): string {
	return isApplePlatform() ? "⌘" : "Ctrl";
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Single `/app` header with a segmented nav (`AppNav.tsx`), top-header layout | Linear-style persistent sidebar (desktop) / bottom tabs (mobile), no `/app` prefix | This phase | Full replacement of `AppShell.tsx`, `AppNav.tsx`, `BuildFrame.tsx`, `BuildNav.tsx` |
| Hidden-state "active Startup" (`getWorkspace` reads `user.activeStartupId`) | URL-carried Startup (`/s/$slug`), `focusedStartupId` only used for "where to land next" | This phase, per ADR-0006 | Notification links become shareable/bookmarkable; `getWorkspace` is replaced, not extended |
| Per-user Plan (`isProUser` checks `user.planTier`) | Per-Startup Plan (Phase 6, PLAN-01/PLAN-05) — **this phase ships the read shape only, still sourced from Founders' `planTier`** | Phase 6 (not this phase) | This phase's Plan block is an interim shim; document its shape clearly so Phase 6 only swaps the data source |

**Deprecated/outdated:** `getWorkspace` query, `setActive` mutation (renamed to `focus`), the entire `/app/*` route tree (removed with no redirects, per D-11 and issue #19 — no users exist yet).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Interim Plan-block "isPro" should be `true` if **any** Founder of the Startup has `planTier === "pro"` (not e.g. only the original creator, or an average) | Open Questions / Backend design | If a different rule is intended (e.g. only the founding Founder's tier counts), the Plan block's `isPro` flag would show the wrong limits until Phase 6 replaces the source — low actual impact since Phase 1 has no paying users, but worth a quick confirm before coding |
| A2 | The Free/Pro limit numbers from issue #19's table (Capacity 5/20, Roles 1/unlimited, live Trial Cycles 1/unlimited, Members 5/50, Stealth) should be added to `convex/lib/limits.ts` **now**, read-only, even though PLAN-01 (enforcement) isn't until Phase 6 | Backend design / Standard Stack | If the planner instead hard-codes these numbers inline in the slug query, Phase 6 will have a small duplication to clean up — not a functional risk, just a minor tidiness one |
| A3 | Route segment names under `/s/$slug/` (`cycles`, `hiring`, `team`, `pitch`, `activity`, `settings`) and the personal route names (`/inbox`, `/my-pulses`, `/threads`) are unlocked and can be chosen by the planner | Recommended Project Structure | If the eventual choice differs from what's used inside this research's code examples, only comments/examples need updating — CONTEXT.md never locks exact URL segments, only which *sections* must exist |
| A4 | The Radix packages the shadcn CLI adds for `dialog`/`sheet`/`tabs`/`tooltip` will be the classic per-primitive packages (`@radix-ui/react-dialog`, etc.), matching this repo's existing convention, not the newer unified `radix-ui` meta-package some shadcn v4/"base" registries use | Package Legitimacy Audit | If the CLI resolves the unified package instead, it's a one-line different import path in generated files — cosmetic, not a blocker, but worth a glance at the diff after running `pnpm ui` |

**If this table is empty:** N/A — see above; none of these change the *shape* of the plan, only small tidiness/naming details.

## Open Questions

1. **Which Founder's `planTier` decides the interim Plan block's `isPro`?**
   - What we know: today Plan is 100% per-User (`isProUser` checks the *caller's* own `planTier`; `convex/people/billing.ts`'s `getPlan` has no notion of "the Startup's plan" at all) `[VERIFIED: convex/people/billing.ts:12-23]`. CONTEXT.md says derive from "the Founders' `planTier` via `isProUser`" (plural).
   - What's unclear: the aggregation rule across multiple Founders.
   - Recommendation: "any Founder is Pro → Startup shows Pro limits" (matches issue #19 user story 97, "Pro belongs to the Startup ... the whole team benefits"). Confirm with the user before building — this is A1 above.

2. **Where should `/` redirect signed-in Users to, exactly — `/my-pulses` or something else?**
   - What we know: the glossary and issue #19 both call it "My Pulses" as the landing screen; no URL is specified anywhere in the source material.
   - What's unclear: nothing blocking, purely a naming choice.
   - Recommendation: `/my-pulses`, for symmetry with `/inbox` and `/threads`.

3. **Does the mobile top bar (D-17) live inside `_shell`'s `AppShell` or is it a separate `MobileShell` swapped in alongside `BottomTabBar`?**
   - What we know: D-17 describes mobile-only chrome (slim top bar with avatar-sheet and search icon) that's materially different from the desktop header (which barely exists — the sidebar carries most of what the old top header held).
   - What's unclear: whether "AppShell" should internally branch mobile/desktop via CSS (`md:hidden`/`hidden md:flex`) or via two separate React components chosen by the `useIsMobile` hook.
   - Recommendation: CSS-based branching (matches this repo's existing `AppNav.tsx` pattern of one component rendering both `placement="header"` and `placement="dock"` variants) — avoids a hook-driven remount/flash and keeps both layouts in the DOM for smooth breakpoint transitions. Low-stakes either way; planner's call.

## Environment Availability

No new external services are introduced by this phase — Convex (already running via `pnpm dev:backend`), Google sign-in (already configured), and the font is a self-hosted npm package (`@fontsource-variable/geist`), not a CDN dependency. `pnpm`, `node`, and the Convex dev deployment are prerequisites already documented in CLAUDE.md and assumed present. Skipping the full audit table — no missing dependency risk exists for this phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 5.0.2, `environment: "edge-runtime"`, `convex-test` 0.0.60 |
| Config file | `vitest.config.ts` (`include: ["convex/**/*.test.ts"]`) `[VERIFIED: vitest.config.ts:1-9]` |
| Quick run command | `pnpm test convex/teams/startups.test.ts` |
| Full suite command | `pnpm test` |

Per CLAUDE.md, **the UI has no tests** — this phase's frontend work (sidebar, palette, shortcuts, theming, routing) has no automated coverage path in this repo; verification is manual (`pnpm dev` + click-through) plus `pnpm check` for type/lint correctness. Only the backend slug/memberships/focus work below gets `convex-test` coverage.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|--------------------|-------------|
| SHELL-07 | `getBySlug` returns Startup + role for a Founder | unit (convex-test) | `pnpm test convex/teams/startups.test.ts -t "founder"` | ❌ Wave 0 — new test, same file as existing `startups.test.ts` |
| SHELL-07 | `getBySlug` returns `role: null` for a non-Member (public Startup) | unit | `pnpm test convex/teams/startups.test.ts -t "non-member"` | ❌ Wave 0 |
| SHELL-07 | `getBySlug` returns access for a Trial Cycle Participant who isn't a Member (Testing Decisions "Seam 1" from issue #19: "looking up a Startup by slug and focusing it (including non-Members and Participants)") | unit | `pnpm test convex/teams/startups.test.ts -t "participant"` | ❌ Wave 0 |
| SHELL-07 | `listMemberships` returns every Startup the caller belongs to, with role | unit | `pnpm test convex/teams/startups.test.ts -t "memberships"` | ❌ Wave 0 |
| SHELL-07 | `focus` (renamed `setActive`) rejects a non-Member, patches `focusedStartupId` for a Member | unit | `pnpm test convex/teams/startups.test.ts -t "focus"` | ❌ Wave 0 (adapts the existing `setActive` test, which isn't shown in the excerpt read but is inferable from the `create`/`update` test pattern already in this file) |
| SHELL-02 | Accepting an Invite still sets `focusedStartupId` (renamed field) | unit | `pnpm test convex/teams/invitations.test.ts` | ✅ existing file, needs field-name update only |
| SHELL-01..06 | Sidebar renders, palette opens, shortcuts registry, theming, route tree | manual only | — | N/A — UI has no tests per CLAUDE.md |

### Sampling Rate
- **Per task commit:** `pnpm test convex/teams/startups.test.ts` (and any other backend test file touched) + `pnpm check`
- **Per wave merge:** `pnpm test` (full backend suite) + `pnpm check`
- **Phase gate:** Full suite green, `pnpm check` clean, before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `convex/teams/startups.test.ts` — extend with `getBySlug`/`listMemberships`/`focus` cases (file exists, cases don't)
- [ ] No new test *file* needed — this phase's backend surface is small enough to live in the existing `startups.test.ts` and `invitations.test.ts`
- [ ] Framework install: none — `vitest`, `convex-test`, `@edge-runtime/vm` are already dependencies

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | yes (indirectly) | `@convex-dev/auth` with Google sign-in — unchanged this phase; only the *routing* around auth state changes, not the auth mechanism itself |
| V3 Session Management | no | Unchanged — Convex Auth handles session tokens; this phase touches none of that |
| V4 Access Control | **yes — central to this phase** | Every new Convex function (`getBySlug`, `listMemberships`, `focus`) must start with `requireUserId(ctx)` and use `requireMembership`/`getMembership` for role checks, per this repo's existing convention `[VERIFIED: convex/lib/auth.ts:7-13, convex/lib/teams/membership.ts:19-29]`. The client-side route redirects (non-Member → Pitch) are UX only — see Architectural Responsibility Map — real enforcement stays server-side, exactly as today |
| V5 Input Validation | yes | `v.string()`/`v.id("startups")` Convex validators on the new query/mutation args, following the existing pattern in `convex/teams/startups.ts` |
| V6 Cryptography | no | Not touched by this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|------------------------|
| Client trusts the slug-route's cached `role` after a membership change (stale client state shows Startup-scoped UI to a since-removed Member) | Elevation of Privilege | Every Convex mutation the stale UI might call still re-checks `requireMembership` server-side — a stale client can render a menu item, but the backend call behind it fails safely. This is already how the rest of the app works; no new pattern needed, just don't skip `requireMembership` on the new functions. |
| A crafted `/s/$slug` URL for a Startup the User doesn't belong to, used to probe existence/privacy of a Startup | Information Disclosure | `getBySlug` must behave like the existing `getPublic` (returns `null`/non-public fields for non-Members) rather than throwing — throwing on "not found" vs "not a member" would let an attacker distinguish the two; `getPublic`'s existing pattern (`if (!startup?.isPublic) return null`) already avoids this `[VERIFIED: convex/teams/startups.ts:266-278]`, and `getBySlug` should follow the same shape (return `role: null` rather than throw, for both "no such Startup" — arguably a 404 — and "not a Member" — a redirect) |

## Sources

### Primary (HIGH confidence)
- `/tanstack/router` (Context7) — pathless layout routes, directory-based nesting (`route.tsx`), root-route-always-renders FAQ, `beforeLoad`/`context.auth` guard pattern
- `/shadcn-ui/ui` (Context7) — Sidebar full source (mobile Sheet-swap behavior), Command/CommandDialog usage, Sheet source (built on Radix Dialog), multi-component `add` CLI usage
- This repository, read directly this session: `convex/schema.ts`, `convex/teams/startups.ts`, `convex/people/users.ts`, `convex/people/billing.ts`, `convex/lib/auth.ts`, `convex/lib/teams/membership.ts`, `convex/lib/teams/invites.ts`, `convex/lib/limits.ts`, `convex/lib/hiring/trialCycles.ts`, `convex/lib/work/pulses.ts`, `convex/work/cycles.ts`, `convex/notify.ts` (`convex/lib/notify.ts`), `convex/test.helpers.ts`, `vitest.config.ts`, `src/routes/__root.tsx`, `src/routes/app/route.tsx`, `src/routes/index.tsx`, `src/routes/explore/index.tsx`, `src/routes/startup/$slug.tsx`, `src/routes/u/$username.tsx`, `src/routes/invite/$token.tsx`, `src/features/app/layout/{AppLayout,AppShell,AppNav}.tsx`, `src/features/app/hooks/{useWorkspace,useCurrentUser}.ts`, `src/features/app/ui/{StartupSwitcher,ScoreChip,UserMenu}.tsx`, `src/features/marketing/landing/ui/LandingPage.tsx`, `src/features/teams/team/hooks/useAcceptInvite.ts`, `src/styles/globals.css`, `components.json`, `tsconfig.json`, `vite.config.ts`, `package.json`
- `docs/adr/0004-code-is-grouped-by-domain-not-listed-flat.md`, `docs/adr/0005-startups-pay-talent-and-visibility-are-never-for-sale.md`, `docs/adr/0006-frontend-is-a-shell-plus-domain-features.md` — read in full
- GitHub issue #19 (`gh issue view 19`) — read in full (534 lines): Solution, User Stories 1–19/50/111/113, all "Implementation Decisions" and "Testing Decisions" sections
- `git show HEAD:CONTEXT.md` (root glossary, deleted from working tree) — read in full for the domain terms this phase's code and routes must use
- `convex/_generated/ai/guidelines.md` — read in full for Convex function conventions

### Secondary (MEDIUM confidence)
- npm registry lookups (`npm view @fontsource-variable/geist version`, `npm view cmdk version`) — live registry data, cross-checked against `gsd-tools query package-legitimacy check`

### Tertiary (LOW confidence)
- None used as a basis for any claim in this document.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every package is either already installed or version-verified live against the npm registry this session
- Architecture (routing): HIGH for the mechanics (pathless layouts, root-always-renders, directory nesting — all Context7-cited from TanStack Router's own docs) / MEDIUM for the exact route-name choices (unlocked by CONTEXT.md, flagged as discretion)
- Backend design: HIGH for the rename call-site inventory and query/mutation split (all read directly from source) / MEDIUM for the Plan-block derivation rule (A1, needs a quick user confirm)
- Pitfalls: HIGH — each one is grounded in either a direct doc citation (Sidebar mobile mode, root-always-renders) or a direct code read (dead `unassignPulsesInStartup`, the `/app` href inventory)

**Research date:** 2026-09-28
**Valid until:** 30 days (stable stack; the shadcn CLI's exact dependency resolution for `dialog`/`sheet`/`tabs`/`tooltip` is the most likely thing to drift — re-verify with `pnpm ui` output if this research is used after a long gap)
