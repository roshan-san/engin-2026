# Phase 2: My Pulses & Cycle Boards - Pattern Map

**Mapped:** 2026-09-29
**Files analyzed:** 41 (new/modified/deleted)
**Analogs found:** 34 / 41 (7 have no in-repo analog, see bottom)

All analog paths below were verified git-tracked (`git ls-files`). Line numbers refer to the working tree at mapping time.

## File Classification

### Backend (convex/)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `convex/schema.ts` (pulses: `rank`, `updatedAt`, 2 new indexes) | model | CRUD | `convex/schema.ts:211-235` (same table) | exact |
| `convex/lib/work/rank.ts` (new, pure) | utility | transform | `convex/lib/reputation/scoreWeights.ts` (pure module imported by `src/`) | role-match |
| `convex/lib/work/kanbanRules.ts` (new, pure, shared with UI) | utility | transform | `src/features/work/cycles/lib/kanban.ts` (moves here) | exact |
| `convex/lib/work/pulseOrder.ts` (new: `placePulse`, `rebalanceColumn`) | service | CRUD | `convex/lib/work/pulses.ts:206-221` (`moveUnfinishedPulses`) | role-match |
| `convex/lib/work/pulses.ts` (+`patchPulse`, gate, export `isUnfinished`, carry-over re-rank) | service | CRUD | itself | exact |
| `convex/lib/work/cycles.ts` (+`createCycle`, `assertCycleOpen`, skip Founders in `addCycleMember`) | service | CRUD | itself | exact |
| `convex/work/pulses.ts` (+`get`, `move`, rewrite `listForCycle`/`listMine`, extend `create`/`update`, gate in `setStatus`) | controller | request-response | itself | exact |
| `convex/work/cycles.ts` (+`get`, `list` summary, `start`/`close` guards, close-with-new, `listMine` fix) | controller | request-response | itself | exact |
| `convex/migrations.ts` (+`backfillPulseRanks`) | migration | batch | `migratePulses` in same file | exact |
| `convex/lib/limits.ts` (+`MAX_CYCLE_PULSES_PER_STATUS`, `MY_PULSES_MAX_PER_STATUS`, `CYCLE_SUMMARY_SCAN`) | config | n/a | existing `MAX_BOARD_PULSES` there | exact |
| `convex/lib/hiring/challenges.ts`, `convex/lib/work/boards.ts` (set `rank` at insert) | service | CRUD | themselves | exact |
| `convex/work/pulses.test.ts`, `cycles.test.ts`, `review.test.ts` (+ new tests) | test | request-response | `convex/work/review.test.ts` | exact |
| `convex/test.helpers.ts` (+`submitForReview`, fix `cyclePulseFor` unused `t`) | test util | n/a | itself (`cyclePulseFor` :174) | exact |

### Shell (src/shell/)

| File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `src/shell/shortcuts/registry.ts` (+`pulse.create`, `cycle.create`, `when?`, ctx fields) | config | event-driven | itself | exact |
| `src/shell/command/CommandProvider.tsx` (extend `useShortcutContext`) | provider | event-driven | itself | exact |
| `src/shell/command/CreatePulseProvider.tsx` (new) | provider | event-driven | `CommandProvider` (same file family) | exact |
| `src/shell/command/CommandPalette.tsx` (apply `when` filter) | component | event-driven | itself :29-38 | exact |
| `src/shell/layout/AppShell.tsx` (mount provider + dialog) | component | n/a | itself | exact |

### Frontend features (src/features/work/)

