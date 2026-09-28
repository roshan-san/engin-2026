---
phase: 01-shell-navigation-foundation
plan: 02
subsystem: notifications
tags: [convex, notifications, routing, hiring, work, adr-0006]

# Dependency graph
requires: []
provides:
  - "convex/lib/links.ts: the single place notification hrefs are built (INBOX_HREF, MY_PULSES_HREF, StartupSection, startupHref, trialCycleHref, cycleHref, pulseHref)"
  - "All 13 backend notification call sites across 8 files routed through the new href scheme"
  - "convex/notifications.test.ts: coverage of the href scheme through api.notifications.list"
affects: [01-04 (frontend route tree must match these hrefs exactly), 03-hiring (Inbox/Offer answering at /inbox), team screens, cycle screens]

# Actuals (#2632)
actuals:
  tokens: 5931
  tasks: 3
  commits: 6
  plan_head_before: e19b08d726f34128ffc7f5079a820d61f4fe9dd2
  plan_head_after: 2129bcabdf8f7ea17b99df9ff614b4d2d81e4306

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "All notification hrefs are built exclusively through async builders in convex/lib/links.ts, keyed off a ctx.db-loaded Startup slug"
    - "Every href builder falls back to MY_PULSES_HREF when the Startup no longer exists, so a notification never carries a broken /s/null/... link"

key-files:
  created:
    - convex/lib/links.ts
    - convex/notifications.test.ts
  modified:
    - convex/hiring/applications.ts
    - convex/lib/hiring/trialCycles.ts
    - convex/lib/hiring/verdicts.ts
    - convex/lib/hiring/threads.ts
    - convex/hiring/trialMessages.ts
    - convex/lib/hiring/offers.ts
    - convex/hiring/offers.ts
    - convex/lib/work/cycles.ts
    - convex/lib/work/pulses.ts
    - convex/work/pulses.ts
    - convex/_generated/api.d.ts

key-decisions:
  - "pulseHref moved wholesale from convex/lib/work/pulses.ts into convex/lib/links.ts, so every href builder lives in one module"
  - "threadHref deleted from convex/lib/hiring/threads.ts; trialMessages.ts calls trialCycleHref directly since a Trial Thread and its Trial Cycle screen share one URL"
  - "Offers answered from the Inbox (TEAM-02, Phase 3): withdrawOffer's notification uses INBOX_HREF instead of a Startup-scoped link"

patterns-established:
  - "Notification hrefs are plain strings computed once per mutation and reused across a loop of notify() calls (see startTrial, closeWithVerdicts, announce), not recomputed per recipient"

requirements-completed: [SHELL-02]

coverage:
  - id: D1
    description: "Trial Cycle notifications (join, apply, reject, cancel, start, Verdict, Thread message, Announcement) all open /s/{slug}/trials/{id}"
    requirement: SHELL-02
    verification:
      - kind: unit
        ref: "convex/notifications.test.ts#a Participant joining an open Trial Cycle notifies the Founder with a slug-carrying link"
        status: pass
      - kind: unit
        ref: "convex/notifications.test.ts#applying to an application-admission Trial Cycle notifies the Founder with a slug-carrying link"
        status: pass
      - kind: unit
        ref: "convex/notifications.test.ts#rejecting an application notifies the Applicant with a slug-carrying link"
        status: pass
      - kind: unit
        ref: "convex/notifications.test.ts#a Trial Cycle starting notifies its Participant with a slug-carrying link"
        status: pass
      - kind: unit
        ref: "convex/notifications.test.ts#a passed Verdict notifies the Participant with a slug-carrying link"
        status: pass
      - kind: unit
        ref: "convex/notifications.test.ts#a Thread message and its Announcement counterpart carry a slug-carrying link"
        status: pass
    human_judgment: false
  - id: D2
    description: "Cycle member-added and Cycle Pulse review/verify notifications open /s/{slug}/cycles/{id}"
    requirement: SHELL-02
    verification:
      - kind: unit
        ref: "convex/notifications.test.ts#being added to a Cycle notifies the Member with a slug-carrying link"
        status: pass
      - kind: unit
        ref: "convex/notifications.test.ts#a Cycle Pulse moving to review, then verified, carries the Cycle's slug-carrying link"
        status: pass
    human_judgment: false
  - id: D3
    description: "Offer withdrawn notifies via /inbox; Offer answered notifies Founders at /s/{slug}/team"
    requirement: SHELL-02
    verification:
      - kind: unit
        ref: "convex/notifications.test.ts#withdrawing an Offer notifies the Participant to check their Inbox"
        status: pass
      - kind: unit
        ref: "convex/notifications.test.ts#accepting an Offer notifies the Founder with a slug-carrying Team link"
        status: pass
    human_judgment: false
  - id: D4
    description: "No notification href written by the backend starts with the old /app prefix, across a full hiring loop"
    requirement: SHELL-02
    verification:
      - kind: unit
        ref: "convex/notifications.test.ts#across a full hiring loop, no notification links to the old /app prefix"
        status: pass
      - kind: other
        ref: "grep -rnE '\"/app|`/app' convex --include=*.ts --exclude-dir=_generated --exclude=notifications.test.ts"
        status: pass
    human_judgment: false

