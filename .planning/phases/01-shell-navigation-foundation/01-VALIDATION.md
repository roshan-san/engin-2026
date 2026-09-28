---
phase: "1"
slug: "shell-navigation-foundation"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-28"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (edge-runtime) + `convex-test` |
| **Config file** | `vitest.config.ts` (`include: ["convex/**/*.test.ts"]`) |
| **Quick run command** | `pnpm test convex/teams/startups.test.ts` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~{N} seconds |

The UI has no tests (CLAUDE.md). Frontend work is checked with `pnpm check` plus manual click-through.

---

## Sampling Rate

- **After every task commit:** Run `pnpm test convex/teams/startups.test.ts` (plus any other backend test file touched) and `pnpm check`
- **After every plan wave:** Run `pnpm test` and `pnpm check`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** {N} seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| {N}-01-01 | 01 | 1 | REQ-{XX} | T-{N}-01 / — | {expected secure behavior or "N/A"} | unit | `{command}` | ✅ / ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `convex/teams/startups.test.ts` — add cases for the slug query, the memberships list and focusing a Startup (file exists, cases don't)
- [ ] `convex/teams/invitations.test.ts` — update for the `focusedStartupId` rename

*No framework install needed: vitest, convex-test and @edge-runtime/vm are already dependencies.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar, bottom tab bar, Startup sheet, palette, `?` sheet, theming, route tree | SHELL-01..06 | UI has no tests (CLAUDE.md) | `pnpm dev` + `pnpm dev:backend`, click through as Founder, Member and signed-out visitor |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < {N}s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