| File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `kanban/*` (KanbanBoard, KanbanColumn, KanbanList, SortableRow, useKanbanDrag, dropVerdict, announcements) | component/hook | event-driven | old `cycles/hooks/usePointerDrag.ts` + `useCyclePulses.ts` (logic only; delete after) | partial |
| `pulses/pages/MyPulsesPage.tsx` | component (page) | request-response | no page dir exists yet; follow ADR 0006 + `StubScreen` | partial |
| `pulses/components/PulseRow.tsx`, `PulseCardView.tsx` | component | request-response | old `cycles/components/PulseCard.tsx` | role-match |
| `pulses/components/PulsePeek*.tsx`, `PulseProperties`, `ReviewFooter`, `ReturnDialog` | component | CRUD | `pulses/components/PulseProofLinks.tsx`, `ui/sheet.tsx`, `ui/dialog.tsx` | partial |
| `pulses/components/ProofLinksSection.tsx` (rewrite `PulseProofLinks`) | component | CRUD | `pulses/components/PulseProofLinks.tsx` | exact |
| `pulses/components/QuickCreateDialog.tsx` | component | CRUD | none in feature; `ui/dialog.tsx` + shell providers | partial |
| `pulses/hooks/*` (useMyPulses, usePulse, useMovePulse, useCreatePulse, useInlineField) | hook | request-response | `cycles/hooks/useCyclePulses.ts` | exact |
| `pulses/schemas/*`, `pulses/constants.ts` | config | n/a | `pulses/constants.ts` | exact |
| `cycles/pages/CyclesPage.tsx`, `CyclePage.tsx` | component (page) | request-response | see MyPulsesPage | partial |
| `cycles/components/*` (CycleHeader, CycleRow, MembersPopover, Close/Create/StartCycleDialog) | component | CRUD | old `cycles/components/StartCycleForm.tsx` + `useCycleForm` | role-match |
| `cycles/hooks/*` (useCycle, useCycleList, useCycleActions) | hook | request-response | `cycles/hooks/useCyclePulses.ts` | role-match |
| Routes: `my-pulses/index.tsx`, `cycles/index.tsx`, `cycles/$cycleId.tsx` | route | request-response | `src/routes/.../my-pulses/index.tsx` (stub) | exact |

Delete (per RESEARCH): `usePointerDrag.ts`, `KanbanColumn.tsx`, `PulseCard.tsx` (old), `CyclePulseBoard.tsx`, `CycleGuest.tsx`, `StartCycleForm.tsx`, `useActiveCycle`, `useCycleForm`, `useCyclePulses`, `useMyWork`, `cycles/lib/kanban.ts`. Keep `pulses/components/PulseBoard.tsx` compiling (it imports `PulseProofLinks`).

---

## Pattern Assignments

### `convex/work/pulses.ts` (controller, request-response) - new `get`, `move`, rewritten lists

**Analog:** itself (`convex/work/pulses.ts`).

**Imports + seams** (lines 1-27): every function starts with `requireUserId`, then a seam.
```typescript
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { notifyFounders } from "../lib/notify";
import { requireMembership } from "../lib/teams/membership";
import { requireCycleAccess } from "../lib/work/cycles";
import { loadPulseContext, requirePulse, requireWorkablePulse, toPulse, withAssignees } from "../lib/work/pulses";
import { proofLinkKind, pulseStatus } from "../schema";
```

**Query pattern to replace** (lines 32-46, `listForCycle`): auth then `withIndex`, bounded `.take`. Keep the shape, switch to four `by_cycle_and_status_and_rank` reads with `.take(MAX_CYCLE_PULSES_PER_STATUS)`.
```typescript
const userId = await requireUserId(ctx);
await requireCycleAccess(ctx, args.cycleId, userId);
const pulses = await ctx.db.query("pulses")
	.withIndex("by_cycle", (q) => q.eq("cycleId", args.cycleId))
	.order("desc").take(PULSE_PAGE_SIZE);
return await withAssignees(ctx, pulses);
```

**Cycle vs Board branch** (lines 157-188, `setStatus`) is the pattern for `move`: `requireWorkablePulse` returns `{pulse, context}`; `context.kind === "trial"` refuses review; cycle branch refuses `done`; entering review calls `notifyFounders`. Add Proof gate + `reviewNote: undefined` here and route through `placePulse`.
```typescript
const { pulse, context } = await requireWorkablePulse(ctx, args.pulseId);
if (context.kind === "trial") {
	if (args.status === "review") throw new Error("Pulses on a Board have no review step");
	await ctx.db.patch(pulse._id, { status: args.status }); return;
}
if (args.status === "done") throw new Error("Only a Founder can verify a Pulse, once it is in review");
await ctx.db.patch(pulse._id, { status: args.status });
if (args.status === "review") {
	await notifyFounders(ctx, pulse.startupId, { kind: "pulse", title: `${pulse.title} is ready for review`, href: await pulseHref(ctx, pulse) });
}
```

