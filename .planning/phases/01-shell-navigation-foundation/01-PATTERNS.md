# Phase 1: Shell & Navigation Foundation - Pattern Map

**Mapped:** 2026-09-28
**Files analyzed:** 34 (new/moved/modified, per CONTEXT.md + RESEARCH.md file lists)
**Analogs found:** 30 / 34

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/routes/_shell/route.tsx` | route (pathless layout) | request-response | `src/features/app/layout/AppLayout.tsx` | exact |
| `src/routes/_shell/_authed/route.tsx` | route (pathless layout) | request-response | `src/features/app/layout/AppLayout.tsx` | exact |
| `src/routes/_shell/_authed/s/$slug/route.tsx` | route (layout, data-resolving) | request-response | `src/features/app/layout/AppLayout.tsx` (gating shape) + `convex/teams/startups.ts::getPublic` (member/non-member branch) | role-match |
| `src/routes/index.tsx` | route | request-response | `src/features/marketing/landing/ui/LandingPage.tsx` (self-gate pattern; file itself is kept, only retarget `<Navigate>`) | exact |
| `src/shell/layout/AppShell.tsx` | component (layout) | request-response | `src/features/app/layout/AppShell.tsx` | exact |
| `src/shell/layout/MobileShell.tsx` | component (layout) | request-response | `src/features/app/layout/AppNav.tsx` (`placement="dock"` branch) | role-match |
| `src/shell/layout/PublicShell.tsx` | component (layout) | request-response | `src/components/shared/PublicHeader.tsx` (wrapped, not rewritten) | exact |
| `src/shell/sidebar/AppSidebar.tsx` | component (nav) | request-response | `src/features/app/layout/AppNav.tsx` (`placement="header"` branch) + shadcn `sidebar` primitive (new) | role-match |
| `src/shell/sidebar/StartupSwitcher.tsx` | component | CRUD (select) | `src/features/app/ui/StartupSwitcher.tsx` | exact (rewritten against new query) |
| `src/shell/mobile/BottomTabBar.tsx` | component (nav) | request-response | `src/features/app/layout/AppNav.tsx` (`placement="dock"`) | exact-shape, different tab set |
| `src/shell/mobile/StartupSheet.tsx` | component | request-response | `src/features/app/ui/StartupSwitcher.tsx` (list-and-select body) + shadcn `sheet` (new primitive) | role-match |
| `src/shell/mobile/AccountSheet.tsx` | component | request-response | `src/features/app/ui/UserMenu.tsx` (content: avatar/name/Score/sign-out) | role-match |
| `src/shell/command/CommandPalette.tsx` | component | request-response (client-filtered) | none in-repo (`command`/`cmdk` is a new primitive) — see "No Analog Found" | none |
| `src/shell/command/ShortcutSheet.tsx` | component | request-response | `src/features/app/ui/StartupSwitcher.tsx` (dropdown-list-of-rows shape, adapted to `sheet`) | partial |
| `src/shell/shortcuts/registry.ts` | utility (data) | event-driven | none in-repo (new concept) — see "No Analog Found" | none |
| `src/shell/shortcuts/useShortcuts.ts` | hook | event-driven | `src/features/app/hooks/useWorkspace.ts` (thin-hook convention: query/mutation to return object shape) — only for hook style, not the keydown logic itself | partial |
| `src/shell/shortcuts/platform.ts` | utility | transform | `src/lib/utils.ts` (`cn` — small pure helper convention) | role-match |
| `src/shell/hooks/useWorkspace.ts` (moved) | hook | CRUD | `src/features/app/hooks/useWorkspace.ts` | exact (rewritten against `getBySlug`/`listMemberships`/`focus`) |
| `src/shell/hooks/useCurrentUser.ts` (moved) | hook | CRUD | `src/features/app/hooks/useCurrentUser.ts` | exact (moved, field rename only) |
| `src/shell/hooks/useNotifications.ts` (moved) | hook | CRUD | `src/features/app/hooks/useNotifications.ts` | exact (moved as-is) |
| `src/routes/_shell/discover/index.tsx` (was `routes/explore/index.tsx`) | route | request-response | `src/routes/explore/index.tsx` | exact |
| `src/routes/_shell/startup/$slug.tsx` | route | request-response | `src/routes/startup/$slug.tsx` | exact (unchanged path, moved under `_shell`) |
| `src/routes/_shell/u/$username.tsx` | route | request-response | `src/routes/u/$username.tsx` | exact |
| `src/routes/_shell/invite/$token.tsx` | route | request-response | `src/routes/invite/$token.tsx` | exact |
| `src/routes/_shell/_authed/startups/new.tsx` | route | request-response | `src/routes/app/startups/new.tsx` (if present) else `convex/teams/startups.ts::create` consumer | role-match |
| Stub routes (`/inbox`, `/my-pulses`, `/threads`, `/s/$slug/cycles`, `/hiring`, `/team`, `/pitch`, `/activity`, `/settings`, trial cycle, profile edit) | route | request-response | `src/components/shared/EmptyState.tsx` (content) + `src/routes/app/**` (route shape, being deleted) | role-match |
| `convex/teams/startups.ts::getBySlug` (new) | query | CRUD (read) | `convex/teams/startups.ts::getPublic` (member/non-member branching + `by_slug` index) | exact |
| `convex/teams/startups.ts::listMemberships` (new) | query | CRUD (read) | `convex/teams/startups.ts::loadWorkspace` (private helper, same shape) | exact |
| `convex/teams/startups.ts::focus` (renamed from `setActive`) | mutation | CRUD (write) | `convex/teams/startups.ts::setActive` | exact |
| `convex/teams/startups.ts::getWorkspace` (removed) | query | CRUD | — (deleted, superseded by `getBySlug`+`listMemberships`) | n/a |
| `convex/schema.ts` (`activeStartupId` → `focusedStartupId`) | model (schema field) | CRUD | `convex/schema.ts:131` itself | exact |
| `convex/people/users.ts` (`getMe` field rename) | query | CRUD (read) | `convex/people/users.ts:94` itself | exact |
| `convex/lib/teams/invites.ts` (field rename) | service | CRUD (write) | `convex/lib/teams/invites.ts:95` itself | exact |
| `convex/hiring/{applications,offers}.ts`, `convex/lib/hiring/{offers,threads,trialCycles,verdicts}.ts`, `convex/lib/work/{cycles,pulses}.ts` (`href` scheme) | service (notification builder) | event-driven | `convex/lib/hiring/trialCycles.ts` (existing `notify()` call sites building `href` strings) | exact |
| `src/styles/globals.css` (token rewrite) | config | transform | itself (`:root` block, `--sidebar-*` names kept) | exact |

## Pattern Assignments

### `src/routes/_shell/route.tsx` (route, request-response)

**Analog:** `src/features/app/layout/AppLayout.tsx` (full file, 22 lines — read above in full)

**Core pattern** (the entire analog, since it IS the pattern):
```tsx
import { useConvexAuth } from "@convex-dev/auth/react";
import { Navigate, Outlet } from "@tanstack/react-router";
import { GlobalSpinner } from "~/components/globals/GlobalSpinner";
import { AppShell } from "./AppShell";

export function AppLayout() {
	const { isLoading, isAuthenticated } = useConvexAuth();

	if (isLoading) {
		return <GlobalSpinner />;
	}

	if (!isAuthenticated) {
		return <Navigate to="/" />;
	}

	return (
		<AppShell>
			<Outlet />
		</AppShell>
	);
}
```
**Adaptation for `_shell/route.tsx`:** don't redirect on `!isAuthenticated` — render `<PublicShell><Outlet/></PublicShell>` instead (RESEARCH.md Pattern 1 already gives the exact target code). Keep the `isLoading → GlobalSpinner` branch verbatim — it's the same import (`~/components/globals/GlobalSpinner`) this phase keeps unchanged.

**Adaptation for `_shell/_authed/route.tsx`:** keep the `!isAuthenticated → <Navigate>` branch verbatim (retarget to sign-in route), drop the `isLoading` branch (already handled by the parent `_shell` layout) unless defending against a direct-mount edge case.

---

### `src/shell/layout/AppShell.tsx` (component, layout)

**Analog:** `src/features/app/layout/AppShell.tsx` (full file, 73 lines — read above)

**Imports pattern** (lines 1-9): shows the project's convention of importing sibling shell pieces (`StartupSwitcher`, `NotificationBell`, `ScoreChip`, `UserMenu`) directly by feature path, and gating rendering on `useCurrentUser()`'s `me`.

**Core pattern to keep:**
- `useCurrentUser()` hook call at the top, `me` used for conditional rendering (`{me ? (...) : null}`) — copy this null-guard shape into the new `AppShell`/`AppSidebar`.
- `<main>` wraps `{children}` — new version should render `<Outlet/>` the same way from the route.

**What changes:** replace the top `<header>` + `AppNav` composition entirely with `AppSidebar` (desktop, `hidden md:flex`) and `MobileShell`/`BottomTabBar` (mobile, `md:hidden`) per RESEARCH.md's anti-pattern guidance — do not keep the old sticky-header-plus-pill-nav layout. Drop the `Upgrade` button and `isPro` header treatment (D-09: user-level Pro indicators removed, Score chip moves to account menu).

---

### `src/shell/mobile/BottomTabBar.tsx` (component, nav)

**Analog:** `src/features/app/layout/AppNav.tsx`, `placement === "dock"` branch (lines 70-96)

**Core pattern to copy verbatim (structure, not content):**
```tsx
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "~/lib/utils";

const pathname = useRouterState({
	select: (state) => state.location.pathname,
});

<nav
	aria-label="Main"
	className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
>
	<div className="grid grid-cols-3">
		{tabs.map(({ label, to, icon: Icon, isActive }) => {
			const active = isActive(pathname);
			return (
				<Link
					key={to}
					to={to}
					aria-current={active ? "page" : undefined}
					className={cn(
						"flex flex-col items-center gap-1 py-3 text-xs font-medium",
						active ? "text-foreground" : "text-muted-foreground",
					)}
				>
					<Icon className="size-5" />
					{label}
				</Link>
			);
		})}
	</div>
</nav>
```
**Changes required:** `grid-cols-3` → `grid-cols-4` (Inbox · My Pulses · Startup · Discover, D-14); the "Startup" tab's `to` must not navigate — it opens `StartupSheet` instead (use an `onClick` that sets sheet-open state, not a `Link`, for that one tab only); apply the D-09 active-icon-blue rule (active icon gets `text-primary` or similar, not just `text-foreground`) and the 44px touch-target minimum (`py-3` currently yields ~44px with icon+label — verify against D-05's 44px floor).

---

### `src/shell/sidebar/StartupSwitcher.tsx` (component, CRUD-select)

**Analog:** `src/features/app/ui/StartupSwitcher.tsx` (full file, 96 lines — read above)

**Core pattern to keep wholesale:** the loading/empty/populated three-way branch —
```tsx
if (isLoading) {
	return <Skeleton className="h-8 w-24 rounded-md" />;
}

if (startups.length === 0) {
	return (
		<Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground">
			<Link to="/app/startups/new">
				<Plus className="size-3.5" />
				<span className="hidden sm:inline">Create startup</span>
			</Link>
		</Button>
	);
}
```
This is UI-SPEC's E1's exact zero/loading rule (`Skeleton h-8 w-24 rounded-md`, "Create Startup" row when zero). Also copy the `DropdownMenuItem` row shape (name + role `Badge` + `Check` for active) verbatim — it matches E1's "populated" truth exactly.

**Changes required:** `to="/app/startups/new"` → `to="/startups/new"` (no `/app` prefix, per SHELL-02); `handleSelect`'s `navigate({ to: "/app" })` → navigate to `/s/${slug}` of the newly focused Startup; swap `useWorkspace()`'s backing query from `getWorkspace` to `listMemberships`; avatar addition needed (UI-SPEC E1 "populated" now requires a rounded-square avatar per row — the old switcher has none, this is new, not copied).

---

### `src/shell/hooks/useWorkspace.ts` (hook, CRUD)

**Analog:** `src/features/app/hooks/useWorkspace.ts` (full file, 20 lines — read above)

**Core pattern to keep (thin-hook convention):**
```tsx
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

export function useWorkspace() {
	const workspace = useQuery(api.teams.startups.getWorkspace);
	const setActive = useMutation(api.teams.startups.setActive);
	// ...
	return {
		workspace, active, startups,
		isLoading: workspace === undefined,
		hasStartups: startups.length > 0,
		setActiveStartup: (startupId: Id<"startups">) => setActive({ startupId }),
	};
}
```
**Changes required:** back with `api.teams.startups.listMemberships` (for the `startups` list) and `api.teams.startups.focus` (renamed mutation, was `setActive`) instead of the removed `getWorkspace`. The "active" Startup concept becomes the Focused Startup resolved from the current `/s/$slug` route param, not from the query response — this hook's shape (`isLoading`, list, setter) stays, but where "active" comes from changes. Keep the exact `isLoading: workspace === undefined` idiom for every new query-backed hook in `src/shell/`.

---

### `convex/teams/startups.ts::getBySlug` (query, CRUD-read)

**Analog:** `convex/teams/startups.ts::getPublic` (lines 266-342, read above in full)

**Imports pattern** (lines 1-15 of the file):
```ts
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { getMembership, requireFounderMembership, requireMembership } from "../lib/teams/membership";
```

**Core pattern to copy (slug lookup + member/non-member branch):**
```ts
export const getPublic = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const startup = await ctx.db
			.query("startups")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique();

		if (!startup?.isPublic) {
			return null;
		}

		const userId = await getAuthUserId(ctx);
		// ...
		if (userId) {
			membership = await getMembership(ctx, startup._id, userId);
			// ...
		}

		return { /* shaped object, never throws on "not found"/"not a member" */ };
	},
});
```
**Security note (carried from RESEARCH.md's threat table):** `getBySlug` must follow this exact "return null/role:null, never throw" shape — do not throw on "no such Startup" or "not a Member", since throwing would let a non-Member distinguish "doesn't exist" from "exists but I can't see it" (Information Disclosure per ASVS V4). Use `getMembership` (not `requireMembership`) so a `null` role is a normal return value.

**Plan block:** derive via `isProUser` per Founder — reuse `convex/people/billing.ts::getPlan`'s shape (`{ isPro, planTier }`) as the literal return shape for the Plan sub-object, sourced (per A1's recommendation) from "any Founder of the Startup has `planTier === 'pro'`", with limits pulled from `convex/lib/limits.ts` constants (already read above — `MAX_STARTUP_FOUNDERS`, `MAX_CYCLE_MEMBERS`, etc. are the existing naming convention for any new limit constant this phase adds).

---

### `convex/teams/startups.ts::focus` (mutation, renamed from `setActive`)

**Analog:** `convex/teams/startups.ts::setActive` (lines 256-264, read above in full)

**Core pattern (copy verbatim, rename only):**
```ts
export const setActive = mutation({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireMembership(ctx, args.startupId, userId);
		await ctx.db.patch(userId, { activeStartupId: args.startupId });
		return args.startupId;
	},
});
```
Rename to `focus`, change the patched field to `focusedStartupId`. Keep `requireMembership` (throws for non-Members) — this is a write path, unlike the read-path `getBySlug`, so throwing here is correct and matches this file's existing `update`/`create` mutations' auth pattern.

---

### `convex/schema.ts` rename (`activeStartupId` → `focusedStartupId`)

**Analog:** the field's own current definition, `convex/schema.ts:131`:
```ts
activeStartupId: v.optional(v.id("startups")),
```
Copy `v.optional(v.id("startups"))` unchanged; rename the key. **All 6 call sites confirmed by RESEARCH.md's Runtime State Inventory** must move together in the same commit: `convex/schema.ts:131`, `convex/teams/startups.ts:93,145,261`, `convex/people/users.ts:94`, `convex/lib/teams/invites.ts:95`.

---

### `convex/hiring/*` and `convex/lib/{hiring,work}/*` notification `href` rewrites

**Analog:** the existing `notify()` call sites in `convex/lib/hiring/trialCycles.ts` (lines ~70-84, confirmed present by RESEARCH.md's grep) already build `href` strings inline at write time. Grep for `"/app` across `convex/` as the fix checklist (RESEARCH.md's Pitfall 6 gives the exact 8-file/13-occurrence list). Pattern: replace `/app/trials/${id}` → `/s/${slug}/hiring/trials/${trialCycleId}` — each builder needs the Startup's `slug`, not just its `_id`; check whether `ctx.db.get(startupId)` is already in scope before adding a new lookup (most call sites already hold the `Doc<"startups">`).

---

### Stub routes (`/inbox`, `/my-pulses`, `/s/$slug/cycles`, etc.)

**Analog:** `src/components/shared/EmptyState.tsx` (full file, 16 lines — read above)
```tsx
type EmptyStateProps = {
	readonly title: string;
	readonly description: string;
	readonly action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
	return (
		<div className="rounded-lg border border-dashed p-8 text-center">
			<p className="font-medium">{title}</p>
			<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			{action ? <div className="mt-4">{action}</div> : null}
		</div>
	);
}
```
Every stub page: a thin route (`createFileRoute` + page component per CLAUDE.md convention) rendering a `<h1>` (Display role, 20px/600 per UI-SPEC) plus this `EmptyState` with no `action` prop (per UI-SPEC's Copywriting Contract — "no action button" on stubs; the only place `action` gets used is the switcher's own empty state, which is a different component). Titles/descriptions come verbatim from UI-SPEC's "Stub Screen Copy" table — do not invent new copy.

---

### `src/routes/index.tsx` (kept, retargeted)

**Analog:** `src/features/marketing/landing/ui/LandingPage.tsx` (full file, 46 lines — read above)

**Core pattern (self-gating, kept as-is per RESEARCH.md Pattern 2 — do NOT nest under `_shell`):**
```tsx
export function LandingPage() {
	const { isAuthenticated, isLoading } = useConvexAuth();

	if (isLoading) {
		return <GlobalSpinner />;
	}

	if (isAuthenticated) {
		return <Navigate to="/app" />;
	}

	return ( /* bespoke marketing header + hero, NOT PublicHeader.tsx */ );
}
```
**Changes required:** `<Navigate to="/app" />` → `<Navigate to="/my-pulses" />`; inline `Explore` link (`to="/explore"`) → `Discover` (`to="/discover"`). Keep the bespoke header as-is — CONTEXT.md/UI-SPEC do not require `/` to use `PublicHeader.tsx`.

---

## Shared Patterns

### Auth/loading gate (every layout route)
**Source:** `src/features/app/layout/AppLayout.tsx` (verbatim, shown above) and `src/features/marketing/landing/ui/LandingPage.tsx` (same idiom, inline).
**Apply to:** `_shell/route.tsx`, `_shell/_authed/route.tsx`, and any route component that must branch on sign-in state. Always `useConvexAuth()` → `isLoading` → `<GlobalSpinner/>` → `isAuthenticated` branch. Never use `beforeLoad` for this (RESEARCH.md Pitfall 2).

### Convex function auth (every new query/mutation)
**Source:** `convex/lib/auth.ts::requireUserId` + `convex/lib/teams/membership.ts::getMembership/requireMembership/requireFounderMembership`.
```ts
export async function requireUserId(ctx: AuthCtx): Promise<Id<"users">> {
	const userId = await getAuthUserId(ctx);
	if (!userId) {
		throw new Error("Not authenticated");
	}
	return userId;
}
```
**Apply to:** `getBySlug`, `listMemberships`, `focus` — every one starts with `requireUserId(ctx)`. Read-paths exposed to non-Members (`getBySlug`) use `getMembership` (nullable); write-paths (`focus`) use `requireMembership` (throws).

### Thin hook convention
**Source:** `src/features/app/hooks/useWorkspace.ts` (verbatim above).
**Apply to:** every hook under `src/shell/hooks/` and `src/shell/shortcuts/useShortcuts.ts` — wrap `useQuery`/`useMutation`, expose `isLoading: data === undefined`, return a small named-fields object, never leak the raw Convex query object as the primary API.

### Error handling / empty query states
**Source:** UI-SPEC's Copywriting Contract, backed by the existing `GlobalError.tsx` pattern (`toErrorMessage(error, "Something went wrong")`) — not read in full this session, but referenced consistently across E1/E2/E4/E5/E6/E7's "error" rows in UI-SPEC as "surfaces through the route error boundary." No component in this phase writes its own try/catch for query errors — the router's existing error boundary owns it.
**Apply to:** every new query-backed shell component (switcher, sidebar, sheets, palette).

### Index-only queries
**Source:** `convex/teams/startups.ts::getPublic`'s `by_slug` index use, and `loadWorkspace`'s `by_user` index use.
**Apply to:** `getBySlug` (needs a `by_slug` index — already exists), `listMemberships` (reuse `by_user`, same as `loadWorkspace`'s private helper it replaces).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/shell/command/CommandPalette.tsx` | component | request-response (client-filtered) | No `cmdk`/command-palette pattern exists anywhere in this codebase today — first use of the shadcn `command` primitive. Follow RESEARCH.md's Code Examples and shadcn's own `CommandDialog` docs; `CommandGroup`/`CommandEmpty` structure comes from the library, not a repo analog. |
| `src/shell/shortcuts/registry.ts` | utility (data) | event-driven | No shortcut-registry concept exists in this repo. RESEARCH.md's "Code Examples" section already gives the concrete shape to use verbatim (`ShortcutEntry = { key, label, scope, action }`) — treat that as the source instead of a codebase analog. |
| `src/shell/shortcuts/useShortcuts.ts` (keydown logic itself) | hook | event-driven | No global keydown listener exists in this repo today. RESEARCH.md's Code Examples (`isEditableTarget`, `EDITABLE_TAGS`) is the closest available source — use it directly. |
| `src/shell/mobile/StartupSheet.tsx` (Sheet-based list) | component | request-response | No existing component uses the `sheet` primitive (not yet installed) — closest available shape is the switcher's dropdown content, adapted from `DropdownMenuContent` to `SheetContent`. |
| Route-context-based `{startup, role}` propagation in `s/$slug/route.tsx` | route | request-response | No existing route in this repo passes resolved data to children via route `context` (all current data fetching happens per-page via hooks). This is new routing plumbing described in RESEARCH.md's Architecture Patterns, not copied from an existing route file. |

## Metadata

**Analog search scope:** `src/features/app/**`, `src/features/marketing/landing/**`, `src/components/shared/**`, `src/components/globals/**`, `src/routes/**`, `convex/teams/startups.ts`, `convex/lib/teams/membership.ts`, `convex/lib/auth.ts`, `convex/lib/limits.ts`, `convex/people/billing.ts`, `src/styles/globals.css`, `convex/schema.ts`
**Files scanned:** 15 read in full, plus 1 `grep`/`ls` pass across `convex/` and `src/routes/`
**Pattern extraction date:** 2026-09-28
