---
phase: "02"
slug: "my-pulses-cycle-boards"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-29"
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 5.0.2 (edge-runtime) + convex-test 0.0.60, in memory |
| **Config file** | `vitest.config.ts` (`include: ["convex/**/*.test.ts"]`) |
| **Quick run command** | `pnpm test convex/work/pulses.test.ts` (touched file) |
| **Full suite command** | `pnpm test` |
| **Static checks** | `pnpm check`, `pnpm exec tsc -p convex/tsconfig.json --noEmit`, `pnpm build` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run the touched test file plus `pnpm exec tsc -p convex/tsconfig.json --noEmit` (backend) or `pnpm check` (frontend)
- **After every plan wave:** Run `pnpm test` and `pnpm check`; `pnpm build` after any route addition
- **Before `/gsd-verify-work`:** Full suite must be green, `pnpm check` clean, manual UAT done
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| WORK-01 | `listMine` returns assigned Cycle Pulses across Startups plus live Trial Board Pulses, labelled and grouped | convex-test | `pnpm test convex/work/myPulses.test.ts` | ❌ W0 | ⬜ pending |
| WORK-01 | `listMine` excludes left Startups, removed Cycles, closed Trial Cycles; caps Done | convex-test | same | ❌ W0 | ⬜ pending |
| WORK-02 | `move` reorders within and across columns; rebalance keeps order; foreign `beforePulseId` ignored | convex-test | `pnpm test convex/work/order.test.ts` | ❌ W0 | ⬜ pending |
| WORK-02 | Move refusals (Member→done, Submitted by assignee, from done, review reorder by non-Founder) | convex-test | `pnpm test convex/work/review.test.ts` | ✅ extend | ⬜ pending |
| WORK-02 | Board Pulse move: owner only, no review, locked after trial | convex-test | `pnpm test convex/work/boards.test.ts` | ✅ extend | ⬜ pending |
| WORK-03 | Proof gate on review; resubmit clears `reviewNote` | convex-test | `pnpm test convex/work/review.test.ts` | ✅ extend | ⬜ pending |
| WORK-03 | `pulses.get` null on bad/no-access id; capability flags per role; `update` fields | convex-test | `pnpm test convex/work/pulses.test.ts` | ✅ extend | ⬜ pending |
| WORK-04 | `create` with priority/assignee/dueAt; refused in closed Cycle | convex-test | `pnpm test convex/work/pulses.test.ts` | ✅ extend | ⬜ pending |
| WORK-04 | `close` with carry-over atomic; `start`/`close` status guards; summaries; picker | convex-test | `pnpm test convex/work/cycles.test.ts` | ✅ extend | ⬜ pending |
| migration | `backfillPulseRanks` idempotent | convex-test | `pnpm test convex/migrations.test.ts` | ✅ extend | ⬜ pending |
| UI (all) | Board/List/peek/dialogs/`C` shortcut | static + manual | `pnpm check` && `pnpm build` | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `convex/test.helpers.ts` — `submitForReview` helper (adds Proof Link, then submits)
- [ ] Update the 13 existing review call sites broken by the Proof gate
- [ ] `convex/work/order.test.ts` — new, for WORK-02 ordering
- [ ] `convex/work/myPulses.test.ts` — new, for WORK-01

No framework install needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Long-press drag doesn't hijack scroll on a phone | WORK-02 | No UI tests in V1 | Drag a card on a real phone; vertical and column snap scroll still work |
| Refused drop feedback | WORK-02 | No UI tests in V1 | Drop Member card into Done: dimmed target, reason shown, card returns |
| Keyboard: Space lifts, Enter opens peek, Esc closes | WORK-02/03 | No UI tests in V1 | Focus a card and use the keys |
| 360px layout with keyboard open | WORK-01/03 | No UI tests in V1 | Peek field and sticky review footer stay visible; My Pulses rows wrap without overflow |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