**Review path** (lines 190-215, `verify`/`reject`): `requireSubmittedPulse` then `resolveReview`; place verified at top of done, rejected at end of in_progress via `placePulse`. Keep messages asserted by `review.test.ts` (38, 44, 47, 62, 101).

**Insert sites needing `rank`:** `create` lines 128-134 (`ctx.db.insert("pulses", {startupId, cycleId, title, status: "todo", createdByUserId})`), plus `convex/lib/work/boards.ts:81`, `convex/lib/hiring/challenges.ts:21`.

**Malformed id (get):** use `pulseId: v.string()` + `ctx.db.normalizeId("pulses", ...)`, return `null` (no analog in repo; RESEARCH Pattern 5). Capability flags must reuse `requireBoardOwner`/`requireCycleAccess` via non-throwing wrappers.

**Error handling:** plain `throw new Error("...")`, messages surfaced verbatim by the UI via `toErrorMessage`.

---

### `convex/lib/work/pulses.ts` (service) - `patchPulse`, gate, carry-over

**Analog:** itself. Excerpts to extend:

`requireWorkablePulse` (lines 101-122): add `assertCycleOpen` in the cycle branch after `requireCycleAccess`.
```typescript
await requireCycleAccess(ctx, context.cycleId, userId);
if (pulse.status === "review") throw new Error("This Pulse is awaiting review");
if (pulse.status === "done") throw new Error("This Pulse is already verified");
```

`moveUnfinishedPulses` (lines 205-221): currently only `patch({ cycleId })`. Must also re-place at end of target column and unassign non-members (precedent: `unassignPulsesInCycle`, lines 170-185, uses `by_cycle` + `isUnfinished` + `patch({assigneeUserId: undefined})`). Note: uses unbounded `.collect()`; new code should follow `.take(N)` per CLAUDE.md.

`isUnfinished` (line 165) is not exported; export it for the Close dialog count.

---

### `convex/work/cycles.ts` (controller) - `get`, summary, guards, close-with-new

**Analog:** itself.

**Founder-gated mutation pattern** (lines 49-86, `create`): `requireUserId` -> `requireFounderMembership` -> validate (`endAt <= startAt`) -> `insert` -> `addCycleMember` loop -> `ctx.scheduler.runAt(args.startAt, internal.work.cycles.autoStart, {cycleId})`. Extract into `lib/work/cycles.ts::createCycle` so `close` with a `newCycle` payload reuses it atomically.

**Member-scoped list** (lines 23-47): Founders get all; Members filtered with `getCycleMember`. Copy for `list` summary and `listMine` fix (use `by_startup_and_status` as in `autoStart` lines 96-101):
```typescript
const active = await ctx.db.query("cycles")
	.withIndex("by_startup_and_status", (q) => q.eq("startupId", cycle.startupId).eq("status", "active"))
	.take(10);
```

**Guards:** `autoStart` line 92 (`if (cycle?.status !== "planned") return;`) is the model for `start` requiring `planned`; `close` must refuse `closed`.

---

### `convex/lib/work/rank.ts` and `kanbanRules.ts` (utility, transform)

**Analog for import-from-src precedent:** `src/features/hiring/trialCycles/constants.ts:1` and `src/features/people/profile/components/ScoreEvidence.tsx:1`:
```typescript
import { SCORE_WEIGHTS } from "@convex/lib/reputation/scoreWeights";
```
Keep both modules dependency-free (no `_generated`, no `ctx`).