# Metrics
duration: 20min
completed: 2026-09-28
status: complete
---

# Phase 1 Plan 2: Backend Notification Links on the /s/{slug} Scheme Summary

**Every backend notification href now runs through `convex/lib/links.ts`, carrying the Startup's slug instead of the old `/app` prefix.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-09-28T21:25:00+05:30
- **Completed:** 2026-09-28T21:45:41+05:30
- **Tasks:** 3 (each RED-GREEN, TDD)
- **Files modified:** 11 (2 created, 9 modified, plus the auto-regenerated `convex/_generated/api.d.ts`)

## Accomplishments

- Created `convex/lib/links.ts`, the single place notification URLs are built: `INBOX_HREF`, `MY_PULSES_HREF`, `StartupSection`, and the async builders `startupHref`, `trialCycleHref`, `cycleHref`, `pulseHref`. Every builder falls back to `MY_PULSES_HREF` if the Startup no longer exists.
- Migrated all 13 call sites across `convex/hiring/applications.ts`, `convex/lib/hiring/trialCycles.ts`, `convex/lib/hiring/verdicts.ts`, `convex/lib/hiring/threads.ts` + `convex/hiring/trialMessages.ts`, `convex/lib/hiring/offers.ts` + `convex/hiring/offers.ts`, `convex/lib/work/cycles.ts`, and `convex/lib/work/pulses.ts` + `convex/work/pulses.ts` onto the new scheme.
- Deleted `threadHref` (folded into `trialCycleHref`) and moved `pulseHref` wholesale out of `convex/lib/work/pulses.ts` into `convex/lib/links.ts`.
- Added `convex/notifications.test.ts` (11 tests) asserting the href scheme end-to-end through `api.notifications.list`, including one test walking a full hiring loop (join, start, Verdict `passed_with_offer`, accept) and asserting no notification any test user holds links to the old `/app` prefix.

## Task Commits

Each task followed RED (test) then GREEN (feat), TDD discipline:

1. **Task 1: Trial Cycle join/apply/reject notifications** (tracer)
   - `1910358` - test(01-02): add failing test for slug-carrying Trial Cycle notification links
   - `005fe51` - feat(01-02): route Trial Cycle notification links through convex/lib/links.ts
2. **Task 2: Trial Cycle lifecycle, Verdict and Thread notifications**
   - `b1b2705` - test(01-02): add failing tests for Trial Cycle lifecycle, Verdict and Thread links
   - `cf2c6eb` - feat(01-02): route Trial Cycle lifecycle, Verdict and Thread links through links.ts
