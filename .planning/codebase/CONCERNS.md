---
last_mapped_commit: f0a648da4386d24b5ee96348a96bf0cf757ba15f
last_mapped_at: 2026-09-29
---
<!-- refreshed: 2026-09-29 -->

# Codebase Concerns

**Analysis Date:** 2026-09-29

## Tech Debt

**Plan Limit Enforcement Missing:**
- Issue: ADR 0005 states "the pricing page lists only limits the backend actually enforces", but the backend does not enforce plan limits when creating Roles or Trial Cycles
- Files: `convex/hiring/roles.ts` (line 43, `create` mutation), `convex/hiring/trialCycles.ts` (line 101, `create` mutation)
- Impact: Free accounts can create unlimited Roles and Trial Cycles despite plan limits defined in `convex/lib/limits.ts` (1 open Role, 1 live Trial Cycle for free tier). This violates billing model enforcement and allows free users to access pro-only features
- Fix approach: Add plan limit checks in both create mutations before inserting. Use `loadStartupPlan` from `convex/lib/teams/plan.ts` to get current usage and verify against `limits` before proceeding. Write tests for limit enforcement in both `convex/hiring/roles.test.ts` and `convex/hiring/trialCycles.test.ts`

**Large Monolithic Backend Files:**
- Issue: Several backend files exceed the ~250 line convention (CLAUDE.md)
- Files: 
  - `convex/teams/startups.ts` (399 lines)
  - `convex/schema.ts` (371 lines)
  - `convex/work/pulses.ts` (283 lines)
  - `convex/work/cycles.ts` (271 lines)
  - `convex/people/users.ts` (267 lines)
  - `convex/hiring/applications.ts` (255 lines)
- Impact: Harder to understand, maintain, and test individual responsibilities. Violates stated convention of keeping files under ~250 lines with one responsibility each
- Fix approach: Split large files into focused modules. For example, `convex/teams/startups.ts` could separate query, mutation, and helper logic into distinct files. Use helper modules in `convex/lib/teams/` for shared logic

**Large Frontend Components:**
- Issue: Several UI components exceed ~250 line convention
- Files:
  - `src/components/ui/sidebar.tsx` (701 lines) - Note: shadcn/ui generated component, may be acceptable
  - `src/components/ui/dropdown-menu.tsx` (255 lines)
  - `src/features/work/pulses/components/PulseBoard.tsx` (169 lines)
  - `src/features/teams/startup/public/pages/PublicStartupPage.tsx` (175 lines)
  - `src/features/discover/pages/DiscoverPage.tsx` (168 lines)
  - `src/features/people/profile/pages/PublicProfilePage.tsx` (166 lines)
- Impact: Harder to reason about, difficult to test, prone to introducing bugs
- Fix approach: Extract custom components into smaller, focused pieces. The sidebar may be acceptable as generated code, but feature pages should extract logic into hooks and reusable components

**MAX_PLAN_USAGE_SCAN Undercounting Risk:**
- Issue: `loadStartupPlan` uses `.take(MAX_PLAN_USAGE_SCAN)` (200) when counting resources across members, roles, invites, and offers
- Files: `convex/lib/teams/plan.ts` (lines 58, 66, 72, 83, 91, 102)
- Impact: If a pro startup exceeds 200 open roles, pending invites, pending offers, or members, the usage count will be incorrect. Plan enforcement would silently fail to block additional resources beyond actual limits. For example, if a startup has 205 members, the system might report 200 and allow creating more when at limit
- Fix approach: Use indexed range queries with `order()` to ensure all resources are counted, or implement pagination to scan beyond the 200 limit. Alternatively, enforce a hard limit of 200 per resource type, or add a warning system if counts approach MAX_PLAN_USAGE_SCAN

## Known Bugs

None explicitly documented in the codebase.

## Security Considerations

**Missing Payment API Key Validation:**
- Risk: `DODO_PAYMENTS_API_KEY` defaults to empty string instead of failing early
- Files: `convex/dodo.ts` (line 11)
- Current mitigation: None - the SDK may fail silently or raise cryptic errors at runtime
- Recommendations: Throw an error during initialization if `DODO_PAYMENTS_API_KEY` is missing. Replace `?? ""` with explicit validation that throws immediately on startup

