# Phase 2: My Pulses & Cycle Boards - Context

**Gathered:** 2026-09-29
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers four things, covering WORK-01 to WORK-04:
- **My Pulses** is the post-sign-in home. It shows the caller's Cycle Pulses and live Trial Board Pulses across every Startup.
- A **Cycle** screen with a drag-and-drop Board and a List view (dnd-kit), on desktop and mobile.
- A **URL-addressable Pulse peek panel**, with Proof Links and Founder verify/return.
- The **Cycle lifecycle screens**: the Cycles list, create, start, close with carry-over, and Cycle Members. It also includes the `C` quick-create dialog.

It replaces the Phase 1 stubs at `/my-pulses`, `/s/$slug/cycles` and `/s/$slug/cycles/$cycleId`.

This phase does **not** include:
- the Trial Board / Trial Cycle screens themselves (Phase 4)
- Submissions or Verdicts (Phase 4)
- the Inbox (Phase 3)
- the Activity screen (Phase 3)

The peek panel must still handle Board Pulses opened from My Pulses (D-19).

</domain>

<decisions>
## Implementation Decisions

### My Pulses (WORK-01)
- **D-01:** My Pulses shows all four status groups: In progress, Review (Submitted), Todo, then Done. **Done is collapsed by default and limited to recent items.**
- **D-02:** Inside each status group the list is **flat, across Startups**. Every row carries a small context label: `Startup · Cycle` or `Startup · Trial Cycle`. There is no sub-grouping by Startup.
- **D-03:** Clicking a row **opens the peek panel in place** on My Pulses, using the same `?pulse=<id>` search param. The panel has an "Open in Cycle / Board" link that navigates to the Pulse's home screen.
- **D-04:** My Pulses has **no drag and no manual order**. Groups are auto-sorted: by the Pulse's Cycle rank, then by most recently updated. The exact tie-breaks are Claude's discretion.
- **D-05:** The empty state (no Pulses at all) offers "Find a Trial Cycle" (→ `/discover`) and "Create a Startup", per WORK-01.

### Quick create (`C`)
- **D-06:** `C` opens a quick-create dialog.
  - **Title is required** and autofocused.
  - A compact optional row holds **priority, assignee (default: me) and due date**.
  - **Enter** creates the Pulse. **⌘/Ctrl+Enter** creates it and keeps the dialog open for the next one.
  - Description is added later in the peek panel.
- **D-07:** Inside a Cycle, `C` targets that Cycle. On **My Pulses**, `C` opens the same dialog with a **Cycle picker**, defaulting to the Focused Startup's active Cycle and listing only Cycles the caller can see. Register `C` / "Create Pulse" and "Create Cycle" in the Phase 1 shortcut registry (`src/shell/shortcuts/registry.ts`, per Phase 1 D-19).

### Pulse card & peek panel (WORK-03)
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

### Cycles screens & lifecycle (WORK-04)
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

### Board vs List & drag (WORK-02)
- **D-18:** The **Cycle opens on Board everywhere, desktop and mobile**. The Board/List toggle in the Cycle header is **not remembered**; it resets on each visit (plain component state, no localStorage and no `?view=` param).
- **D-19:** On mobile, the **Board uses snap-scrolling columns**, each about 85% of the viewport width with horizontal scroll-snap. The touch sensor uses a **long-press activation** so drag doesn't fight scrolling, and dragging near the edge auto-scrolls to the neighbouring column.
- **D-20:** **List view** has collapsible status groups using the shared row component. **Rows can be dragged between groups, and reordered within a group**, like the Board. Status can also be changed from the peek panel.
- **D-21:** A disallowed drag is **pre-empted and backed by a backend fallback**.
  - While dragging, columns/groups the user can't drop into are dimmed with a not-allowed cursor, and dropping there animates back.
  - The UI rules mirror the backend: only Founders move to done; the assignee can't move a Submitted Pulse; review needs ≥1 Proof Link (D-12).
  - If the backend still rejects a move, the optimistic change is rolled back and a toast shows the backend's message.
  - The backend remains the source of truth; the rules are never enforced only in the UI.

### Manual ordering
- **D-22:** Pulses are **manually reordered by drag within a column/group**. **The order is shared**: there is one rank per Pulse, visible to everyone on the Cycle.
  - Anyone allowed to move a Pulse may reorder it.
  - Pulses in review can only be reordered by Founders, matching the move rules.
  - This needs a new rank field on `pulses` (e.g. a fractional/lexo rank string), plus a reorder/move mutation that sets status and rank together.
  - **Reversibility:** costly. It adds a schema field, an index, and backfill/defaulting for existing Pulses, and every list query sorts on it. There are no production users (PROJECT.md), so a lossy backfill is fine.
- **D-23:** The rank **lives on the Pulse, so Trial Board kanbans reuse it in Phase 4**. My Pulses stays auto-sorted (D-04).

### Trial Board Pulses in the peek panel
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Spec
- GitHub issue **#19** (`gh issue view 19`), in particular:
  - "Solution → My Pulses / Cycles"
  - User Stories 15, 20–24 and 33–42
  - "Implementation Decisions → Pulse peek panel", "Drag and drop" and "Shortcuts"
  - "Backend: My Pulses"
  - "Testing Decisions" (My Pulses across Startups and Boards; Playwright flow 3, "Cycle work", later in Phase 6)
- `.planning/REQUIREMENTS.md`: WORK-01 to WORK-04.
- `.planning/ROADMAP.md`: the Phase 2 goal and success criteria.