**`kanbanRules.ts` core: move `src/features/work/cycles/lib/kanban.ts` lines 3-54 verbatim**, then add `{kind: "cycle"|"board", proofLinkCount}` and the "Add a Proof Link first" refusal. Keep these exact strings: "Verified Pulses are final", "This Pulse is awaiting review", "Only a Founder can verify a Pulse, once it is in review", "Send it back to in progress with a note".
```typescript
export function kanbanMove(from: PulseStatus, to: PulseStatus, isFounder: boolean):
	KanbanMove | { kind: "refused"; reason: string } | null {
	if (from === to) return null;
	if (from === "done") return { kind: "refused", reason: "Verified Pulses are final" };
	if (from === "review") { /* non-founder refused; done -> verify; in_progress -> return; else refused */ }
	if (to === "done") return { kind: "refused", reason: "Only a Founder can verify a Pulse, once it is in review" };
	return { kind: "status", status: to };
}
```
Caveat: `PulseStatus` type currently comes from `~/features/work/pulses/constants` (a `src` import); a `convex/lib` module cannot import `~`. Define the type locally via `Infer<typeof pulseStatus>` or a literal union.

**`rank.ts`:** copy `rankBetween` / `isCrowded` / `RANK_STEP` from RESEARCH Pattern 1 (no codebase analog; numeric float64).

---

### `convex/migrations.ts` - `backfillPulseRanks` (migration, batch)

**Analog:** `migratePulses` (lines 10-25). Idempotent `internalMutation`, `for await (const pulse of ctx.db.query("pulses"))`, `ctx.db.patch`. Rank per (cycle or trial, status) by `_creationTime`; skip rows that already have `rank`.
```typescript
export const migratePulses = internalMutation({
	args: {},
	handler: async (ctx) => {
		for await (const pulse of ctx.db.query("pulses")) { /* ... */ await ctx.db.patch(pulse._id, {...}); }
	},
});
```

---

### `convex/schema.ts` pulses table (model)

**Analog:** lines 211-235. Add `rank: v.optional(v.number())`, `updatedAt: v.optional(v.number())` and indexes in the existing chained style:
```typescript
.index("by_cycle", ["cycleId"])
.index("by_trial_and_status", ["trialCycleId", "status"])
.index("by_assignee", ["assigneeUserId"]),
// add: .index("by_cycle_and_status_and_rank", ["cycleId","status","rank"])
//      .index("by_assignee_and_status", ["assigneeUserId","status"])
```
Also consider a trial equivalent for Phase 4 reuse (D-23); planner discretion.

---

### Backend tests (`convex/work/*.test.ts`, test)

**Analog:** `convex/work/review.test.ts` lines 1-63. Public API only, `t.withIdentity` via `as`:
```typescript
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import { createTest, cyclePulseFor, joinAsMember, notificationTitles, setUpStartup } from "../test.helpers";

async function setUpReview() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(t, setup, "Bob");
	const pulse = await cyclePulseFor(t, setup, bob);
	return { t, setup, bob, ...pulse };
}
await expect(bob.as.mutation(api.work.pulses.setStatus, { pulseId, status: "done" })).rejects.toThrow("Only a Founder can verify");
```
**Required fix (RESEARCH Pitfall 4):** 13 call sites move to review with no Proof Link (review.test.ts; cycles.test.ts:195,:250; notifications.test.ts:215; teams/activity.test.ts:37,:61; teams/invitations.test.ts:195). Add `submitForReview(as, pulseId)` to `convex/test.helpers.ts` (addProofLink then setStatus review) and use it everywhere.

---

### `src/shell/shortcuts/registry.ts` (config, event-driven)

**Analog:** itself. Add entries in this exact shape; `key: "c"` (lowercase, `useShortcuts.ts:42` matches `event.key`); Create Cycle uses `key: null`, `scope: "startup"`.
```typescript
{
	id: "palette.open",
	key: "mod+k",
	label: "Open command palette",
	scope: "global",
	action: (ctx) => ctx.togglePalette(),
},
```
Extend types (lines 5-19):
```typescript
export type ShortcutContext = { navigate: ReturnType<typeof useNavigate>; focusedSlug: string | null; togglePalette: () => void; openShortcutSheet: () => void; focusSearch: () => void; /* + openCreatePulse, focusedRole */ };
export type ShortcutEntry = { id: string; key: string | null; label: string; scope: ShortcutScope; action: (ctx: ShortcutContext) => void; /* + when?: (ctx) => boolean */ };
```