**Webhook Error Handling Silent Failure:**
- Risk: The Dodo webhook handler silently skips plan tier updates if user lookup fails
- Files: `convex/http.ts` (lines 26-31)
- Current mitigation: The check `if (!userId) { return; }` prevents crashes but doesn't log or alert
- Recommendations: Log webhook events that fail to find a user or update plan tier. Consider a metrics/monitoring table to track failed webhooks. Return an appropriate HTTP status code to indicate partial success/failure

**Payment Webhook Without Signature Validation:**
- Risk: The webhook handler (`createDodoWebhookHandler`) may not verify webhook source/signature
- Files: `convex/http.ts` (line 46)
- Current mitigation: Dodo SDK handles this, but not verified in this codebase
- Recommendations: Verify that `createDodoWebhookHandler` validates webhook signatures. Document the assumption. If not, add HMAC-SHA256 signature verification

## Performance Bottlenecks

**Sequential Database Queries in Plan Calculation:**
- Problem: `loadStartupPlan` makes 5+ sequential database queries to calculate plan usage (count roles, trials (open), trials (active), members, invites, offers)
- Files: `convex/lib/teams/plan.ts` (lines 52-103)
- Cause: Multiple independent `.query().withIndex().take()` calls without parallelization
- Improvement path: Parallelize using `Promise.all()` since queries don't depend on each other. Consider caching plan usage on the Startup document if it's accessed frequently during a session

**N+1 Query in Offers List:**
- Problem: `listForStartup` queries each offer's role in a loop
- Files: `convex/hiring/offers.ts` (lines 96-103)
- Cause: `for (const offer of offers) { ... await ctx.db.get(offer.roleId) }`
- Improvement path: Batch-load role data before the loop, or load roles once via index. Use `Promise.all()` to parallelize all role fetches

## Fragile Areas

**Trial Cycle State Machine:**
- Files: `convex/hiring/trialCycles.ts`, `convex/lib/hiring/trialCycles.ts`
- Why fragile: Complex status transitions (open → active → closed) driven by time-based scheduler (`ctx.scheduler`). Race conditions possible if trial is modified during transition. If `start` or `end` mutations race with manual cancel, state could be inconsistent
- Safe modification: Always check current status before state transitions. Write comprehensive tests for concurrent transitions. Review scheduler-driven code for race conditions
- Test coverage: `convex/hiring/trialCycles.test.ts` exists but needs tests for concurrent state transitions and scheduler edge cases

**Verdicts and Offers:**
- Files: `convex/lib/hiring/verdicts.ts`, `convex/lib/hiring/offers.ts`
- Why fragile: `closeWithVerdicts` creates offers without checking plan limits. If role is filled during verdict submission, the check at line 53 (`role?.status !== "open"`) rejects the entire verdict batch. All-or-nothing semantics means one bad verdict blocks all verdicts
- Safe modification: Add plan limit pre-checks before allowing verdict submission. Consider partial success semantics or clear error messaging to distinguish plan limit vs. role status issues
- Test coverage: `convex/hiring/verdicts.test.ts` (153 lines) exists but doesn't test plan limit scenarios

**Score Recalculation:**
- Files: `convex/lib/reputation/score.ts` (referenced but not fully reviewed)
- Why fragile: Score is recalculated on Offer acceptance and verdict completion. If recalculation logic changes, historical scores are not updated, creating inconsistency. No migration to re-derive old scores
- Safe modification: Document score calculation contract. Add comprehensive tests for score edge cases. Consider versioning score formula if it changes
- Test coverage: No explicit score recalculation tests observed

## Scaling Limits

**Member/Role/Invite Count Capping:**
- Current capacity: 200 resources scanned per query via `MAX_PLAN_USAGE_SCAN`
- Limit: Pro tier allows up to 50 members (line 48, `convex/lib/limits.ts`); if you try to create the 51st, the 50-member limit is enforced. But if you have exactly 50 and make 200 concurrent add requests, race conditions could allow more than 50
- Scaling path: Implement atomic counters or distributed locks before incrementing resource counts. Use Convex transactions to ensure atomicity of limit + insert operations

