# Phase 2: My Pulses & Cycle Boards - Research

**Researched:** 2026-09-29
**Domain:** Convex backend (Pulse ordering, My Pulses read model, Cycle lifecycle) + React 19 SPA (dnd-kit kanban, URL-addressable peek panel, quick-create, Cycles screens)
**Confidence:** HIGH on backend and codebase findings (every source file was read this session), MEDIUM on dnd-kit interaction details (documentation-confirmed, but touch and snap-scroll behaviour needs a device check)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### My Pulses (WORK-01)
- **D-01:** My Pulses shows all four status groups: In progress, Review (Submitted), Todo, then Done. **Done is collapsed by default and limited to recent items.**
- **D-02:** Inside each status group the list is **flat, across Startups**. Every row carries a small context label: `Startup · Cycle` or `Startup · Trial Cycle`. There is no sub-grouping by Startup.
- **D-03:** Clicking a row **opens the peek panel in place** on My Pulses, using the same `?pulse=<id>` search param. The panel has an "Open in Cycle / Board" link that navigates to the Pulse's home screen.
- **D-04:** My Pulses has **no drag and no manual order**. Groups are auto-sorted: by the Pulse's Cycle rank, then by most recently updated. The exact tie-breaks are Claude's discretion.
- **D-05:** The empty state (no Pulses at all) offers "Find a Trial Cycle" (→ `/discover`) and "Create a Startup", per WORK-01.

#### Quick create (`C`)
- **D-06:** `C` opens a quick-create dialog.
  - **Title is required** and autofocused.
  - A compact optional row holds **priority, assignee (default: me) and due date**.
  - **Enter** creates the Pulse. **⌘/Ctrl+Enter** creates it and keeps the dialog open for the next one.
  - Description is added later in the peek panel.
- **D-07:** Inside a Cycle, `C` targets that Cycle. On **My Pulses**, `C` opens the same dialog with a **Cycle picker**, defaulting to the Focused Startup's active Cycle and listing only Cycles the caller can see. Register `C` / "Create Pulse" and "Create Cycle" in the Phase 1 shortcut registry (`src/shell/shortcuts/registry.ts`, per Phase 1 D-19).

#### Pulse card & peek panel (WORK-03)
- **D-08:** The **card is Linear-compact**. It shows:
  - the title
  - a priority icon
  - the assignee avatar (rounded-square, per Phase 1 D-08)
  - the due date, only when set, in destructive colour when overdue
  - a Proof Link count
  - a "Returned" marker when `reviewNote` is set

  It shows no description excerpt. The same row/card data is used for List rows and My Pulses rows.
- **D-09:** The **peek panel edits inline and saves on blur/change**, Linear-style.
  - Click the title or description to edit it.
  - Status, priority, assignee and due date are property pickers in a side column on desktop, and a top block when the panel is full-screen on mobile.
  - There is no separate Edit mode.
- **D-10:** A **returned Pulse** shows a warning-style callout at the top of the panel: "Returned by Founder" plus the note. It **clears when the Pulse is resubmitted** to review. This uses the existing `reviewNote` field; there is no review history table.
- **D-11:** Founder review lives in the peek panel of a Submitted Pulse: **Verify**, or **Return** with a required note (existing `verify` / `reject` mutations).
- **D-12:** **A Cycle Pulse needs at least one Proof Link before it can move to review. This is enforced in the backend** (`setStatus` → review, and any other path into review).
  - When it's missing, the UI pre-empts the move and shows "Add a Proof Link first".
  - This does not apply to Trial Board Pulses, which have no review step.
  - Whether the last Proof Link can be removed while the Pulse is in review is Claude's discretion. Submitted Pulses are already non-workable for the assignee, so this is likely moot.
  - **Reversibility:** reversible. It is a single backend guard plus tests, with no data change.

#### Cycles screens & lifecycle (WORK-04)
- **D-13:** `/s/$slug/cycles` is a **sectioned list**: Active, then Planned, then Closed (collapsed).
  - Each row shows the title, date range, a done/total progress count and a member avatar stack.
  - Founders get a "New Cycle" primary button.
  - The list respects Cycle-scoped visibility: Members see only their Cycles, Founders see all.
- **D-14:** **Start and Close are Cycle header actions**. The header shows a status badge plus "Start now" when the Cycle is planned, or "Close Cycle" when it is active. The same actions are in a row menu on the list. Starting while another Cycle is active shows a confirm saying the active one will close; the backend allows only one active Cycle per Startup.
- **D-15:** The **Close dialog** shows "N unfinished Pulses" (unfinished = todo, in progress and review; the existing `isUnfinished`) and a target select with three choices:
  - an existing planned/active Cycle
  - **"+ New Cycle"**, a compact title/dates form inside the dialog that creates the Cycle and carries the Pulses into it
  - "Leave in this Cycle"

  Inline create probably means `close` accepts a new-Cycle payload, or the client calls `create` and then `close`. Claude's discretion; atomic is preferred.
- **D-16:** **Cycle Members** are managed from an **avatar stack in the Cycle header**. It opens a popover listing the Members with remove buttons and an "Add" combobox of Startup Members. Founders are shown as implicit members and can't be removed. Members can also be picked when creating a Cycle (the existing `memberUserIds` arg).
- **D-17:** Empty states:
  - A Member in no Cycles sees: "You're not in a Cycle yet. A Founder adds you to one."
  - A Founder with no Cycles sees "Create your first Cycle" as the primary action.

#### Board vs List & drag (WORK-02)
- **D-18:** The **Cycle opens on Board everywhere, desktop and mobile**. The Board/List toggle in the Cycle header is **not remembered**; it resets on each visit (plain component state, no localStorage and no `?view=` param).
- **D-19:** On mobile, the **Board uses snap-scrolling columns**, each about 85% of the viewport width with horizontal scroll-snap. The touch sensor uses a **long-press activation** so drag doesn't fight scrolling, and dragging near the edge auto-scrolls to the neighbouring column.
- **D-20:** **List view** has collapsible status groups using the shared row component. **Rows can be dragged between groups, and reordered within a group**, like the Board. Status can also be changed from the peek panel.
- **D-21:** A disallowed drag is **pre-empted and backed by a backend fallback**.
  - While dragging, columns/groups the user can't drop into are dimmed with a not-allowed cursor, and dropping there animates back.
  - The UI rules mirror the backend: only Founders move to done; the assignee can't move a Submitted Pulse; review needs ≥1 Proof Link (D-12).
  - If the backend still rejects a move, the optimistic change is rolled back and a toast shows the backend's message.
  - The backend remains the source of truth; the rules are never enforced only in the UI.

#### Manual ordering
- **D-22:** Pulses are **manually reordered by drag within a column/group**. **The order is shared**: there is one rank per Pulse, visible to everyone on the Cycle.
  - Anyone allowed to move a Pulse may reorder it.
  - Pulses in review can only be reordered by Founders, matching the move rules.
  - This needs a new rank field on `pulses` (e.g. a fractional/lexo rank string), plus a reorder/move mutation that sets status and rank together.
  - **Reversibility:** costly. It adds a schema field, an index, and backfill/defaulting for existing Pulses, and every list query sorts on it. There are no production users (PROJECT.md), so a lossy backfill is fine.
- **D-23:** The rank **lives on the Pulse, so Trial Board kanbans reuse it in Phase 4**. My Pulses stays auto-sorted (D-04).

#### Trial Board Pulses in the peek panel
- **D-24:** Board Pulses reached from My Pulses open in the **same peek panel component with Board rules**:
  - there is no review/verify block and no Proof gate
  - the Participant can edit and move them
  - fields go read-only once the Board is locked (Verdict or end date)
  - the panel goes through the existing `requirePulse`/`requireWorkablePulse` seam

  The Trial Board screen itself is Phase 4.

### Claude's Discretion
- The rank encoding (fractional index vs lexorank) and the rebalance strategy.
- How many "recent" Done items My Pulses shows (a constant in `constants.ts`).
- The exact dnd-kit sensor tuning (long-press delay, tolerance) and the edge auto-scroll thresholds.
- Whether the Cycle create form is a dialog or a sheet. Its fields are title, start/end dates and optional Members.
- Making the kanban/List components generic over the column set (4 Cycle columns vs 3 Board columns), so Phase 4 can reuse them without a rewrite.
- The peek panel's width on desktop and the breakpoint (reuse the shell's desktop breakpoint).
- The copy and styling of the "Returned" callout, within the Phase 1 tokens (blue used sparingly; a warning/destructive tone here).