### Architecture decisions
- `docs/adr/0006-frontend-is-a-shell-plus-domain-features.md`: `src/features/work/<feature>/pages/`, `/s/$slug/...` URLs, dark-only.
- `docs/adr/0003-each-participant-gets-a-private-board.md`: Board Pulses are private per Participant, with no review step.
- `docs/adr/0002-score-counts-only-founder-confirmed-evidence.md`: Verified Pulses are Proof of Work only, not Score.
- `docs/adr/0004-code-is-grouped-by-domain-not-listed-flat.md`: the backend stays in `convex/work/`, `convex/lib/work/`.

### Prior phase
- `.planning/phases/01-shell-navigation-foundation/01-CONTEXT.md`, which covers:
  - visual tokens (D-01 to D-09)
  - the shortcut registry (D-19: Phase 2 registers `C` / Create Pulse / Create Cycle)
  - palette Cycle scope (D-18)

### Project rules
- `CLAUDE.md`: conventions (files under 250 lines, thin pages, semantic tokens, mobile-first, `withIndex` only).
- `CONTEXT.md` (repo-root glossary): Pulse, Submitted Pulse, Verified Pulse, Proof Link, Cycle, Cycle Member, Board. **Note: it is currently deleted in the working tree (unstaged). Restore it with `git checkout -- CONTEXT.md` or read it via `git show HEAD:CONTEXT.md`.**
- `convex/_generated/ai/guidelines.md`: the Convex function guidelines.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/work/cycles/`
  - Components: `CyclePulseBoard.tsx`, `KanbanColumn.tsx`, `PulseCard.tsx`, `StartCycleForm.tsx`, `CycleGuest.tsx`.
  - Hooks: `useActiveCycle`, `useCycleForm`, `useCyclePulses`, `useMyWork`.
  - `lib/kanban.ts` holds the column/move rules and is worth reusing for D-21's pre-empt logic.
  - Kept from the old UI per Phase 1 D-11. They can be restyled or rewritten; `usePointerDrag.ts` is **replaced by dnd-kit** and should be deleted.
- `src/features/work/pulses/components/PulseProofLinks.tsx` (Proof Link add/remove) and `PulseBoard.tsx` (the old Trial Board) are candidates for the peek panel.
- `src/components/ui/` has `sheet`, `dialog`, `command`, `dropdown-menu`, `tabs`, `tooltip`, `avatar`, `badge` and `sonner`. Popover, select and toggle-group are not there yet; add them via `pnpm ui` if they're used.
- `src/components/shared/StubScreen.tsx` / `EmptyState.tsx` cover the empty states.
- `src/shell/shortcuts/registry.ts` + `useShortcuts.ts`, `src/shell/command/CommandPalette.tsx` + `usePaletteData.ts` are where the `C` / Create Cycle entries are registered.

### Established Patterns
- Backend Pulse API (`convex/work/pulses.ts`): `listForCycle`, `listMine` (assigned Cycle Pulses only, via `by_assignee`), `listBoard`, `create`, `update`, `setStatus`, `verify`, `reject(note)`, `assignToMe`, `addProofLink`, `removeProofLink`, `remove`.
- Backend Cycle API (`convex/work/cycles.ts`): `list`, `create` (with `memberUserIds`, scheduled `autoStart`), `start` (closes any other active Cycle), `close(carryOverToCycleId?)`, `addMember`, `removeMember`, `listMembers`, `listMine`.
- The rules already live in `convex/lib/work/pulses.ts`:
  - `setStatus` refuses `done` (Founder `verify` only) and refuses `review` on Board Pulses.
  - `requireWorkablePulse` refuses edits to review/done Pulses.
- `pulses` fields: `title`, `description`, `status`, `priority` (low/medium/high), `assigneeUserId`, `dueAt`, `proofLinks[]` (kinds pr/commit/deploy/design/doc/demo…), `reviewNote`, `cycleId` | `trialCycleId` + `participantUserId`. There is **no rank/order field yet** (D-22 adds one).

### Integration Points
- **`listMine` must be extended (WORK-01)** to cover:
  - Cycle Pulses assigned to the caller, in Startups they still belong to and Cycles they can still access
  - Board Pulses in Trial Cycles that aren't closed

  It returns rows grouped by status, each with its Startup and Cycle/Trial Cycle label, plus the slug and ids needed for the "Open in Cycle / Board" link.
- Routes to fill:
  - `src/routes/_shell/_authed/my-pulses/index.tsx`
  - `src/routes/_shell/_authed/s/$slug/_member/cycles/index.tsx`
  - `src/routes/_shell/_authed/s/$slug/_member/cycles/$cycleId.tsx`

  The peek panel is a `validateSearch` `pulse` param on the Cycle and My Pulses routes.
- New backend work:
  - the Proof gate on review (D-12)
  - a rank field plus a combined move/reorder mutation (D-22)
  - optionally, close-with-new-Cycle (D-15)

  Tests go in `convex/work/pulses.test.ts` / `cycles.test.ts` / `review.test.ts`, using `convex/test.helpers.ts`. Note the open deferred lint in `cyclePulseFor` (`convex/test.helpers.ts:175`, an unused `t` param), to be fixed if that helper is touched.
- New library: **dnd-kit** (allowed by PROJECT.md for this phase).

</code_context>

<specifics>
## Specific Ideas

- Linear is the reference for the card density, inline property editing in the peek panel, "My issues"-style grouping, and ⌘Enter create-and-continue.
- A refused drag should feel pre-empted (dimmed targets), not like a surprise error. The toast is only a fallback.

</specifics>

<deferred>
## Deferred Ideas

- **Review history** (a timeline of every verify/return with notes) was considered and not chosen. Only the latest `reviewNote` is kept (D-10).
- **Comments/activity feed inside the peek panel** was not discussed and is a new capability. If it's wanted, it belongs in a later phase.
- **Remembering the Board/List choice** was considered and not chosen (D-18).

</deferred>

---

*Phase: 02-my-pulses-cycle-boards*
*Context gathered: 2026-09-29*
