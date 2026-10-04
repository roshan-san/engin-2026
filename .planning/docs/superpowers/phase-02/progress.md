# SDD ledger — plan: .planning/phases/02-my-pulses-cycle-boards/02-{01..12}-PLAN.md (phase 2)
Worktree: .claude/worktrees/phase-02, branch phase-02, branched from main c65060b (+ commit adding 02-PATTERNS.md)
Baseline: 133/133 tests pass, check-types clean.
Spec: 02-CONTEXT.md (decisions D-01..D-24) + 02-UI-SPEC.md + 02-RESEARCH.md. Plans argue from these.
Unit of work: one SDD "task" = one PLAN file (2-3 plan tasks each, one commit per plan task). Brief = the PLAN file itself.

## Pre-flight scan
| Pair / plan | Shared file / interface | Finding |
|---|---|---|
| 01→02 | kanbanRules.ts, requireWorkablePulse{isFounder}, submitForReview | 02 consumes exactly what 01 creates. OK |
| 02→03 | pulseOrder.placePulse(key override), endRank, loadColumn | consistent signatures. OK |
| 02→04 | patchPulse, endRank, by_assignee_and_status_and_updatedAt, limits consts | OK |
| 02→05 | limits CYCLE_SUMMARY_SCAN | OK |
| 03↔05 | moveUnfinishedPulses (03 rewrites; 05 calls with newCycle target) | 05 inherits Cycle Members so 03's unassign rule keeps them. OK |
| 04/05 | convex/work/pulses.ts vs cycles.ts | no shared file. OK |
| 06→07 | KanbanBoard/KanbanColumn types, useCyclePulses | 07 extracts useKanbanDrag. OK |
| 06→08 | AssigneeAvatar, globals.css (--warning) | 08 shadcn cleanup must NOT remove --warning tokens. Carried in dispatch |
| 07→09 | pulseDropVerdict, ReturnDialog | OK |
| 08→10 | CycleRow menu slot, AvatarStack, cycleFormSchema, popover | OK |
| 09→11,12 | PulsePeek(showHomeLink), pickers | OK |
| 10/11/12 | CycleHeader edited by 10, 11, 12 | sequential execution, OK |
| 11 | KanbanList props = KanbanBoardProps | KanbanBoard must export its props type; implementer adds export. OK |
| all | @CLAUDE.md referenced; repo has no CLAUDE.md | project guide is untracked D:/codex/engin-2026/AGENTS.md |
| 08/09/10 | @.claude/skills/shadcn/SKILL.md referenced; file absent | use the Skill tool "shadcn" instead |
| all | execution_context @~/.claude/gsd-core/workflows/execute-plan.md | GSD workflow; implementers ignore it, only write the <output> SUMMARY |
| 01 T3 vs 07 grep | "awaiting review" etc. in src | only in kanban.ts, which 01 deletes. OK |
Self-consistency per plan: tests specified match code specified in all 12; files created vs touched consistent.

Ruling: One implementer dispatch per PLAN file (not per plan task) — plans are coherent 2-3-task units with tight internal coupling — cost if wrong: larger review diffs.
Ruling: Implementers ignore GSD execution_context and do not edit .planning/STATE.md or ROADMAP.md; they do write the plan's <output> SUMMARY.md because later plans @-reference it — cost if wrong: GSD state needs a manual update after the phase.
Ruling: @CLAUDE.md resolves to D:/codex/engin-2026/AGENTS.md (untracked in main checkout); @.claude/skills/shadcn/SKILL.md resolves to the shadcn skill — cost if wrong: none material.
Ruling: Execution order 01..12 sequential (wave order) — cost if wrong: none.

## Progress
02-01: dispatched implementer (BASE bc238f0)
02-01: implementer DONE_WITH_CONCERNS (setStatus same-status now no-op; CRLF noise from biome — cleared by controller). commits bc238f0..0cc21d2. review pkg .superpowers/sdd/02-01-PLAN/review-bc238f0..0cc21d2.diff
Task 02-01: minor (deferred): remove() runs assertCycleOpen before requireMembership — non-member gets "This Cycle is closed" (plan-mandated order)
Task 02-01: minor (deferred): no direct kanbanMove unit tests (verify/return/reorder/canDrop covered only indirectly)
Task 02-01: complete (commits bc238f0..0cc21d2, review clean)
02-02: dispatched implementer (BASE 0cc21d2)
02-02: implementer DONE_WITH_CONCERNS (T1+T2 one commit; no RED for review/board tests; not-active test uses cancel; did 02-03 T2 insert ranks early). commits 0cc21d2..236e143; review dispatched
Task 02-02: minor (deferred): moveUnfinishedPulses still writes with ctx.db.patch (02-03 rewrites it)
Task 02-02: minor (deferred): placePulse treats a column truncated at the cap (200/100) as whole — append/rebalance can collide past the cap
Task 02-02: minor (deferred): legacy-status Pulses hidden from lists until 02-03 backfill; listForCycle reads up to 4x200 rows with per-row assignee lookups
Task 02-02: fix round 1/5 dispatched (Important: rebalance tests vacuous)
Task 02-02: fix round 1/5 (1 addressed, 0 open; commits 236e143..08bbde7)
Task 02-02: minor (deferred): order.test.ts updatedAt test still can't catch a rebalance that stamps updatedAt (no timer advance before the crowding loop) — one-line fix vi.advanceTimersByTime before loop; must_have truth "renumbering does not change updatedAt" is thus only weakly tested
Task 02-02: complete (commits 0cc21d2..08bbde7, review clean after 1 round)
02-03: dispatched implementer (BASE 08bbde7)