### Deferred Ideas (OUT OF SCOPE)
- **Review history** (a timeline of every verify/return with notes) was considered and not chosen. Only the latest `reviewNote` is kept (D-10).
- **Comments/activity feed inside the peek panel** was not discussed and is a new capability. If it's wanted, it belongs in a later phase.
- **Remembering the Board/List choice** was considered and not chosen (D-18).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WORK-01 | Land on My Pulses after sign-in; Cycle Pulses assigned to them across every Startup plus Board Pulses in live Trial Cycles, grouped by status, labelled Startup + Cycle/Trial Cycle; empty state "Find a Trial Cycle" / "Create a Startup" | Post-sign-in redirect to `/my-pulses` already exists (Phase 1). Needs a rewritten `pulses.listMine` (new `by_assignee_and_status` index, access re-checks, container labels, Done limit). See "My Pulses read model". |
| WORK-02 | Cycle as drag-and-drop Board or List via dnd-kit (pointer/touch/keyboard), disallowed drag visibly refused, matching backend rules | New `rank` field + `by_cycle_and_status_and_rank` index + `pulses.move`; dnd-kit core/sortable/utilities; shared pure rules module; Mouse+Touch (not Pointer) sensors. See "Ordering and move" and "dnd-kit". |
| WORK-03 | Peek panel via URL search param, Esc closes, full-screen below desktop breakpoint, Proof Links add/view/remove, Founder verify / return with note | `validateSearch` (zod, Standard Schema) on both routes; new `pulses.get` query (returns null instead of throwing); extend `update` for priority/dueAt/assignee; Proof gate; clear `reviewNote` on resubmit. |
| WORK-04 | Quick-create dialog (`C`); Founder creates/starts/closes Cycles with carry-over; adds/removes Cycle Members; Members see only their Cycles | Registry + provider extension for `C`; `create` extended with priority/assignee/dueAt; `cycles.get`, `cycles.list` summary, atomic close-with-new-Cycle, lifecycle guards; `listMine` bug fix. |
</phase_requirements>

## Summary

The Convex side already has most of the domain rules (Founder-only verify, Board-vs-Cycle split via `requirePulse`/`requireWorkablePulse`, Cycle-scoped visibility via `requireCycleAccess`). What is missing is a set of read/write shapes the new UI needs, and six pieces of backend work that this phase must add: (1) a `rank` field, an index and a combined move/reorder mutation; (2) the Proof Link gate on review; (3) a rewritten `listMine` for My Pulses; (4) a `pulses.get` detail query and an extended `update`/`create` (today `update` accepts only `title` and `description`, and `create` accepts neither priority, assignee nor due date, so the peek panel's property pickers and the quick-create row have no backend to call); (5) Cycle summary/`get` queries and an atomic close-with-new-Cycle; (6) lifecycle guards (`start` and `close` currently do not check the Cycle's current status, and nothing stops edits inside a closed Cycle even though the UI contract says a closed Cycle is read-only).