**Trial Cycle Participant Slots:**
- Current capacity: `participantCount` incremented one at a time in `takeParticipantSpot`
- Limit: `MAX_TRIAL_PARTICIPANTS = 10` (line 1, `convex/lib/limits.ts`)
- Scaling path: If trial participation needs to scale beyond 10, participant slots would require async queue/waitlist logic

## Dependencies at Risk

**Dodo Payments Integration:**
- Risk: Payment processing relies entirely on `@dodopayments/convex` 0.2.15 (line 20, `package.json`). No fallback or backup. Webhook-driven plan tier updates mean billing is asynchronous and can lag
- Impact: If Dodo service is down, new subscriptions won't activate. If webhooks fail, plan tier updates won't apply. Users may see "free" even if they've paid
- Migration plan: Add retry logic and dead-letter queue for failed webhooks. Implement polling fallback if webhooks don't arrive within SLA. Consider Stripe or similar with better uptime track record

**Convex Framework Tight Coupling:**
- Risk: Schema, queries, mutations, and internal functions are tightly coupled to Convex. Migration to another backend would require rewriting all database logic
- Impact: Framework version upgrades require careful testing. Schema migrations require Convex-specific syntax
- Migration plan: This is acceptable for a startup; Convex is a good choice for V1

## Missing Critical Features

**No Email Notifications:**
- Problem: The system records notifications in the database, but does not send emails. Users must log in to see notifications
- Blocks: Onboarding flow, engagement, verdict announcements
- Planned in: Likely phase 2+; for now, in-app notifications are sufficient for MVP

**No User-Facing Plan Limit Enforcement Errors:**
- Problem: Create mutations lack plan limit checks. If/when enforcement is added, UI doesn't guide users to upgrade
- Blocks: Effective trial-to-pro conversion flow. Users hit errors without context
- Planned in: Phase with "upgrade prompt" UI components

**No Billing History or Invoice Download:**
- Problem: No way for users to view past subscriptions or download invoices from within the app
- Blocks: Compliance, expense tracking for customers
- Planned in: Phase 2+; Dodo may provide this natively

## Test Coverage Gaps

**No Frontend Tests:**
- What's not tested: All React components, hooks, and page logic in `src/`
- Files: Entire `src/` directory (0 test files)
- Risk: Bugs in UI state, form validation, error boundaries, navigation go unnoticed. Refactoring is high-risk
- Priority: **High** — Frontend is the user-facing surface. E2E tests or snapshot tests should be added for critical flows (auth, offer response, pulse submission)

**Plan Limit Enforcement Not Tested:**
- What's not tested: Creating Roles and Trial Cycles when free account already has max resources
- Files: `convex/hiring/roles.test.ts`, `convex/hiring/trialCycles.test.ts`
- Risk: Plan enforcement will not work correctly when implemented. Free users may accidentally (or intentionally) create unlimited resources until limits are enforced
- Priority: **High** — Must be tested before go-live

**Webhook Failure Scenarios Not Tested:**
- What's not tested: Dodo webhook arriving with missing `userId` or email. Multiple webhooks for same user. Out-of-order webhooks (e.g., cancellation before activation)
- Files: `convex/http.ts` (webhook handler, no corresponding test file)
- Risk: Billing state becomes inconsistent. Users lose or gain access unexpectedly
- Priority: **Medium** — Should be covered before scaling to production payments

**Concurrent Offer/Verdict Creation Not Tested:**
- What's not tested: Two founders creating verdicts simultaneously, or two users accepting offers for the same role
- Files: `convex/lib/hiring/verdicts.ts`, `convex/hiring/offers.ts`
- Risk: Role could accept more participants than headcount. Score and offer state could be inconsistent
- Priority: **Medium** — Race conditions are rare but can cause revenue loss or data corruption

**Scheduler-Driven State Transitions Not Tested:**
- What's not tested: Trial start/end/cancellation triggered by scheduler while manual mutations race
- Files: `convex/hiring/trialCycles.ts` (internal mutations at lines 168, 183)
- Risk: Trials could get stuck in inconsistent states. Participants might be stranded
- Priority: **Medium** — Use `advancePast` in tests (already available in `test.helpers.ts`) to simulate time passage and scheduler execution

---

*Concerns audit: 2026-09-29*