### `src/shell/command/CommandProvider.tsx` + `CreatePulseProvider.tsx`

**Analog:** `CommandProvider.tsx` lines 14-126: context value type, `createContext<...|null>(null)`, `useCallback` open helpers, `useX()` hook that throws outside provider, `useShortcutContext()` builds the registry context (lines 106-119) - add `openCreatePulse` and `focusedRole: focused?.membership.role ?? null` (verify field name in `useFocusedStartup`).
```typescript
export function useCommands() {
	const ctx = useContext(CommandContext);
	if (!ctx) throw new Error("useCommands must be used within a CommandProvider");
	return ctx;
}
```

### `src/shell/command/CommandPalette.tsx`

**Analog:** itself lines 29-38: `screenEntries` filter only checks `scope === "startup"`. Add `if (entry.when && !entry.when(ctx)) return false;`.

### `src/shell/layout/AppShell.tsx`

**Analog:** itself lines 22-38: mount `<CreatePulseProvider>` inside `<CommandProvider>` and `<QuickCreateDialog />` next to `<ShellKeyboard />`/`<CommandPalette />`. Provider must wrap `ShellKeyboard` since `useShortcutContext` reads it.

---

### `src/features/work/pulses/hooks/*`, `cycles/hooks/*` (hook, request-response)

**Analog:** `src/features/work/cycles/hooks/useCyclePulses.ts` (lines 1-52). Thin wrapper over `useQuery`/`useMutation`, `toast.error(toErrorMessage(...))`, pending id state. Keep this shape but replace `window.prompt` (line 42) with the Return dialog, and use `.withOptimisticUpdate` for `move` (RESEARCH Pattern 4).
```typescript
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

const pulses = useQuery(api.work.pulses.listForCycle, { cycleId });
try { await action(); } catch (error) { toast.error(toErrorMessage(error, "Could not update Pulse")); }
```

### `src/features/work/pulses/components/ProofLinksSection.tsx`

**Analog:** `PulseProofLinks.tsx` lines 1-79 (props `pulseId, proofLinks, canEdit, isPending, run`; `inferProofLinkKind`, `proofLinkLabel` from `constants`; `addProofLink({pulseId,url,kind})`, `removeProofLink({pulseId,url})`). Replace `window.prompt` (line 30) with URL `Input` + "Add" Button; use `Badge` for kind and `aria-label="Remove Proof Link"`. Keep exporting `PulseProofLinks` or update `PulseBoard.tsx` import.

### `src/features/work/pulses/constants.ts`

**Analog:** itself (`PULSE_STATUSES`, `PulseStatus`, `PROOF_LINK_KINDS`, `inferProofLinkKind`). Append `MY_PULSES_RECENT_DONE_LIMIT`, priority list, status icon map, `isOverdue` (end of due day, Pitfall 12).

### `src/features/work/pulses/components/PulseRow.tsx` / `PulseCardView.tsx`

**Analog:** old `cycles/components/PulseCard.tsx` (not read in detail; read before rewriting to keep avatar usage). Must be presentational with no `useSortable` (DragOverlay reuse). Tokens per UI-SPEC "Shared row/card data".

### Route files (route, request-response)

**Analog:** `src/routes/_shell/_authed/my-pulses/index.tsx` (12 lines, stub). Keep thin: `createFileRoute` + `validateSearch` + render a page from `features/`.
```typescript
export const Route = createFileRoute("/_shell/_authed/my-pulses/")({
	component: () => (<StubScreen title="My Pulses" ... />),
});
```
Add `validateSearch: z.object({ pulse: z.string().optional() })` on My Pulses and `cycles/$cycleId` (route ids: `/_shell/_authed/s/$slug/_member/cycles/$cycleId`, `.../cycles/`). Never hand-edit `src/routeTree.gen.ts`. Page components go under `src/features/work/<feature>/pages/` (ADR 0006); no `pages/` dirs exist yet.

