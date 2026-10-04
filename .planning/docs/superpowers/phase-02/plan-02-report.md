# Plan 02-02 report

Status: DONE_WITH_CONCERNS

## Implemented
- Task 1: schema fields/indexes, limits, rank.ts, pulseOrder.ts, pulseMoves.ts (movePulse), `move` mutation, create appends with rank, rank-ordered listForCycle, order.test.ts.
- Task 2: setPulseStatus, resolveReview via placePulse (verify top of done, reject end of in_progress), assignToMe via placePulse, patchPulse everywhere else, toPulse rank/updatedAt, order + review tests.
- Task 3: rank-ordered listBoard (loadColumn per BOARD_COLUMNS), Board tests, ADR 0007.
- Extra: board Pulse creation and Challenge seeding also assign a rank/updatedAt.

## TDD evidence
- RED: `pnpm test convex/work/order.test.ts` -> 9 failed / 9. "new Pulses are appended" failed with `expected ['C','B','A'] to deeply equal ['A','B','C']` (old desc by_cycle read); the rest with `Expected a Convex function exported from module "work/pulses" as move, but there is no such export.` Expected: nothing implemented yet.
- GREEN: same command after implementation, all 9 pass; full suite passes.
- review.test.ts and boards.test.ts cases were written after the implementation (order.test.ts had covered the RED for the shared code), so those did not have a separate RED run. First boards run had 1 failure (my test assumed advancePast ends the trial; there is no end timer), fixed to use cancel.

## Results
- `pnpm test`: 20 files, 152 tests passed.
- `pnpm exec tsc -p convex/tsconfig.json --noEmit`: clean. `pnpm check`: exit clean, 1 pre-existing warning (unused `t` in cyclePulseFor).

## Commits
- 16e13d3 feat(02-02): server-placed Pulse rank, move mutation and one placement path (Tasks 1 and 2)
- d8cd4a1 feat(02-02): Board Pulses share the rank; ADR 0007 (Task 3)
- docs(02-02): summary (next commit)

## Files
convex/schema.ts, convex/lib/limits.ts, convex/lib/work/{rank,pulseOrder,pulseMoves,pulses,boards}.ts, convex/lib/hiring/challenges.ts, convex/work/pulses.ts, convex/work/{order,review,boards}.test.ts, docs/adr/0007-pulse-order-is-a-server-placed-rank.md, 02-02-SUMMARY.md.

## Self-review / concerns
- Tasks 1 and 2 share a commit (deviation from one commit per task).
- convex/work/pulses.ts is ~290 lines (was 297); handler bodies for move/setStatus already live in lib. Remaining size is other handlers.
- `moveUnfinishedPulses` carries old ranks into the next Cycle; ties possible (deterministic by creation time). Out of scope.
- Legacy-status and unranked rows: unranked sort first and get renumbered on the next placement in that column; backfill migration is plan 02-03.
- `pnpm check` reformatted many files (CRLF noise); only intended files were committed; a few biome-touched unrelated files were reverted.

## Fix round 1
- order.test.ts crowding test now asserts every adjacent rank gap >= RANK_MIN_GAP (fails without a renumber). The updatedAt test now records B's rank/updatedAt before the crowding inserts and asserts after that B's rank changed (renumbered) while its updatedAt did not, and the target's updatedAt is unchanged. Added a Board foreign-beforePulseId append test in boards.test.ts.
- RED with the rebalance patch commented out in rebalanceColumn (`pnpm test convex/work/order.test.ts`): 2 failed | 7 passed.
  - crowding test: `AssertionError: expected [ 'P1', 'P2', ... ] to deeply equal [...]` (order breaks without renumber).
  - updatedAt test: `AssertionError: expected 2048 not to be 2048` (B never renumbered, so the rebalance did not happen).
- Restored production code (git checkout). GREEN: order.test.ts 9 passed; full `pnpm test` 20 files, 153 passed; biome check on convex/work clean.
