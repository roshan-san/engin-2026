---
phase: "1"
slug: "shell-navigation-foundation"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: true
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
| **Estimated runtime** | ~18 seconds full suite (measured 17.8s for 103 tests on 2026-09-28); ~12 seconds for one file |
| **Static checks** | `pnpm check-types` ~14s, `pnpm check` ~20s, `pnpm build` ~8s (it also regenerates `src/routeTree.gen.ts`), `pnpm exec tsc -p convex/tsconfig.json --noEmit` for `convex/` |

The UI has no tests (CLAUDE.md). Frontend work is checked with `pnpm check` plus manual click-through.

Baseline note (2026-09-28): `pnpm check` (lint + format + tsc) is clean. `pnpm exec biome check src convex` reports two fixable `organizeImports` assists (convex/hiring/challenges.ts, convex/lib/hiring/trialCycles.ts) and one warning in convex/test.helpers.ts. No plan gates on `biome check` over those files; 01-03 runs `biome check` only on `src/components/ui src/hooks src/styles src/main.tsx`, which is clean.

---

## Sampling Rate

- **After every task commit:** Run `pnpm test convex/teams/startups.test.ts` (plus any other backend test file touched) and `pnpm check`
- **After every plan wave:** Run `pnpm test` and `pnpm check`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~50 seconds. The heaviest task verify is 01-08-03: `pnpm build` + `pnpm check` + `pnpm test`. Every other task finishes in under 35 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | SHELL-07, SHELL-02 | T-01-02, T-01-03, T-01-04 | A non-Member gets role null; a Stealth Startup returns null, the same as a missing slug; focus throws for non-Members; unauthenticated calls throw | unit (convex-test) | `pnpm test convex/teams/startups.test.ts` + `pnpm exec tsc -p convex/tsconfig.json --noEmit` | ✅ file exists, cases W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | SHELL-07 | T-01-01 | Plan/limits/usage returned only to Members | unit (convex-test) | `pnpm test convex/teams/startups.test.ts` + `pnpm exec tsc -p convex/tsconfig.json --noEmit` | ✅ file exists, cases W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | SHELL-07 | T-01-05 | Removal clears a Focused Startup the User no longer belongs to | unit (convex-test) | `pnpm test` + `pnpm check` | ❌ W0 (`convex/teams/members.test.ts` created in task) | ⬜ pending |
| 01-02-01 | 02 | 1 | SHELL-02 | T-01-06 | Hrefs built only from server-generated slug and ids | unit (convex-test) | `pnpm test convex/notifications.test.ts` + `pnpm exec tsc -p convex/tsconfig.json --noEmit` | ❌ W0 (`convex/notifications.test.ts` created in task) | ⬜ pending |
| 01-02-02 | 02 | 1 | SHELL-02 | T-01-06 | as above | unit (convex-test) | `pnpm test convex/notifications.test.ts convex/hiring/trialMessages.test.ts convex/hiring/verdicts.test.ts convex/hiring/trialCycles.test.ts` | ✅ (after 01-02-01) | ⬜ pending |
| 01-02-03 | 02 | 1 | SHELL-02 | — | N/A | unit + grep gate | `pnpm test` + `pnpm check` | ✅ | ⬜ pending |
| 01-03-01 | 03 | 1 | SHELL-04 | — | N/A | build + built-CSS grep | `pnpm build` + `grep -il "Geist Variable" dist/assets/*.css` + `grep -il "1d9bf0" dist/assets/*.css` | ✅ | ⬜ pending |
| 01-03-02 | 03 | 1 | SHELL-04 | T-01-SC, T-01-09, T-01-10 | Only approved dependencies added; no key handler outside the registry | static | `pnpm check-types` + `pnpm exec biome check src/components/ui src/hooks src/styles src/main.tsx` + `pnpm build` | ✅ | ⬜ pending |
| 01-04-01 | 04 | 2 | SHELL-03 | T-01-12 | Signed-out visitors on sign-in-only URLs go to `/` | static + manual | `pnpm build` + `pnpm check-types` | ✅ | ⬜ pending |
| 01-04-02 | 04 | 2 | SHELL-02 | T-01-11 | Non-Member sent to the public Pitch (UX only; server re-checks) | static + manual | `pnpm build` + `pnpm check-types` | ✅ | ⬜ pending |
| 01-04-03 | 04 | 2 | SHELL-02, SHELL-03, SHELL-06 | T-01-14 | Fixed post-sign-in path, no user-supplied redirect | static + grep + manual | `pnpm build` + `pnpm check` | ✅ | ⬜ pending |
| 01-05-01 | 05 | 3 | SHELL-03 | T-01-16 | Sign in uses the fixed Convex Auth redirect | static + manual | `pnpm build` + `pnpm check-types` | ✅ | ⬜ pending |
| 01-05-02 | 05 | 3 | SHELL-06 | — | N/A | static + grep + manual | `pnpm build` + `pnpm check-types` | ✅ | ⬜ pending |
| 01-05-03 | 05 | 3 | SHELL-03 | T-01-15 | Public queries unchanged | static + manual | `pnpm build` + `pnpm check` | ✅ | ⬜ pending |
| 01-06-01 | 06 | 3 | SHELL-01, SHELL-02 | T-01-17 | Switcher lists only the caller's memberships (server-scoped) | static + manual | `pnpm check-types` + `pnpm check` | ✅ | ⬜ pending |
| 01-06-02 | 06 | 3 | SHELL-01, SHELL-04 | T-01-19 | No user-level Pro indicators (prohibition, negative grep) | static + grep + manual | `pnpm check` + `grep -rnE "isPro\|Upgrade\|pro-score-shine\|planTier" src/shell` (must print nothing) | ✅ | ⬜ pending |
| 01-07-01 | 07 | 4 | SHELL-01 | T-01-21 | Sheet links only navigate; the gate is server-backed | static + manual | `pnpm check` | ✅ | ⬜ pending |
| 01-07-02 | 07 | 4 | SHELL-01 | T-01-20 | Only the caller's own data | static + manual | `pnpm check` | ✅ | ⬜ pending |
| 01-07-03 | 07 | 4 | SHELL-01 | — | N/A | static + manual | `pnpm check` | ✅ | ⬜ pending |
| 01-08-01 | 08 | 4 | SHELL-02 | T-01-23 | Fixed checkout return URL | static + manual | `pnpm build` + `pnpm check-types` | ✅ | ⬜ pending |
| 01-08-02 | 08 | 4 | SHELL-06 | — | N/A | static + grep | `pnpm check-types` | ✅ | ⬜ pending |
| 01-08-03 | 08 | 4 | SHELL-06, SHELL-02 | T-01-22 | Old focus endpoints gone; `focus` is the only write path | static + unit + structural grep | `pnpm build` + `pnpm check` + `pnpm test` + `find src/features -type d -name ui` (must print nothing) | ✅ | ⬜ pending |
| 01-09-01 | 09 | 5 | SHELL-05 | T-01-26 | Single-key shortcuts ignored in editable fields | static + manual | `pnpm check` | ✅ | ⬜ pending |
| 01-09-02 | 09 | 5 | SHELL-05 | T-01-25 | Palette Cycles only from the Focused Startup, server-scoped | static + grep + manual | `pnpm check` + `grep -rniE "coming soon\|disabled" src/shell/shortcuts src/shell/command` (must print nothing) | ✅ | ⬜ pending |
| 01-09-03 | 09 | 5 | SHELL-05 | T-01-27 | Names rendered as escaped React text | static + manual | `pnpm check` + `pnpm build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `convex/teams/startups.test.ts`: add cases for getBySlug (Founder, Member, Participant, Stealth, unknown slug, case, adjacency), listMemberships (order, empty), focus (idempotent, non-Member rejected) and the Plan block (Free usage, pending Offer, founder Invite, Pro, Stealth, zero usage, non-Member plan null). Written test-first in 01-01-01 and 01-01-02; the file exists, the cases don't.
- [ ] `convex/teams/members.test.ts`: new file, clear-on-removal cases (01-01-03)
- [ ] `convex/teams/invitations.test.ts` and `convex/hiring/offers.test.ts`: helpers move from the hidden-state query to `listMemberships` (01-01-03)
- [ ] `convex/notifications.test.ts`: new file, href scheme cases (01-02-01 to 01-02-03)

These Wave-0 test cases are written test-first inside the wave-1 TDD tasks of 01-01 and 01-02, so `wave_0_complete` stays false until those tasks execute. Frontend plans (01-03 to 01-09) have no Wave-0 test files by design: the UI has no tests (CLAUDE.md), and their automated gates are typecheck, lint, format, build and structural greps.

*No framework install needed: vitest, convex-test and @edge-runtime/vm are already dependencies.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar, bottom tab bar, Startup sheet, palette, `?` sheet, theming, route tree | SHELL-01..06 | UI has no tests (CLAUDE.md) | `pnpm dev` + `pnpm dev:backend`, click through as Founder, Member and signed-out visitor |
| Signed-out visitor on `/my-pulses` goes to `/`; signed in, `/` goes to `/my-pulses`; a non-Member on `/s/<slug>/team` lands on `/startup/<slug>`; a Participant opens `/s/<slug>/trials/<id>` | SHELL-02, SHELL-03 | UI has no tests | Steps in 01-04 `<verification>` |
| Pitch, profile, Discover and Invite show exactly one header in both sign-in states; the public header stays on one row at 360px (E11 backstop) | SHELL-03 | UI has no tests; visual layout | Steps in 01-05 `<verification>` |
| Sidebar order, switching Startup, reopening on the last Focused Startup, the sidebar scrolling on its own, and a 10+ Startup switcher scrolling (E1 backstop) | SHELL-01, SHELL-02 | UI has no tests; visual layout | Steps in 01-06 `<verification>` |
| Tabs, Startup sheet, account sheet, Inbox/Threads toggle, the 768px handover, and the Inbox badge hidden while loading (E3 backstop) | SHELL-01 | UI has no tests; viewport-dependent | Steps in 01-07 `<verification>` |
| Creating a Startup lands on its Cycles; accepting an Invite lands on My Pulses; `/app` shows not-found | SHELL-02, SHELL-06 | UI has no tests | Steps in 01-08 `<verification>` |
| ⌘K toggles, `?`/`/` behaviour, typing `?` in the palette does nothing, the mobile palette is full-screen, and no "No results found." flash (E7 backstop) | SHELL-05 | UI has no tests; keyboard interaction | Steps in 01-09 `<verification>` |
| Pure black, Geist, blue only on D-09 surfaces (judgment-tier prohibition) | SHELL-04 | Visual judgment | Steps in 01-03 `<verification>` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies: all 25 tasks carry at least one `<automated>` command with a `<fails_when>`
- [x] Sampling continuity: no 3 consecutive tasks without automated verify, since every task has one
- [x] Wave 0 covers all MISSING references (members.test.ts and notifications.test.ts are created inside their own TDD tasks)
- [x] No watch-mode flags (`vitest run` via `pnpm test`; no `--watch`, no `pnpm dev` in any gate)
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter. Justification for the frontend: behavioural checks of the UI are manual-only because the UI has no tests (CLAUDE.md), and they are listed above; every frontend task still has an automated static gate.

**Approval:** pending