Three facts in the UI-SPEC and CONTEXT do not match the code and change the plan: the Pulse table has no `updatedAt` (D-04 and the UI-SPEC sort by "most recently updated"), 13 existing test call sites move a Pulse to review with no Proof Link and will fail when the gate lands, and the old `PointerSensor` recommendation in the UI-SPEC would break touch scrolling because there is no drag handle (dnd-kit's own docs say to use Mouse + Touch sensors instead). All of these are covered below with prescriptive fixes.

On the frontend, no old Cycle UI is imported anywhere any more (CycleGuest, CyclePulseBoard, KanbanColumn, PulseCard, StartCycleForm and the hooks are orphaned), so they can be rewritten freely. Build the kanban and List as a generic `src/features/work/kanban/` layer (columns are a prop) so Phase 4 reuses it. Rank is a plain `number` (float64) with midpoint insertion and column rebalance, and the client sends *neighbour ids, not ranks*, so the backend stays the source of truth.

**Primary recommendation:** Land the backend first (schema+rank+backfill, `move`, Proof gate, `get`, `listMine`, Cycle summary/close-with-new, guards, test fixes), then build the generic kanban layer and the shared shell hooks (`C` provider), then the four screens and the peek panel on top of them.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Move/reorder rules (Founder-only done, review lock, Proof gate) | API / Backend | Browser (pre-empt) | Backend is the source of truth (D-21); browser mirrors via one shared pure rules module. |
| Rank assignment and rebalancing | API / Backend | Browser (optimistic estimate only) | Server reads neighbours and computes the rank; a client-computed rank would be stale under concurrent drags. |
| My Pulses assembly (across Startups, access re-check, Done limit) | API / Backend | — | Cross-table access filtering must be server-side. |
| Peek panel visibility / lock state / capability flags | API / Backend | Browser (renders flags) | `pulses.get` returns `canEdit`, `lockedReason`, `canReview`, `canDelete` so the UI never re-derives authorization. |
| Drag state, virtual move during drag, inline-edit drafts, Board/List toggle | Browser / Client | — | Pure ephemeral UI state (D-18: no persistence). |
| `?pulse=` panel open state | Browser / Client (URL) | — | TanStack Router search param, no server involvement. |
| `C` shortcut and quick-create dialog | Browser / Client | API (create) | Shell-level provider; dialog reads the route to pick the target Cycle. |
| Cycle progress counts, member stack | API / Backend | — | Bounded index scans server-side; Members' visibility scoping. |
| Ordering index | Database / Storage | — | `by_cycle_and_status_and_rank`, `by_assignee_and_status`. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@dnd-kit/core` | 6.3.1 (published 2024-12-05) | DndContext, sensors, DragOverlay, collision detection, autoScroll, announcements | Locked by CONTEXT/UI-SPEC/PROJECT.md. `latest` dist-tag. Peer `react >=16.8.0`, so React 19 is fine. [VERIFIED: npm registry `npm view`, plus package-legitimacy seam OK] |
| `@dnd-kit/sortable` | 10.0.0 (2024-12-04) | `SortableContext`, `useSortable`, `sortableKeyboardCoordinates` | Same. Peer `@dnd-kit/core ^6.3.0`. [VERIFIED: npm registry, seam OK] |
| `@dnd-kit/utilities` | 3.2.2 (2023-11-06) | `CSS.Transform.toString` for item transforms | Same. [VERIFIED: npm registry, seam OK] |
| `zod` | 4.6.5 (already installed) | `validateSearch` schema (`pulse` param) and dialog form schemas | Already the project's validator; TanStack Router accepts a Standard Schema directly. [VERIFIED: node_modules/zod/package.json line 3 `"version": "4.6.5"`; `router-core@1.171.32` `route.d.ts:72` types resolve `AnyStandardSchemaValidator` via `['~standard']`] |
| shadcn `popover`, `select`, `collapsible` | via `pnpm ui popover select collapsible` | Assignee picker/Members popover, Cycle/target selects, collapsible groups | Named in UI-SPEC; not yet installed. [CITED: 02-UI-SPEC.md Design System] |

`@dnd-kit/react` 0.5.0 exists (pre-1.0 rewrite, last modified 2026-09-12) with a different API (`DragDropProvider`, no `SortableContext`). **Do not use it**: the locked packages, the UI-SPEC sensor/`SortableContext` language and `sortableKeyboardCoordinates` all refer to the classic 6.x/10.x API. Note that Context7's dnd-kit snippets mostly show the new API; the classic docs are at dndkit.com/api-documentation/... [VERIFIED: npm registry]

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `convex/react` `useMutation(...).withOptimisticUpdate` | convex 1.46.0 (installed) | Optimistic move/verify with automatic rollback | Every drag drop. [CITED: docs.convex.dev/client/react/optimistic-updates] |
| `sonner` 2.0.8 (installed) | Error/success toasts | Rejected moves, "Pulse created" with Open action | Already mounted. |
| `lucide-react` (installed) | Status/priority icons | `Circle`, `CircleDot`, `CircleDashed`, `CircleCheck`, `SignalLow/Medium/High`, `AlertTriangle`, `Link` | UI-SPEC. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Numeric `rank: number` + midpoint + rebalance | `fractional-indexing` string keys (npm) | A string rank needs a new dependency (PROJECT.md: "No form library, no animation library, no other additions without explicit approval"). Numeric float64 is ~10 lines, sorts natively in a Convex index, and a column holds at most ~100 Pulses so rebalancing is cheap. Recommended: numeric. |
| Classic `@dnd-kit/core` + `sortable` | `@dnd-kit/react` 0.5 | Pre-1.0, different API, contradicts the locked spec. |
| `MouseSensor` + `TouchSensor` | UI-SPEC's `PointerSensor` + `TouchSensor` | See Pitfall 1: PointerSensor on a whole-card activator needs `touch-action: none`, which kills vertical scroll on touch. |

**Installation:**
```bash
pnpm add --save-exact @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2
pnpm ui popover select collapsible
```
The repo pins exact versions (no `^`) in `package.json`, hence `--save-exact`. After `pnpm ui`, re-check the generated files: Phase 1 recorded that the shadcn CLI wrote `import { cn } from "cn"` and added a stray `cn` dependency, and that it appended a `.dark` / `@custom-variant dark` block. Fix imports to `~/lib/utils`, remove the stray dependency and delete any dark block. [CITED: .planning/STATE.md Phase 01 decisions]

**Version verification:** `npm view @dnd-kit/core version` → 6.3.1; `@dnd-kit/sortable` → 10.0.0; `@dnd-kit/utilities` → 3.2.2 (run this session). [VERIFIED: npm registry]

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@dnd-kit/core` | npm | 4+ yrs (repo created 2021) | ~29.6M/wk | github.com/clauderic/dnd-kit | OK | Approved (named in CONTEXT + PROJECT.md) |
| `@dnd-kit/sortable` | npm | 4+ yrs | ~28.8M/wk | github.com/clauderic/dnd-kit | OK | Approved |
| `@dnd-kit/utilities` | npm | 4+ yrs | ~29.5M/wk | github.com/clauderic/dnd-kit | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none. All three returned `"postinstall": null`, `"deprecated": false`. [VERIFIED: `gsd_run query package-legitimacy check --ecosystem npm ...` run this session] The package names come from the user-approved CONTEXT.md / PROJECT.md line 118 ("dnd-kit (kanban drag-and-drop ...)"), not from search discovery.

## Architecture Patterns

### System Architecture Diagram

```
                        ┌───────────────────────── Browser (SPA) ─────────────────────────┐
 keyboard `c` ─────────►│ ShellKeyboard/useShortcuts ─► registry action ─► CreatePulseProvider
 palette row ──────────►│                                                    │ opens QuickCreateDialog
                        │                                                    ▼ (target Cycle from route or Select)
 /my-pulses ────────────►  MyPulsesPage ── useQuery(pulses.listMine) ───────────────┐
 /s/$slug/cycles ───────►  CyclesPage  ─── useQuery(cycles.list [+summary]) ────────┤
 /s/$slug/cycles/$id ───►  CyclePage ── Board|List (Tabs state) ─ useKanbanDrag ─────┤
        ?pulse=<id> ────►  PulsePeek (Sheet) ── useQuery(pulses.get) ───────────────┤
                        │   inline edit → update / setStatus / addProofLink / …      │
                        │   drop → move (optimistic) ; Founder: verify | reject(note)
                        └──────────────────────────────────┬──────────────────────────┘
                                                           │ Convex functions
                        ┌──────────────────── API / Backend (convex/) ─────────────────┐
                        │ requireUserId → requireCycleAccess | requireBoardOwner        │
                        │   pulses.get / listForCycle / listMine / create / update      │
                        │   pulses.move ─► lib/work/kanbanRules (shared, pure)          │
                        │              ─► lib/work/pulseOrder.placePulse ─► rankBetween │
                        │   pulses.setStatus/verify/reject ─► same rank placement       │
                        │   cycles.get / list(+summary) / create / start / close(+new)  │
                        └───────────────────────────────┬───────────────────────────────┘
                                                        ▼
                        ┌────────── Database ──────────────────────────────────────────┐
                        │ pulses(rank, updatedAt) idx: by_cycle_and_status_and_rank,    │
                        │   by_assignee_and_status ; cycles ; cycleMembers ; memberships│
                        └──────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
convex/
├── lib/work/
│   ├── rank.ts              # pure: RANK_STEP, rankBetween, isCrowded (imported by backend AND src via @convex/lib/work/rank)
│   ├── kanbanRules.ts       # pure: kanbanMove(from,to,{isFounder,kind,proofLinkCount}) (shared with src)
│   ├── pulseOrder.ts        # DB: placePulse, columnOf, rebalanceColumn
│   ├── pulses.ts            # + patchPulse (stamps updatedAt), canEdit/lock flags, isUnfinished exported
│   └── cycles.ts            # + createCycle(ctx, args) extracted from cycles.create; assertCycleOpen
├── work/pulses.ts           # get, listForCycle, listMine, create, update, setStatus, move, ...
├── work/cycles.ts           # get, list(+summary), create, start, close(+new), listMine fix
└── migrations.ts            # + backfillPulseRanks
src/features/work/
├── kanban/                  # GENERIC (Phase 4 reuses): KanbanBoard, KanbanColumn, KanbanList, SortableRow, useKanbanDrag, dropVerdict, announcements
├── pulses/
│   ├── pages/MyPulsesPage.tsx
│   ├── components/          # PulseRow, PulseCardView, PulsePeek, PulsePeekBody, PulseProperties, ProofLinksSection, ReturnedCallout, ReviewFooter, ReturnDialog, QuickCreateDialog
│   ├── hooks/               # useMyPulses, usePulse, useInlineField, useMovePulse, useCreatePulse
│   ├── schemas/             # quick-create + return-note zod
│   └── constants.ts         # + MY_PULSES_RECENT_DONE_LIMIT, priorities, status icons map
└── cycles/
    ├── pages/CyclesPage.tsx, CyclePage.tsx
    ├── components/          # CycleHeader, CycleRow, MembersPopover, CloseCycleDialog, CreateCycleDialog, StartCycleDialog
    ├── hooks/               # useCycle, useCycleList, useCyclePulses (optimistic), useCycleActions
    └── constants.ts
src/shell/
├── command/CreatePulseProvider.tsx   # open state + target; exposes openCreatePulse
└── shortcuts/registry.ts             # + pulse.create (c), cycle.create (palette-only, Founders)
```
Files stay under ~250 lines (CLAUDE.md); split `PulsePeekBody` into content column, property column and footer.

### Pattern 1: Rank as a shared, pure, numeric key
**What:** `rank: v.optional(v.number())` on `pulses`. The client never sends a rank. It sends `{ pulseId, status, beforePulseId? }` ("insert directly before this Pulse; omit for end of column"). The server loads the destination column in rank order (excluding the moved Pulse), finds `beforePulseId` (if it is gone, append), computes `rankBetween(prev, next)`, and renumbers the column with `RANK_STEP` spacing if the gap is crowded.
**When to use:** every write that changes a Pulse's column: `create` (end of `todo`), `setStatus` (end of destination), `move` (positioned), `verify` (top of `done`), `reject` (end of `in_progress`), carry-over (end of destination column, order preserved).
**Example:**
```typescript
// convex/lib/work/rank.ts  (pure, dependency-free: importable from src via @convex/lib/work/rank)
// Precedent for src importing convex/lib: src/features/hiring/trialCycles/constants.ts imports "@convex/lib/reputation/scoreWeights".
export const RANK_STEP = 1024;
/** Below this gap the column is renumbered instead of halving again. */
export const RANK_MIN_GAP = 1 / 1024;

export function rankBetween(before: number | null, after: number | null): number {
	if (before === null) {
		return after === null ? RANK_STEP : after - RANK_STEP;
	}
	if (after === null) {
		return before + RANK_STEP;
	}
	return (before + after) / 2;
}

export function isCrowded(before: number, after: number): boolean {
	return after - before < RANK_MIN_GAP;
}
```
Constants that are not pure rank math (`MAX_CYCLE_PULSES_PER_STATUS`, `MY_PULSES_MAX_PER_STATUS`, `CYCLE_SUMMARY_SCAN`) go in `convex/lib/limits.ts` per CLAUDE.md.

### Pattern 2: One rules module for backend and UI (D-21 "mirror")
**What:** Move the pure rule function out of `src/features/work/cycles/lib/kanban.ts` into `convex/lib/work/kanbanRules.ts`; import it in `move`/`setStatus` and in the UI's `dropVerdict`. Extend its input with `{ kind: "cycle" | "board", proofLinkCount }` so the Proof gate is one rule with one message ("Add a Proof Link first"), not two copies. Keep the existing refusal strings that tests already assert.
**Why:** "Mirror" implemented as a copy drifts; a shared import cannot. Precedent: `@convex/lib/reputation/scoreWeights` is imported by two UI files.
**Existing strings that tests assert (must survive):** "Only a Founder can verify" (review.test.ts:38, :44), "awaiting review" (review.test.ts:62), "not awaiting review" (review.test.ts:47), "Review note is required" (review.test.ts:101).

### Pattern 3: Drag with a virtual move, one mutation on drop
**What:** In `useKanbanDrag`, hold `activeId` and `overColumn` in state. Render columns from the Convex query result plus a *virtual* override: while dragging, the active Pulse is shown in the hovered column only if `dropVerdict` allows it. On `onDragEnd`: compute `{status, beforePulseId}` from the final over target, call the optimistic `move`, clear drag state in the same handler. Refused target: apply no virtual move, so the DragOverlay's drop animation returns to the source (D-21).
**Founder special cases:** Submitted → Done runs `verify` (optimistic); Submitted → In progress opens the Return dialog and applies nothing until the note is submitted (cancel = card never moved); Submitted → Todo is refused with "Send it back to in progress with a note".
**Do not `disabled` refused columns:** a disabled droppable can never be "over", so the reason line ("Only a Founder can verify a Pulse...") could not show while hovering. Keep droppables enabled and evaluate the verdict yourself.

### Pattern 4: Optimistic move with automatic rollback
```typescript
// Source: https://docs.convex.dev/client/react/optimistic-updates
const move = useMutation(api.work.pulses.move).withOptimisticUpdate((store, args) => {
	const pulses = store.getQuery(api.work.pulses.listForCycle, { cycleId });
	if (pulses === undefined) return;
	// build NEW objects; never mutate `pulses` in place (docs: mutating corrupts client state)
	store.setQuery(api.work.pulses.listForCycle, { cycleId }, applyMove(pulses, args));
});
try { await move(args); } catch (error) { toast.error(toErrorMessage(error, "Couldn't move that Pulse. Try again.")); }
```
The optimistic update is discarded automatically when the mutation settles, and replaced by the server's data, so a rejection needs no manual revert. `applyMove` uses the shared `rankBetween` for an estimate; the server value wins.

### Pattern 5: URL-addressable peek panel
```tsx
// route file stays thin (CLAUDE.md). Source: TanStack Router search-params guide; zod as Standard Schema
const searchSchema = z.object({ pulse: z.string().optional() });
export const Route = createFileRoute("/_shell/_authed/my-pulses/")({
	validateSearch: searchSchema,
	component: MyPulsesRoute,
});
// open: navigate({ search: (prev) => ({ ...prev, pulse: id }) })   // push when opening, replace: true when swapping Pulses
// close: navigate({ search: (prev) => ({ ...prev, pulse: undefined }) })
```
`pulse` is an untrusted string. Never type it as `Id<"pulses">` on the client and never pass it to a `v.id("pulses")` argument: a malformed id throws an argument-validation error and lands in the route error boundary instead of "Pulse not found". Use `pulses.get` with `pulseId: v.string()` and `ctx.db.normalizeId("pulses", args.pulseId)`; return `null` for malformed, missing or inaccessible ids (also avoids confirming that an id exists).

### Pattern 6: Shell hooks for `C` (registry extension)
`ShortcutContext` today carries `navigate`, `focusedSlug`, `togglePalette`, `openShortcutSheet`, `focusSearch`. `C` must open a dialog, and "Create Cycle" is Founder-only, so extend it with `openCreatePulse()` and `focusedRole: "founder" | "member" | null`, and give `ShortcutEntry` an optional `when?: (ctx) => boolean` that `CommandPalette` also applies when building the Screens group (it currently filters only on `scope === "startup"`). Mount a `CreatePulseProvider` + `QuickCreateDialog` inside `CommandProvider` in `AppShell` next to `ShellKeyboard`. The dialog derives its target with `useMatch({ from: "/_shell/_authed/s/$slug/_member/cycles/$cycleId", shouldThrow: false })`: match and Cycle not closed → fixed target; otherwise show the Cycle `Select`.

### Anti-Patterns to Avoid
- **Client-computed ranks sent to the server:** stale under concurrent drags. Send neighbour ids.
- **`.filter()` in queries or unbounded `.collect()`:** CLAUDE.md and the Convex guidelines forbid both. Use the new indexes with `.take(N)`.
- **Mutating the query result inside an optimistic update.**
- **A `Select`/`Popover` UI-only rule with no backend twin.** Every UI refusal has a backend refusal (D-21).
- **`window.prompt` for the Return note or Proof Link URL** (used by the old `useCyclePulses` and `PulseProofLinks`). Replace with the Return dialog and an Input + Add row.
- **Persisting Board/List** (localStorage or `?view=`): explicitly rejected in D-18.
- **A second `?pulse` interpretation:** both routes share one `PulsePeek` component and one param name.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag and drop, sensors, auto-scroll, a11y announcements | Pointer-event drag (the old `usePointerDrag.ts`, to be deleted) | `@dnd-kit/core` + `sortable` | Keyboard lift/move/drop, screen-reader announcements, touch long-press, edge auto-scroll are all built in. |
| Optimistic UI + rollback | Manual "previous state" refs | `useMutation().withOptimisticUpdate` | Convex discards the optimistic layer when the mutation settles. |
| Peek-panel open state | `useState` + manual URL sync | TanStack Router `validateSearch` + `navigate({ search })` | Back button, deep links, notifications linking to a Pulse all work for free. |
| Malformed-id handling | try/catch around `v.id` args | `ctx.db.normalizeId` | Returns `null`, no exception. |
| Date picker | `react-day-picker` / shadcn `calendar` | Native `<input type="date">` + existing `fromDateInput`/`toDateInput` | UI-SPEC bans new libraries. |
| Popover/Select/Collapsible | Bespoke dropdown markup | shadcn `popover`, `select`, `collapsible` | Focus management inside Dialog/Sheet is already solved by Radix. |
| String fractional index / lexorank | A hand-written base-62 key generator | Numeric `rank` with `rankBetween` + rebalance | Sorts natively in a Convex index; no dependency. |
| Access checks | New per-mutation membership queries | `requireCycleAccess`, `requireFounderMembership`, `requireBoardOwner`, `requireWorkablePulse` | These are the seams CLAUDE.md names. |

**Key insight:** every rule already exists in one form or another; the risk in this phase is *duplicating* rules across UI and backend or across `setStatus`/`move`/`verify`, and letting them drift. Centralise rules and rank placement, and route every column-changing write through the same two helpers.

## Runtime State Inventory

Not a rename/refactor phase, but it adds a schema field and an index, so the data-migration facts matter:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Existing `pulses` rows have no `rank` (and no `updatedAt`). Convex sorts a missing field as `undefined`, which is the smallest value, so unranked Pulses sort *first* in `by_cycle_and_status_and_rank`. Dev data only (PROJECT.md: no production users). [CITED: docs.convex.dev/database/types "undefined is considered the smallest value"] | Data migration: `internal.migrations.backfillPulseRanks` (idempotent, `for await` like `migratePulses`), ranking per (cycle, status) by `_creationTime`. Plus a code edit: every insert site sets `rank`. |
| Live service config | None. | None. |
| OS-registered state | None. | None. |
| Secrets/env vars | None. | None. |
| Build artifacts | `convex/_generated/**` and `src/routeTree.gen.ts` regenerate (`convex dev`, `pnpm build`). Never hand-edit. | Run `pnpm dev:backend` / `pnpm build` after route and API changes. |

**Insert sites that must set `rank`** [VERIFIED by `grep insert("pulses"` this session]: `convex/work/pulses.ts:128` (`create`), `convex/lib/work/boards.ts:81` (`createBoardPulse`), `convex/lib/hiring/challenges.ts:21` (`copyChallengeToBoard`).

## Common Pitfalls

### Pitfall 1: PointerSensor + whole-card activator kills touch scrolling
**What goes wrong:** The UI-SPEC recommends `PointerSensor {distance: 8}` plus `TouchSensor {delay: 250}` and *no drag handle*. `PointerSensor` also handles touch pointers; dnd-kit says `touch-action: none` on draggables is "the only way to reliably prevent scrolling for pointer events", and recommends a drag handle so the rest of the list can scroll.
**How to avoid:** Use `MouseSensor` (distance 8) + `TouchSensor` (delay 250, tolerance 8) + `KeyboardSensor`, and put `touch-action: manipulation` on the card. dnd-kit: "use both the Mouse and Touch sensors instead, as Touch events do not suffer the same limitations". [CITED: dndkit.com/api-documentation/sensors/pointer and /touch]
**Warning signs:** on a phone the Board will not scroll vertically when a finger starts on a card, or a drag starts immediately.

### Pitfall 2: KeyboardSensor's default `start` includes Enter, which is the "open peek" key
**What goes wrong:** Defaults are `start: ['Space', 'Enter']`, `end: ['Space', 'Enter']`, `cancel: ['Escape']`. UI-SPEC says Space lifts and Enter opens the panel. With defaults, Enter lifts instead of opening. [CITED: dndkit.com/api-documentation/sensors/keyboard]
**How to avoid:** configure `keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] }` and set custom `accessibility.screenReaderInstructions` (the docs note the ARIA guidance wants both keys and tell you to customise the instructions when you change them). The card is a `role="button"` element, so Enter fires its click and opens the panel. [ASSUMED: option shape for `keyboardCodes` on `useSensor(KeyboardSensor, ...)`; docs page shows the defaults object]

### Pitfall 3: Horizontal scroll-snap fights auto-scroll
**What goes wrong:** `snap-x snap-mandatory` on the Board container re-snaps while dnd-kit's autoScroll is scrolling it, causing jitter or refusing to reach the neighbouring column. [ASSUMED: common behaviour, not confirmed in dnd-kit docs; UI-SPEC already lists touch behaviour as a manual backstop]
**How to avoid:** toggle `snap-none` (or drop `snap-mandatory`) on the container while `activeId !== null`; re-enable on drag end. Verify on a real touch device.

### Pitfall 4: The Proof gate breaks 13 existing test call sites
**What goes wrong:** These tests move a Pulse to review with no Proof Link and will start failing: `convex/work/review.test.ts` (7 `"review"` lines), `convex/work/cycles.test.ts:75` (expects "not part of this Cycle"; the access check runs first so it survives), `:195`, `:250`; `convex/notifications.test.ts:215`; `convex/teams/activity.test.ts:37`, `:61`; `convex/teams/invitations.test.ts:195`. [VERIFIED: `grep "\"review\"" convex --include=*.test.ts` this session]
**How to avoid:** add a helper to `convex/test.helpers.ts` (for example `submitForReview(as, pulseId)` that adds a Proof Link, then sets `review`) and use it at every site. Add new gate tests that deliberately omit the link. If `cyclePulseFor` is touched, also remove its unused `t` parameter (open deferred lint at `convex/test.helpers.ts:175`).

### Pitfall 5: There is no `updatedAt` on pulses
**What goes wrong:** D-04 and the UI-SPEC sort by "most recently updated" and My Pulses' Done group needs "recent". `pulses` has only `_creationTime` (schema.ts:211-229 has no such field). [VERIFIED: schema.ts:211-229]
**How to avoid:** add `updatedAt: v.optional(v.number())` and route every pulse patch through one `patchPulse(ctx, pulse, fields)` helper in `lib/work/pulses.ts` that stamps it. Read with `updatedAt ?? _creationTime`. The fallback (if the planner rejects the field): sort by `_creationTime` desc and define "recent Done" as newest created; this is visibly wrong for old Pulses that were only just verified.

### Pitfall 6: `listForCycle` truncates and orders by creation
**What goes wrong:** `PULSE_PAGE_SIZE = 80`, `by_cycle`, `.order("desc")`, `.take(PULSE_PAGE_SIZE)` returns the 80 newest Pulses in a Cycle in creation order (convex/work/pulses.ts:29, :38-42). A ranked Board needs every column complete and rank-ordered.
**How to avoid:** query `by_cycle_and_status_and_rank` once per status with `.take(MAX_CYCLE_PULSES_PER_STATUS)` and concatenate (four bounded reads). Return `rank` and `updatedAt`.

### Pitfall 7: `cycles.listMine` reads the *oldest* 20 Cycles
**What goes wrong:** `.withIndex("by_startup", ...).take(20)` with no `.order("desc")` returns the 20 oldest Cycles of each Startup (convex/work/cycles.ts:251-254), so the quick-create Cycle picker on My Pulses silently omits new Cycles once a Startup has more than 20, and includes closed ones.
**How to avoid:** rewrite it to read `by_startup_and_status` for `"active"` and `"planned"` only (the picker never needs closed Cycles), bounded, and return `startupSlug` too (the picker groups by Startup and links need the slug).

### Pitfall 8: `start` and `close` do not check current status
**What goes wrong:** `cycles.start` (cycles.ts:170-201) patches `status: "active"` for any Cycle, so calling it on a closed Cycle reopens it; `close` (cycles.ts:203-238) re-logs "closed" for a closed Cycle. The UI only offers the buttons in the right state, but the backend is the source of truth (D-21 spirit).
**How to avoid:** `start` requires `planned`; `close` refuses `closed`. Add tests.

### Pitfall 9: Nothing makes a closed Cycle read-only in the backend
**What goes wrong:** `requireWorkablePulse` checks review/done but not the Cycle's status (lib/work/pulses.ts:101-122). The UI-SPEC says a closed Cycle is read-only (no drag, no New Pulse, peek fields read-only), which the backend does not enforce.
**How to avoid:** add `assertCycleOpen` (refuse when `cycle.status === "closed"`, message "This Cycle is closed") inside `requireWorkablePulse` (cycle branch) and `pulses.create`. Keep `verify`/`reject` allowed on a closed Cycle so a Founder can still finish a review (recommendation; see Open Question 2). Existing tests only touch planned Cycles (they create with `startAt: Date.now()` and never advance timers) or close *after* their assertions, so the guard is safe, but re-run the suite.

### Pitfall 10: Carry-over strands assignees and collides ranks
**What goes wrong:** `moveUnfinishedPulses` only patches `cycleId` (lib/work/pulses.ts:206-221). (a) An assignee who is not a Member of the target Cycle keeps the Pulse but loses access (My Pulses will hide it, only Founders can touch it). (b) Ranks from the old Cycle collide with the target's ranks.
**How to avoid:** during carry-over, re-place each moved Pulse at the end of the matching column of the target (preserving relative order), and unassign assignees who are neither Founders nor Cycle Members of the target. The unassign precedent is `unassignPulsesInCycle` (cycles.ts `removeMember` path, "unfinished Pulses are unassigned"). See Open Question 3.

### Pitfall 11: `reviewNote` is not cleared on resubmit
**What goes wrong:** D-10 says the "Returned" callout clears when the Pulse is resubmitted. `setStatus → review` does not touch `reviewNote` (convex/work/pulses.ts:179-186), and only `verify` clears it (`reviewNote: undefined`). The UI can hide it while the status is review, but the stale note survives in the data, and the card's "Returned" marker rule (D-08: "when `reviewNote` is set") would show it again if the Pulse ever left review by another path.
**How to avoid:** patch `reviewNote: undefined` when moving into `review`. Test it.

### Pitfall 12: Overdue is computed at UTC midnight
**What goes wrong:** `fromDateInput` returns `new Date(`${value}T00:00:00.000Z`).getTime()` (src/lib/dates.ts:3-5). Comparing `dueAt < Date.now()` marks a Pulse overdue from the *start* of its due day (05:30 IST).
**How to avoid:** overdue = status is not `done` and `Date.now() >= dueAt + DAY_MS` (end of the due day, UTC). Put the helper and constant in `constants.ts`.

### Pitfall 13: Founders added as Cycle Members duplicate in the popover
`create({memberUserIds})` and `addMember` call `addCycleMember`, which inserts a `cycleMembers` row for anyone on the team, including Founders, who are implicit members. `listMembers` then returns them again. Make `addCycleMember` skip Founders (they need no row), and have the popover filter Founders out of the Cycle Member list regardless.

### Pitfall 14: Sheet defaults and the built-in close button
`SheetContent` `side="right"` ships `w-3/4 ... sm:max-w-sm` and an absolutely positioned close button. The spec wants `w-full` below `md` and `md:max-w-2xl` with its own 44px close in the header. Pass `showCloseButton={false}`, override with `w-full sm:max-w-none md:max-w-2xl` (`cn` uses tailwind-merge, so the later class wins), and render `SheetClose` yourself. Always render a `SheetTitle` (the Pulse title; use `sr-only` while loading). When the param is removed the query is skipped and content vanishes during the 300ms exit animation; keep the last Pulse id in a ref for the animation.

### Pitfall 15: `C` fires in awkward states
`useShortcuts` ignores modifiers and editable targets, but not `event.repeat`, an already-open dialog (focus on a button inside it), or a screen where nothing can be created. Guard in the `pulse.create` action: no-op when the QuickCreate dialog is already open, when the caller can see no Cycle (toast "You're not in a Cycle yet"), and treat a closed Cycle screen as "no fixed target" (fall back to the picker). Registry key is `c` (lowercase `event.key`), so Shift+C does not fire, matching the existing behaviour.

### Pitfall 16: shadcn CLI regressions (recorded in Phase 1)
See Installation: `import { cn } from "cn"`, stray `cn` dependency, `.dark` block. Also verify the generated `select`/`popover` import from the umbrella `radix-ui` package like the existing `sheet.tsx` does (`import { Dialog as SheetPrimitive } from "radix-ui"`).

### Pitfall 17: Old components are coupled to `PulseProofLinks`
`src/features/work/pulses/components/PulseBoard.tsx` (the old Trial Board, imported by nothing today; Phase 4 owns it) imports `PulseProofLinks`. If you rewrite `PulseProofLinks` for the peek panel, keep `PulseBoard.tsx` compiling (`pnpm check-types`) or update its import; do not delete `PulseBoard.tsx`.

## Code Examples

### Sensors and accessibility
```tsx
// Source: dndkit.com/api-documentation/sensors/{touch,pointer,keyboard}; sortable preset docs
const sensors = useSensors(
	useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
	useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
	useSensor(KeyboardSensor, {
		coordinateGetter: sortableKeyboardCoordinates,
		keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
	}),
);
<DndContext
	sensors={sensors}
	collisionDetection={collisionDetection}   // pointerWithin first; if over a column body, closest card by closestCenter (dnd-kit MultipleContainers pattern)
	accessibility={{ announcements, screenReaderInstructions }}
	onDragStart={...} onDragOver={...} onDragEnd={...} onDragCancel={...}
>
	{columns.map((column) => (
		<KanbanColumn key={column.id} ...>  {/* useDroppable so an empty column is a target */}
			<SortableContext items={column.pulseIds} strategy={verticalListSortingStrategy}>
				{/* items MUST be in render order (docs: "sorted in the same order in which the items are rendered") */}
			</SortableContext>
		</KanbanColumn>
	))}
	<DragOverlay>{activePulse ? <PulseCardView pulse={activePulse} /> : null}</DragOverlay>
</DndContext>
```
Render the `DragOverlay` child from a presentational component with no `useSortable` (docs: a sortable inside the overlay causes id collisions). Use one `SortableContext` per column, `onDragOver` for cross-column virtual moves, and a droppable per column for empty columns. [CITED: dndkit.com/presets/sortable]

### Backend move skeleton
```typescript
// convex/work/pulses.ts (new). Rules come from the shared kanbanRules; placement from pulseOrder.
export const move = mutation({
	args: {
		pulseId: v.id("pulses"),
		status: pulseStatus,
		beforePulseId: v.optional(v.id("pulses")),
	},
	handler: async (ctx, args) => {
		const { pulse, context } = await requireMovablePulse(ctx, args.pulseId, args.status);
		// requireMovablePulse: Board -> requireBoardOwner path (no review); Cycle -> requireCycleAccess + assertCycleOpen;
		//   status change: kanbanMove rules incl. Proof gate; same-status in review: Founder only; from done: refused.
		// beforePulseId must be a Pulse in the SAME container and the destination status, else it is ignored (append).
		await placePulse(ctx, pulse, { status: args.status, beforePulseId: args.beforePulseId });
		// entering review from another status: clear reviewNote and notifyFounders (same as setStatus)
	},
});
```

### `pulses.get` shape (recommended)
Returns `null` for invalid/missing/inaccessible ids; otherwise the Pulse fields the peek needs (`title, description, status, priority, dueAt, proofLinks, reviewNote, assignee (public user), rank`), the container (`kind: "cycle" | "trial"`, `id`, `title`, `startupSlug`, `startupName`, `isClosed`), and capability flags computed on the server: `canEdit`, `lockedReason` (`"in_review" | "verified" | "cycle_closed" | "board_locked" | null`), `canReview` (Founder and status review), `canDelete` (Founder or creator; Board owner), `assignableMembers` (Cycle-visible users: Founders plus Cycle Members; empty for Board Pulses). Compute flags with the same seam functions the mutations use (non-throwing variants) so they cannot drift.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-rolled pointer drag (`usePointerDrag.ts`) | dnd-kit core/sortable | This phase (PROJECT.md allows it) | Delete `usePointerDrag.ts`, `KanbanColumn.tsx`, `PulseCard.tsx`, `CyclePulseBoard.tsx`, `CycleGuest.tsx`, `StartCycleForm.tsx`, `useActiveCycle`, `useCycleForm`, `useCyclePulses`, `useMyWork` (none imported outside the cluster, verified by grep). |
| `window.prompt` for Return note and Proof Link URL | Dialog + Input | This phase | Return dialog (required note), Proof Link add row. |
| Select "Move Pulse" native `<select>` on cards | Drag + peek status picker | This phase | Accessible non-drag path is the peek panel status picker (D-20). |
| dnd-kit classic 6.x | `@dnd-kit/react` 0.5 (pre-1.0 rewrite) | 2025-2026 | Not adopted: locked spec and pre-1.0. Revisit later. |

**Deprecated/outdated:**
- `api.work.pulses.listMine` current shape (flat, `by_assignee` newest 50, no access re-check): replaced, and `useMyWork` (its only consumer besides orphan `CycleGuest`) is deleted.
- `src/features/work/cycles/lib/kanban.ts`: superseded by the shared `convex/lib/work/kanbanRules.ts`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `useSortable` in `@dnd-kit/sortable` 10.0.0 accepts `disabled: { draggable, droppable }` (object form) so Done/locked cards can be non-draggable yet remain drop targets | Patterns / Code | Cards in Done could not be dropped near; fall back to `disabled: true` on non-draggable and rely on the column droppable |
| A2 | `keyboardCodes` is passed as an option to `useSensor(KeyboardSensor, {...})` (docs page shows the defaults object and that it is customisable) | Pitfall 2 | Enter would lift instead of open; check type definitions on install |
| A3 | Scroll-snap-mandatory conflicts with dnd-kit autoScroll | Pitfall 3 | Low; the mitigation (`snap-none` while dragging) is harmless if wrong |
| A4 | The custom collision recipe (pointerWithin, then closestCenter within the hovered column) from dnd-kit's MultipleContainers story is the right fit; not fetched this session | Code Examples | Wrong drop index in some cases; prototype early |
| A5 | A Convex `runAt` in the past runs immediately, so a Cycle created with `startAt` in the past (or "+ New Cycle" carry-over) auto-starts at once | Close-with-new | New Cycle unexpectedly active and closes another active one; the planner should treat "start date = today/past" as immediate start in copy |
| A6 | My Pulses should hide unfinished Pulses whose Cycle is closed (they were deliberately left behind by "Leave in this Cycle") but still list recent Done ones | My Pulses read model | Users may want stale work visible; needs user confirmation (Open Question 1) |
| A7 | "Live" Trial Cycles = status `open` or `active` (excludes `closed`, `cancelled`); an `open` Trial's Board Pulses are read-only because `requireActiveTrial` rejects non-active | My Pulses / peek | Board rows of not-yet-started Trial Cycles appear/disappear unexpectedly |
| A8 | Done column (verified) is not reorderable; verify places a Pulse at the top of Done; reject appends to In progress; Founders may reorder Review | Ordering | D-22 says "anyone allowed to move may reorder"; drop position is ignored for the two Founder review transitions |
| A9 | Context label reads `${startupName} · ${cycle.title}` / `${startupName} · ${trial.title}` (names), not the literal words "Cycle"/"Trial Cycle" | My Pulses | Cosmetic |
| A10 | Founders may assign a Pulse to any Cycle-visible user and Members too (today any Cycle participant can edit any Pulse); no new assign-permission rule | update/create | Members could reassign others' Pulses; matches current behaviour |
| A11 | Allowing `verify`/`reject` inside a closed Cycle | Pitfall 9 | If disallowed, a Pulse submitted right before close is stuck in review |

## Open Questions

1. **Unfinished Pulses in a closed Cycle on My Pulses**
   - What we know: "Leave in this Cycle" (D-15) keeps them there; a closed Cycle is read-only.
   - What's unclear: whether they should keep appearing in the caller's In progress/Todo groups forever.
   - Recommendation: hide them (A6); keep recent Done. Confirm with the user.
2. **Founder review inside a closed Cycle**
   - Recommendation: keep `verify`/`reject` allowed; everything else refused ("This Cycle is closed").
3. **Carry-over and non-member assignees**
   - Recommendation: unassign non-members of the target (precedent: `removeMember`), do not silently add members or send notifications.
4. **`updatedAt`** (Pitfall 5): add the field and `patchPulse`, or accept `_creationTime` ordering?
   - Recommendation: add it; it is one helper, and the fallback is visibly wrong.
5. **Drop position for Founder Verify/Return**
   - Recommendation: server-placed (top of Done, end of In progress). Add an optional `beforePulseId` to `reject` only if design insists.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | everything | ✓ | v26.3.0 | — |
| pnpm | install, scripts | ✓ | 11.7.0 | — |
| npm registry | `pnpm add` | ✓ (queried this session) | — | — |
| Convex dev deployment | Running the app, regenerating `convex/_generated` | not probed | — | Backend tests need none (`convex-test` in memory); UI work needs `pnpm dev:backend` |
| Real touch device / emulator | Manual UAT of long-press drag and snap scroll (UI-SPEC backstops) | not probed | — | Chrome devtools touch emulation (less faithful) |

**Missing dependencies with no fallback:** none for planning. **Baseline:** `pnpm test` was green this session (19 files, 133 tests, ~19s). [VERIFIED: ran `pnpm test`]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 5.0.2 (`environment: "edge-runtime"`) + `convex-test` 0.0.60, in memory |
| Config file | `vitest.config.ts` (`include: ["convex/**/*.test.ts"]`) |
| Quick run command | `pnpm test convex/work/pulses.test.ts` (one file, ~12s) |
| Full suite command | `pnpm test` (~19s, 133 tests baseline) |
| Static checks | `pnpm check` (biome lint+format+`tsc --noEmit` on `src/`), `pnpm exec tsc -p convex/tsconfig.json --noEmit`, `pnpm build` (regenerates `src/routeTree.gen.ts`) |

The UI has no tests (CLAUDE.md, REQUIREMENTS "Out of Scope: Component-level UI tests"); Playwright flow 3 lands in Phase 6. Tests exercise only the public API (`api.*`) via `t.withIdentity`, so rank/rule logic is tested through `api.work.pulses.move` etc., not by importing internals.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WORK-01 | `listMine` returns caller's assigned Cycle Pulses across two Startups plus Board Pulses of live Trial Cycles, with startup/container labels, grouped by status | convex-test | `pnpm test convex/work/myPulses.test.ts` | ❌ Wave 0 |
| WORK-01 | `listMine` excludes Pulses of Startups the caller left, Cycles they were removed from, closed Trial Cycles, and caps Done | convex-test | same | ❌ Wave 0 |
| WORK-02 | `move` reorders within a column and across columns (rank order observable via `listForCycle`) | convex-test | `pnpm test convex/work/order.test.ts` | ❌ Wave 0 |
| WORK-02 | Rank rebalance after many inserts at the same spot keeps order; `beforePulseId` from another Cycle/column is ignored | convex-test | same | ❌ Wave 0 |
| WORK-02 | Refusals: Member to done; assignee moves Submitted; Founder Submitted→todo; from done; review reorder by non-Founder | convex-test | `pnpm test convex/work/review.test.ts` | ✅ extend |
| WORK-02 | Board Pulse move: owner only, no review, locked once trial not active | convex-test | `pnpm test convex/work/boards.test.ts` | ✅ extend |
| WORK-03 | Proof gate: `setStatus`/`move` to review refused with no Proof Link, allowed with one; Board exempt | convex-test | `pnpm test convex/work/review.test.ts` | ✅ extend |
| WORK-03 | Resubmit clears `reviewNote`; reject sets it; verify clears it | convex-test | same | ✅ extend |
| WORK-03 | `pulses.get`: null for malformed/missing/no-access id; capability flags for assignee, Founder, non-assignee Member, Board owner, Founder viewing a Board | convex-test | `pnpm test convex/work/pulses.test.ts` | ✅ extend |
| WORK-03 | `update` sets/clears priority, dueAt, assignee; assignee must have Cycle access | convex-test | same | ✅ extend |
| WORK-04 | `create` with priority/assignee/dueAt; refused in a closed Cycle | convex-test | same | ✅ extend |
| WORK-04 | `close` with `carryOverToNewCycle` is atomic (new Cycle created, unfinished moved, ranks appended, non-member assignees unassigned, old closed); bad args refused (both targets given) | convex-test | `pnpm test convex/work/cycles.test.ts` | ✅ extend |
| WORK-04 | `start` only from planned; `close` not twice; `cycles.get`/`list` summary counts and Member visibility; `listMine` picker returns only planned/active | convex-test | same | ✅ extend |
| WORK-04 | Founders never appear as duplicate Cycle Members | convex-test | same | ✅ extend |
| migration | `backfillPulseRanks` idempotent, ranks per (cycle,status) in creation order | convex-test | `pnpm test convex/migrations.test.ts` | ✅ extend |
| UI (all) | Board/List/peek/dialogs/`C` behaviour | manual + static | `pnpm check` and `pnpm build`, then the UAT checklist below | n/a |

### Sampling Rate
- **Per task commit:** the touched test file plus `pnpm exec tsc -p convex/tsconfig.json --noEmit` (backend tasks) or `pnpm check` (frontend tasks).
- **Per wave merge:** `pnpm test` and `pnpm check`; after any route addition `pnpm build`.
- **Phase gate:** full suite green, `pnpm check` clean, manual UAT of the UI-SPEC backstops before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `convex/test.helpers.ts`: `submitForReview` helper (adds a Proof Link, then `review`); optionally `setUpCycleWithPulses`; drop the unused `t` param of `cyclePulseFor` if touched.
- [ ] Update the 13 review call sites listed in Pitfall 4.
- [ ] New `convex/work/order.test.ts` and `convex/work/myPulses.test.ts` (both use `createTest`, `setUpStartup`, `joinAsMember`, `startedTrialWith`).
- [ ] No framework install needed.

### Manual UAT checklist (UI-SPEC backstops, cannot be automated in V1)
Long-press drag does not hijack vertical scroll or snap scroll on a real phone; refused drop shows dimmed target + reason + return animation; 360px width with keyboard open keeps focused peek field and sticky review footer visible; 360px My Pulses row wraps to two lines without overflow; Space lifts / Enter opens on a focused card; Esc closes the panel and dialogs.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (unchanged) | `@convex-dev/auth`; every function starts with `requireUserId` |
| V3 Session Management | no (unchanged) | Convex Auth |
| V4 Access Control | **yes** | `requireCycleAccess`, `requireFounderMembership`, `requireBoardOwner`/`requireBoardAccess`, new `get` returns null instead of leaking existence; assignee/neighbour ids re-validated server-side |
| V5 Input Validation | **yes** | Convex arg validators, `requireText`, `assertUrl` (http/https only, `convex/lib/text.ts`), `normalizeId` for URL-supplied ids, zod for client forms |
| V6 Cryptography | no | n/a |
| V13 API / Web Service | yes | bounded reads (`.take`), no unbounded `.collect()` |

### Known Threat Patterns for Convex + React SPA

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR via `?pulse=<id>` (read another Startup's or another Participant's Pulse) | Information disclosure | `pulses.get` runs the same access seams as the mutations and returns `null` for no access; never trust the URL |
| Rank/neighbour injection (`beforePulseId` from another Cycle to reorder or probe) | Tampering | Server verifies the neighbour shares container and destination status, otherwise ignores it |
| Assigning to a user outside the Cycle / Startup | Tampering / Elevation | Assignee must be a Founder or Cycle Member of the Pulse's Cycle |
| Client-only rule enforcement (dimmed column but backend allows) | Tampering | Shared rules module used by backend `move`/`setStatus`/`verify`; tests assert refusals through the API |
| Proof Link `javascript:` URL rendered as `<a href>` | XSS | `assertUrl` requires `https?://`; render with `rel="noreferrer"` and `target="_blank"` |
| Founder-only actions by Members (verify, reject, start/close/create Cycle, add/remove Cycle Member) | Elevation | `requireFounderMembership` (already in place; keep on every new Cycle mutation) |
| Board Pulses leaking through My Pulses | Information disclosure | `listMine` re-checks `isTrialParticipant` per Trial; Founders' Board reads go through `requireBoardAccess` |
| Unbounded reads (My Pulses, Cycle summary) | Denial of service | Per-status `.take(N)` constants in `lib/limits.ts` |

## Verified In-Repo Values

Values read from source this session (paths and lines), quoted verbatim, that plans and code samples rely on.

| Fact | Source | Verbatim |
|------|--------|----------|
| Pulse statuses | `convex/schema.ts:35-41` | `v.literal("todo")`, `v.literal("in_progress")`, `v.literal("review")`, `v.literal("done")` |
| Legacy statuses still accepted in storage | `convex/schema.ts:46-50` | `v.literal("backlog")`, `v.literal("active")`, `v.literal("blocked")` (read through `currentStatus`) |
| Proof Link kinds | `convex/schema.ts:51-59` | `pr`, `commit`, `deploy`, `design`, `doc`, `demo`, `other` |
| Priorities | `convex/schema.ts:61-65` | `v.literal("low")`, `v.literal("medium")`, `v.literal("high")` |
| Cycle statuses | `convex/schema.ts:66-70` | `v.literal("planned")`, `v.literal("active")`, `v.literal("closed")` |
| Trial statuses | `convex/schema.ts:76-81` | `v.literal("open")`, `v.literal("active")`, `v.literal("closed")`, `v.literal("cancelled")` |
| Pulses indexes today | `convex/schema.ts:230-235` | `by_startup`, `by_cycle`, `by_trial`, `by_trial_and_status`, `by_trial_and_participant`, `by_assignee` |
| Pulses fields (no rank, no updatedAt) | `convex/schema.ts:211-229` | `title, description, status, priority, assigneeUserId, createdByUserId, dueAt, proofLinks, evidenceUrl, participantUserId, reviewNote` (+ `startupId, cycleId, trialCycleId`) |
| Cycles indexes | `convex/schema.ts:257-258` | `by_startup`, `by_startup_and_status` |
| `update` args today | `convex/work/pulses.ts:138-143` | `pulseId`, `title: v.optional(v.string())`, `description: v.optional(v.string())` |
| `create` args today | `convex/work/pulses.ts:99-105` | `startupId`, `title`, `cycleId: v.optional`, `trialCycleId: v.optional` |
| Page sizes | `convex/work/pulses.ts:29-30` | `const PULSE_PAGE_SIZE = 80;` `const MY_PULSES_PAGE_SIZE = 50;` |
| Existing limits | `convex/lib/limits.ts:6,17,20` | `MAX_BOARD_PULSES = 100`, `MAX_PROOF_LINKS = 10`, `MAX_CYCLE_MEMBERS = 50` |
| Backend refusal strings | `convex/work/pulses.ts:174-177`; `convex/lib/work/pulses.ts:116-119` | "Only a Founder can verify a Pulse, once it is in review"; "This Pulse is awaiting review"; "This Pulse is already verified"; "Pulses on a Board have no review step" |
| UI refusal strings | `src/features/work/cycles/lib/kanban.ts` | "Verified Pulses are final"; "This Pulse is awaiting review"; "Send it back to in progress with a note"; "Only a Founder can verify a Pulse, once it is in review" |
| `close` carry-over guard message | `convex/work/cycles.ts:224` | "Choose a planned or active Cycle to carry work into" |
| Shortcut context | `src/shell/shortcuts/registry.ts:6-12` | `navigate`, `focusedSlug`, `togglePalette`, `openShortcutSheet`, `focusSearch` |
| Existing registry ids to keep | `src/shell/shortcuts/registry.ts` | `palette.open`, `search.focus`, `shortcuts.open`, `nav.inbox`, `nav.my-pulses`, `nav.threads`, `nav.discover`, `nav.create-startup`, `startup.cycles`, `startup.hiring`, `startup.team`, `startup.pitch`, `startup.activity`, `startup.settings` |
| Post-sign-in destination (WORK-01 landing already done) | `src/features/people/auth/hooks/useGoogleSignIn.ts:13`; `src/features/marketing/landing/pages/LandingPage.tsx:14` | ``redirectTo: `${window.location.origin}/my-pulses` ``; `return <Navigate to="/my-pulses" />;` |
| Stub routes to replace | `src/routes/_shell/_authed/my-pulses/index.tsx`; `.../s/$slug/_member/cycles/index.tsx`; `.../cycles/$cycleId.tsx` | route ids `/_shell/_authed/my-pulses/`, `/_shell/_authed/s/$slug/_member/cycles/`, `/_shell/_authed/s/$slug/_member/cycles/$cycleId` |
| Notification hrefs for Pulses | `convex/lib/links.ts:55-70`; asserted at `convex/notifications.test.ts:203-225` | `/s/${slug}/cycles/${pulse.cycleId}`; tests assert `` `/s/${slug}/cycles/${cycleId}` `` (adding `?pulse=` would need those tests updated; optional nicety, not required) |

## Project Constraints (from CLAUDE.md)

- pnpm only; run `pnpm check` (lint + format + tsc) before considering work done; `pnpm check-types` only covers `src/`, so typecheck `convex/` with `pnpm exec tsc -p convex/tsconfig.json --noEmit` or `convex dev`.
- Never hand-edit `src/routeTree.gen.ts` or `convex/_generated/**`.
- Follow `convex/_generated/ai/guidelines.md`: validators on every function, no `.filter`, bounded `.take()` instead of `.collect()`, no unbounded arrays in documents, `ctx.db.normalizeId`-style id handling, index names list all fields in order (`by_cycle_and_status_and_rank`).
- Every function starts with `requireUserId(ctx)`, then a seam (`requireMembership`/`requireFounderMembership`/`requireCycleAccess`/`requireTrialAccess`/`requirePulse`/`requireWorkablePulse`/`requireSubmittedPulse`).
- Notifications via `notify()`/`notifyFounders()`; activity via `logActivity()`; new notification kinds only via the `notificationKind` validator (none needed here).
- Indexes: always `withIndex`; add an index instead of `.filter`.
- Tests live next to code as `convex/**/*.test.ts`, use only `api.*` and `t.withIdentity`, and use `convex/test.helpers.ts`. The UI has no tests.
- Routes are thin (`createFileRoute`, params, render a page from `features/`); features are `features/<domain>/<feature>/{pages,components,hooks,schemas,constants.ts}`; `src/features/<domain>/<feature>/` mirrors `convex/<domain>/<file>.ts`.
- Files under ~250 lines, one responsibility; logic in hooks, markup in components; magic numbers in `constants.ts` (frontend) / `lib/limits.ts` (backend); comments only for *why*.
- Reuse shadcn primitives; **don't add libraries unless asked** (dnd-kit is the only approved addition); `pnpm ui <component>` for shadcn.
- Tailwind: semantic color tokens only, no arbitrary values, mobile-first. New `--warning`/`--warning-foreground` token per UI-SPEC goes into `src/styles/globals.css` (`:root` and `@theme inline`).
- Glossary terms in code and UI: Pulse, Cycle, Cycle Member, Proof Link, Board, Trial Cycle, Founder, Member. Avoid "task", "sprint", "ticket", "issue". (Domain glossary lives in `CONTEXT.md` at repo root; it is deleted in the working tree, read via `git show HEAD:CONTEXT.md`.)
- Decisions that surprise are recorded in `docs/adr/` and cited in comments as "ADR 000N". Consider a short ADR for "rank is a server-placed float on the Pulse" since D-22 is marked costly to reverse.
- Build only what V1 needs.

## Sources

### Primary (HIGH confidence)
- Source files read this session: `convex/work/pulses.ts`, `convex/work/cycles.ts`, `convex/lib/work/{pulses,cycles,boards}.ts`, `convex/schema.ts`, `convex/lib/{links,limits,text}.ts`, `convex/migrations.ts`, `convex/test.helpers.ts`, `convex/work/{pulses,review}.test.ts`, `src/shell/**` (registry, useShortcuts, CommandProvider, CommandPalette, usePaletteData, AppShell, StartupRoute, MemberGate, useFocusedStartup), `src/features/work/**`, `src/components/ui/sheet.tsx`, `src/lib/dates.ts`, the three stub route files, `package.json`, `tsconfig.json`, `vitest.config.ts`.
- `gsd_run query package-legitimacy check` for the three dnd-kit packages: all OK.
- npm registry (`npm view`): versions, peer dependencies, publish dates.
- Context7 `/websites/convex_dev`: optimistic updates (`withOptimisticUpdate`, rollback, no in-place mutation), value ordering (undefined smallest), index ordering.
- Context7 `/tanstack/router`: `validateSearch` with a zod schema, `navigate({ search: (prev) => ... })`.
- Installed `@tanstack/router-core@1.171.32` type declarations (`route.d.ts`): Standard Schema `validateSearch`.

### Secondary (MEDIUM confidence)
- dndkit.com legacy docs via WebFetch: `/api-documentation/sensors/{touch,pointer,keyboard}`, `/presets/sortable` (touch-action, Mouse+Touch recommendation, default keyboard codes, multiple-container guidance, DragOverlay guidance).

### Tertiary (LOW confidence)
- Scroll-snap versus autoScroll interaction, `disabled` object form, exact `keyboardCodes` option shape, collision-detection recipe (Assumptions A1-A4): from training knowledge, flagged `[ASSUMED]`.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Packages named by the user, registry- and seam-verified.
- Architecture: HIGH for backend (source read), MEDIUM for the drag layer (docs plus assumptions A1-A4).
- Pitfalls: HIGH for 4-13 (verified in source), MEDIUM for 1-3 and 14-16.

**Research date:** 2026-09-29
**Valid until:** ~2026-10-29 (stable stack; dnd-kit classic is unchanged since Dec 2024, `@dnd-kit/react` is fast-moving but not adopted)
