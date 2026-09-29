# Phase 2: My Pulses & Cycle Boards - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-29
**Phase:** 02-my-pulses-cycle-boards
**Areas discussed:** My Pulses layout, Pulse card & peek panel, Cycles screens & lifecycle, Board vs List & mobile, then the follow-up areas (ordering, return note, Board Pulses in peek, empty states)

---

## My Pulses layout

| Question | Options | Selected |
|---|---|---|
| Status groups | All four with done collapsed / Active only / All four expanded | All four, done collapsed |
| Cross-Startup grouping | Flat list + context label / Sub-grouped by Startup | Flat + label |
| Click a Pulse | Peek panel in place / Navigate to Cycle with peek | Peek in place |
| `C` on My Pulses | Dialog with Cycle picker / Disabled | Dialog with Cycle picker |

## Pulse card & peek panel

| Question | Options | Selected |
|---|---|---|
| Card contents | Linear-compact / Minimal / Rich | Linear-compact |
| Peek editing | Inline, save on blur / Read view + Edit button | Inline |
| Quick-create fields | Title + optional row / Title only / Full form | Title + optional row |
| Proof Link before review | Optional / Require ≥1 (backend) | **Require ≥1 (backend-enforced)**: the user chose this over the recommendation |

## Cycles screens & lifecycle

| Question | Options | Selected |
|---|---|---|
| Cycles screen | Sectioned list / Redirect to active Cycle | Sectioned list |
| Start/Close location | Cycle header actions / List only | Header actions |
| Carry-over | Pick target or create inline / Existing Cycles only | Pick or create inline |
| Cycle Members | Avatar stack → popover / Settings sheet | Avatar stack → popover |

## Board vs List & mobile

| Question | Options | Selected |
|---|---|---|
| Default view | Board desktop/List mobile, remembered / Board everywhere, not remembered | **Board everywhere, not remembered**: the user chose this over the recommendation |
| Mobile Board | Snap-scrolling columns / No Board on mobile | Snap-scrolling columns |
| Refused drag | Pre-empt + backend fallback / Snap back + toast only | Pre-empt + fallback |
| List view | Grouped rows, status via picker / Drag between groups | **Drag between groups**: the user chose this over the recommendation |

## Follow-up areas

| Question | Options | Selected |
|---|---|---|
| Order within a column | Auto-sorted / Manual drag-to-reorder | **Manual drag-to-reorder**: the user chose this over the recommendation |
| Who reorders | Shared, anyone who can move it / Founders only | Shared, anyone who can move it |
| Reorder scope | Cycles + Trial Boards, My Pulses auto / Cycles only | Cycles + Trial Boards |
| Return note display | Callout until resubmitted / Review history | Callout |
| Board Pulse in peek | Same panel with Board rules / Read-only in Phase 2 | Same panel with Board rules |
| Member with no Cycles | Explainer empty state / You decide | Explainer empty state |

## Claude's Discretion

- The rank encoding
- The number of recent Done items
- dnd-kit sensor tuning
- The Cycle create form container
- Generic kanban columns
- The peek panel width
- The Returned callout styling

## Deferred Ideas

- Review history timeline (not chosen)
- Peek panel comments/activity feed (new capability)
- Remembering the Board/List view (not chosen)
