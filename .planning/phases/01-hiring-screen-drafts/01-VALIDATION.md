---
phase: "1"
slug: "hiring-screen-drafts"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-04"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 5.0.2 + convex-test 0.0.60 (`edge-runtime`) |
| **Config file** | `vitest.config.ts` (includes `convex/**/*.test.ts`, setup `convex/lib/timers.helpers.ts`) |
| **Quick run command** | `pnpm vitest run convex/hiring/<file>.test.ts` |
| **Full suite command** | `pnpm test && pnpm check` |
| **Estimated runtime** | ~15 seconds (baseline 168 tests ≈ 12s) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run <touched test file>`
- **After every plan wave:** Run `pnpm test && pnpm check`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD (filled by planner) | — | — | HIRE-01 | — | Members list Roles/hackathons; only founders mutate | unit | `pnpm vitest run convex/hiring/trialCycles.drafts.test.ts` | ❌ W0 | ⬜ pending |
| TBD | — | — | HIRE-01 | — | Drafts stay out of public queries | unit | `pnpm vitest run convex/hiring/trialCycles.test.ts -t "hidden draft"` | ✅ | ⬜ pending |
| TBD | — | — | HIRE-02 | — | Role close blocked while it has unpublished/open/running hackathons | unit | `pnpm vitest run convex/hiring/roles.test.ts` | ❌ W0 | ⬜ pending |
| TBD | — | — | HIRE-03 | — | Draft create/update saves Starting Pulses + More details; update is draft-only and founder-only | unit | `pnpm vitest run convex/hiring/trialCycles.drafts.test.ts` | ❌ W0 | ⬜ pending |
| TBD | — | — | HIRE-03 | — | Application-only admission (D-11) | unit | `pnpm vitest run convex/hiring/trialCycles.test.ts` | ✅ convert | ⬜ pending |
| TBD | — | — | HIRE-09 | — | Reschedule draft only; cancel draft/open/running | unit | `pnpm vitest run convex/hiring/trialCycles.test.ts -t "cancelling"` | ✅ / ❌ add open | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `convex/hiring/trialCycles.drafts.test.ts` — create/update/schedule/permissions tests
- [ ] `convex/hiring/trialCycles.helpers.ts` — `enterTrial(setup, trialCycleId, person)`, `challenges` override, `admission` removed
- [ ] `convex/hiring/roles.test.ts` — D-23 close-guard tests
- [ ] Convert every `joinTrial` call site in the same wave as the D-11 backend removal

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tabs, status grouping, row actions, empty state | HIRE-01 | No frontend tests in this repo | Open `/s/$slug/hiring` as founder at 375px and desktop width |
| Read-only member view | HIRE-01 | No frontend tests | Open the screen as a non-founder member; no actions shown |
| Create/edit form, Role picker, Starting Pulses | HIRE-03 | No frontend tests | Create a draft at `/hiring/new`, edit at `/hiring/$id/edit` |
| Reschedule/cancel flows | HIRE-09 | No frontend tests | Reschedule a draft, cancel a draft and an open hackathon |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
