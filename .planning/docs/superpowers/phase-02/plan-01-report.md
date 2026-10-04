# Plan 02-01 report

## Implemented
- Task 1: `convex/lib/work/kanbanRules.ts` (0 imports), `setStatus` gated through `kanbanMove`, `requireWorkablePulse` returns `isFounder`, `reviewNote` cleared on entering review, `submitForReview` helper, 13 call sites switched, review.test.ts rewritten (+gate, Founder-own-Pulse, resubmit-clears-note tests).
- Task 2: `assertCycleOpen`; guarded in `requireWorkablePulse`, `create`, `remove`; two tests in pulses.test.ts (all seven writes refused; Founder verify + reject still work).
- Task 3: greps of every basename across src/ matched only the 11 listed files; deleted them; kept constants.ts, PulseBoard.tsx, PulseProofLinks.tsx.

## TDD evidence
- Task 1 RED: `pnpm test convex/work/review.test.ts` -> 3 failed | 6 passed: "promise resolved null instead of rejecting" (no gate, x2) and "expected 'Mobile layout breaks' to be null" (note not cleared). Expected: behaviour not implemented. GREEN: 9 passed (9); full suite 135 passed; tsc convex clean.
- Task 2 RED: `pnpm test convex/work/pulses.test.ts` -> 1 failed | 6 passed: create in closed Cycle "resolved ... instead of rejecting". GREEN: 7 passed; full suite 137 passed (19 files).

## Verification
- `pnpm test`: 19 files, 137 tests passed. `pnpm exec tsc -p convex/tsconfig.json --noEmit`: clean. `pnpm check`: clean after deletion (one pre-existing biome warning for unused `t` param in `cyclePulseFor`, deliberately untouched per plan).

## Commits
- 44df5a2 feat(02-01): gate review on a Proof Link via shared kanban rules
- 0217b1e feat(02-01): make a closed Cycle read-only except Founder review
- ea4f3a8 refactor(02-01): delete orphaned pre-redesign Cycle UI
- (docs commit for SUMMARY follows)

## Files changed
convex/lib/work/kanbanRules.ts (new), convex/lib/work/pulses.ts, convex/lib/work/cycles.ts, convex/work/pulses.ts, convex/test.helpers.ts, tests: work/review, work/cycles, work/pulses, notifications, teams/activity, teams/invitations; 11 deleted under src/features/work/cycles/; .planning/.../02-01-SUMMARY.md.

## Self-review
- Every acceptance criterion checked; no overbuilding. Same-status setStatus is now a silent no-op (rule says reorder), a minor behaviour change.
- `pnpm check` (biome --write) rewrites CRLF to LF across the working tree and made 6 unrelated lint edits in convex/hiring/*; I reverted those and staged explicit paths only. Git shows the rest as EOL-only noise (autocrlf).
- A stale `index.lock` (from a `git add --dry-run`, no git process alive) was removed once.

## Concerns
- The working tree still shows ~200 files as modified (EOL only, no content diff); the controller may want `git add --renormalize` awareness or a `git status` refresh.