### Empty states

**Analog:** `src/components/shared/EmptyState.tsx` (props `title`, `description`, `action?: ReactNode`). Use for all UI-SPEC empty states.

---

## Shared Patterns

### Authorization (backend)
**Source:** `convex/work/pulses.ts:35-36`, `convex/lib/work/cycles.ts:26-43`
**Apply to:** every new/changed query and mutation. `requireUserId(ctx)` first, then `requireCycleAccess` (Founders implicit, Members via `getCycleMember`; throws "You are not part of this Cycle"), `requireFounderMembership`, `requireWorkablePulse`, `requireSubmittedPulse`, or `requireBoardOwner`. `listMine`/`get` must re-check access per row and return `null`/skip rather than throw.

### Backend rules are the source of truth, UI mirrors via shared import
**Source:** `src/features/work/cycles/lib/kanban.ts` -> `convex/lib/work/kanbanRules.ts`
**Apply to:** `setStatus`, `move`, `useKanbanDrag`/`dropVerdict`, peek status picker.

### Error handling to toast
**Source:** `src/features/work/cycles/hooks/useCyclePulses.ts:17-26` + `~/lib/validation` `toErrorMessage`
**Apply to:** all frontend mutations (rollback is automatic with optimistic updates; toast the backend message verbatim, fallback copy from UI-SPEC).

### Side effects
`notifyFounders`/`notify` (`lib/notify.ts`), `logActivity` (`lib/activity.ts`), `pulseHref`/`cycleHref` (`lib/links.ts`), as in `verify` (pulses.ts:190-204). Use for any new Cycle/Pulse transitions.

### Index-only queries with bounds
`withIndex` + `.take(N)`; no `.filter`, avoid unbounded `.collect()` in new code (existing `unassignPulsesInCycle`/`moveUnfinishedPulses` violate this; do not copy).

### Frontend conventions
Biome tabs/double quotes, `~/` and `@convex/` aliases, files under ~250 lines, semantic tokens only, mobile-first, `h-11` touch targets below `md`, constants in `constants.ts`, glossary terms only.

### shadcn additions
`pnpm ui popover select collapsible`, then fix `import { cn } from "cn"` -> `~/lib/utils`, remove stray `cn` dependency and any `.dark` block (recorded in STATE.md). Installed today: avatar, badge, button, card, command, dialog, dropdown-menu, input, label, separator, sheet, sidebar, skeleton, sonner, tabs, textarea, tooltip. New tokens `--warning`/`--warning-foreground` go in `src/styles/globals.css`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/features/work/kanban/*` (dnd-kit board/list/sensors) | component | event-driven | No dnd-kit in repo; old `usePointerDrag.ts` is being deleted. Use RESEARCH "Code Examples" (Mouse + Touch + Keyboard sensors, one `SortableContext` per column, `DragOverlay`). |
| `convex/lib/work/rank.ts` numeric rank | utility | transform | No ordering code exists. Use RESEARCH Pattern 1. |
| `pulses.get` with `normalizeId` | query | request-response | No existing string-id query; RESEARCH Pattern 5. |
| `useMutation(...).withOptimisticUpdate` | hook | request-response | Not used anywhere yet (grep before assuming); RESEARCH Pattern 4. |
| `PulsePeek` Sheet (URL-driven) | component | request-response | Sheet exists in `ui/sheet.tsx` but no search-param-driven panel; see Pitfall 14. |
| `validateSearch` routes | route | request-response | No route in repo uses search params; RESEARCH Pattern 5. |
| Popover/Select/Collapsible usage | component | n/a | Components not installed yet. |

## Metadata

**Analog search scope:** `convex/work`, `convex/lib/work`, `convex/migrations.ts`, `convex/test.helpers.ts`, `convex/schema.ts`, `src/shell`, `src/features/work`, `src/routes/_shell`, `src/components`
**Files scanned:** about 45 (fully read: 11; the rest via git ls-files/grep)
**Pattern extraction date:** 2026-09-29