3. **Task 3: Offer, Cycle and Pulse notifications; no /app links**
   - `c27e91a` - test(01-02): add failing tests for Offer, Cycle and Pulse links, and no /app links
   - `2129bca` - feat(01-02): route Offer, Cycle and Pulse notification links through links.ts

No REFACTOR commits were needed — each GREEN implementation was already minimal and matched project conventions.

**Plan metadata:** committed separately (this SUMMARY + STATE.md + ROADMAP.md + REQUIREMENTS.md).

## Files Created/Modified

- `convex/lib/links.ts` - new: the single href-builder module (ADR 0006)
- `convex/notifications.test.ts` - new: 11 tests covering the full href scheme
- `convex/hiring/applications.ts` - 5 hrefs (apply/join/reject/accept/leave) now use `trialCycleHref`
- `convex/lib/hiring/trialCycles.ts` - `cancelTrial` and `startTrial` use `trialCycleHref`
- `convex/lib/hiring/verdicts.ts` - Verdict notification uses `trialCycleHref`
- `convex/lib/hiring/threads.ts` - `threadHref` removed
- `convex/hiring/trialMessages.ts` - `send`/`announce` use `trialCycleHref` from `../lib/links`
- `convex/lib/hiring/offers.ts` - `withdrawOffer` uses `INBOX_HREF`
- `convex/hiring/offers.ts` - `tellFounder` uses `startupHref(ctx, offer.startupId, "team")`
- `convex/lib/work/cycles.ts` - `addCycleMember` uses `cycleHref`
- `convex/lib/work/pulses.ts` - local `pulseHref` removed; `resolveReview` awaits the one in `../links`
- `convex/work/pulses.ts` - review-request notification awaits `pulseHref` from `../lib/links`
- `convex/_generated/api.d.ts` - auto-regenerated (picks up `lib/links` and, incidentally, 01-01's `lib/teams/plan`)

## Decisions Made

- `pulseHref` moved wholesale into `convex/lib/links.ts` rather than kept in `convex/lib/work/pulses.ts` and re-exported, so every href builder lives in exactly one module (the plan's stated goal).
- `threadHref` was deleted rather than kept as a thin wrapper, since a Trial Thread and its Trial Cycle screen resolve to the identical URL — `trialCycleHref` already covers it.
- Offers are answered from the Inbox (TEAM-02, Phase 3 work), so `withdrawOffer`'s notification links to `/inbox` rather than a Startup-scoped page.

## Deviations from Plan

None - plan executed exactly as written, including the intentional `"/app"` string left in `convex/notifications.test.ts`'s own `!notification.href?.startsWith("/app")` assertion (per the plan's own `<!-- planner-discipline-allow: /app -->` marker on Task 3). That is the only remaining `"/app`-shaped string in `convex/`, confirmed by `grep -rnE '"/app|`/app' convex --include=*.ts --exclude-dir=_generated --exclude=notifications.test.ts` returning no matches.

## Issues Encountered

- First draft of two Task 3 tests (`cyclePulseFor`) passed a plain signed-up user as the Cycle member instead of one added via `joinAsMember`, so `addCycleMember` correctly rejected them ("That user is not on the team"). Fixed in the same RED cycle before committing — not a product bug, a test-authoring miss caught immediately by the RED run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `convex/lib/links.ts`'s href strings (`/s/{slug}/...`, `/inbox`, `/my-pulses`) are the exact contract plan 01-04's frontend route tree must match.
- `pnpm test` (133/133) and `pnpm check` are green on the whole repo, not just this plan's files.
- No blockers for the next plan in this wave.

---
*Phase: 01-shell-navigation-foundation*
*Completed: 2026-09-28*

## Self-Check: PASSED

- FOUND: convex/lib/links.ts
- FOUND: convex/notifications.test.ts
- FOUND: .planning/phases/01-shell-navigation-foundation/01-02-SUMMARY.md
- FOUND commits: 1910358, 005fe51, b1b2705, cf2c6eb, c27e91a, 2129bca
