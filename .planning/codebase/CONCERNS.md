---
last_mapped_commit: 63da4c34dd0df46fd780733eaefce3afb95f98e3
last_mapped_at: 2026-09-28
---
# Codebase Concerns

**Analysis Date:** 2026-09-28

Convex mutations are serializable transactions: every read and write in one mutation commits atomically, and conflicting concurrent mutations are retried (OCC). Read-check-write inside a single mutation is safe, and a mutation that throws rolls back all of its writes. Keep this in mind before flagging "race conditions" or "partial failure" in `convex/`. See "Verified non-issues" at the end.

## Known Bugs

### Cycle `start` has no status guard

**Issue:** `start` in `convex/work/cycles.ts` (lines 170-199) never checks `cycle.status`. `autoStart` (line 92) does, returning early unless the Cycle is `planned`.
**Impact:** A Founder calling the mutation directly can re-open a `closed` Cycle, or "start" an already `active` one (it closes itself, reactivates, and logs a duplicate `cycle_started` activity). The UI only shows Start for `planned` Cycles (`src/features/work/cycles/ui/CyclePage.tsx` line 86), so this is reachable only outside the UI.
**Fix approach:** Throw unless `cycle.status === "planned"`, matching `autoStart`. Add a test in `convex/work/cycles.test.ts`.

### Starting a Cycle closes the active one without a close record

**Issue:** Both `autoStart` (lines 96-104) and `start` (lines 181-190) patch every `active` Cycle of the Startup to `closed` directly, bypassing `close` (lines 202-237).
**Impact:** The implicitly closed Cycle gets no `cycle_closed` activity entry, its unfinished Pulses get no carry-over choice, and Cycle Members are not notified. Whether one active Cycle per Startup is the intended rule is not recorded in `CONTEXT.md` or `docs/adr/`.
**Fix approach:** Confirm the rule. If it's intended, route through shared close logic so activity is logged, and either block the start or ask where unfinished Pulses go.

## Tech Debt

### Score evidence reads are capped

**Issue:** `loadScoreEvidence` in `convex/lib/reputation/score.ts` (lines 27-55) reads at most `MAX_USER_APPLICATIONS` (80) applications, `MAX_USER_OFFERS` (50) accepted Offers and 50 memberships per user (`convex/lib/limits.ts`). `convex/lib/reputation/trialHistory.ts` uses the same cap.
**Impact:** Once a user passes those counts, Score and trial history silently undercount. The caps are unreachable for V1 usage, so this matters only at scale.
**Fix approach:** When it matters, keep running counters on `users` (updated where application or Offer status changes) instead of rescanning.

### Contributors Explore query scans and filters in memory

**Issue:** The `contributors` query in `convex/teams/explore.ts` (lines 82-128) takes 200 users, filters skills/location in memory, and runs `hasEvidence` (lines 47-80) per candidate with up to 3 indexed lookups each.
**Impact:** Up to ~600 index reads per page load, and users beyond the first 200 scanned are never shown.
**Fix approach:** Acceptable for V1. At scale, keep an `exploreEligible` flag or a denormalized contributors table maintained on the events that create evidence.

### Activity visibility check per row

**Issue:** For Members, `convex/teams/activity.ts` (lines 56-67) calls `getCycleMember` for every scanned activity row that has a `cycleId`.
**Impact:** Up to one extra index read per row (≤100 rows) per dashboard load.
**Fix approach:** Load the Member's Cycle memberships once and filter against a `Set` of cycle ids.

## Security Considerations

### Dodo webhook: email fallback and no audit trail

**Current protection:** `createDodoWebhookHandler` (`@dodopayments/convex`) verifies the Standard Webhooks signature with `DODO_PAYMENTS_WEBHOOK_SECRET` and returns 400 on failure. Checkout in `convex/people/billing.ts` (lines 55-67) puts `userId` in the subscription metadata, and `convex/http.ts` (line 24) prefers it.
**Residual risk:** When metadata has no `userId` (a subscription created outside the in-app checkout), `convex/http.ts` (lines 26-31) falls back to matching `customer.email`, which may map to a different account or to none (then the event is silently dropped). Plan changes are not logged anywhere.
**Recommendations:** Log the webhook event id and resolved user on every `setPlanTier`. Decide whether the email fallback should stay.

### Board access is coupled to application status

**Files:** `convex/lib/work/boards.ts` (lines 11-29)
**Note:** The check is correct today. `isTrialParticipant` reads `applications.status`, so any new application state (soft delete, removal) must update this boundary too.

## Performance Bottlenecks

See "Contributors Explore query" and "Activity visibility check per row" under Tech Debt. Neither matters at V1 scale.

## Fragile Areas

### Cycle transitions

**Files:** `convex/work/cycles.ts` (`create` schedules `autoStart`, then `start`, `close`, `moveUnfinishedPulses`)
**Why fragile:** There are two activation paths with duplicated "close all active" code, and they apply different guards (see Known Bugs).
**Test coverage:** `convex/work/cycles.test.ts` covers auto-start at the start date, closing with and without carry-over, and Member removal. It has no test for `start` on a non-planned Cycle or for the implicit close of the previously active Cycle.

### Offers filling a Role

**Files:** `convex/lib/hiring/verdicts.ts`, `convex/lib/hiring/offers.ts`, `convex/hiring/offers.ts`
**Note:** `fillRoleIfFull` has one caller, `convex/hiring/offers.ts` line 146, which is the only Offer-acceptance path. Any new acceptance path (for example an admin or auto-accept) must call it, or the Role stays open past headcount.

## Scaling Limits

| Resource | Cap | Where |
|---|---|---|
| Applications read per user | 80 (`MAX_USER_APPLICATIONS`) | `convex/lib/limits.ts` |
| Accepted Offers read per user | 50 (`MAX_USER_OFFERS`) | `convex/lib/limits.ts` |
| Participants per Trial Cycle | 10 (`Math.min(10, maxContributors)`) | `convex/hiring/trialCycles.ts` line 133 |
| Explore contributors scan | 200 users | `convex/teams/explore.ts` |

## Dependencies at Risk

- `@dodopayments/convex` is pinned at `0.2.15` and `@convex-dev/auth` at `0.0.95` in `package.json`. Both are pre-1.0, so expect breaking changes on upgrade and read their changelogs.

## Test Coverage Gaps

- **UI:** `src/` has no tests (by choice, per `CLAUDE.md`). The flows that matter most are manual-only: joining a Trial Cycle, submitting a Pulse, accepting an Offer.
- **Cycles:** `start` status guard and the implicit close on start (see above).
- **Billing webhook:** there is no test for `convex/http.ts` plan-tier mapping, including the email fallback.

## Verified non-issues

These were raised during mapping and don't hold. Don't re-flag them.

- **Participant spot oversubscription:** `takeParticipantSpot` in `convex/lib/hiring/entries.ts` (lines 55-66) reads and patches the Trial Cycle inside the caller's mutation. Concurrent joins conflict and retry, so capacity can't be exceeded.
- **Counter drift on partial failure:** if a mutation throws after `takeParticipantSpot`, the counter increment rolls back with it.
- **Late scheduler run:** Trial Cycle `start` and Cycle `autoStart` return early unless the record is still in the expected status, and a cancelled Trial Cycle staying cancelled is covered by `convex/hiring/trialCycles.test.ts`.
- **Carry-over target deleted mid-close:** validation and the Pulse moves in `close` run in one transaction.
- **Unsigned Dodo webhooks:** signatures are verified by the library (see Security).

---

*Concerns audit: 2026-09-28*
