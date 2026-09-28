---
last_mapped_commit: 63da4c34dd0df46fd780733eaefce3afb95f98e3
last_mapped_at: 2026-09-28
---
# Testing Patterns

**Analysis Date:** 2026-09-28

## Test Framework

**Runner:**
- vitest v5.0.2
- Config: `vitest.config.ts`
- Environment: `edge-runtime` (configured)
- Glob pattern: `convex/**/*.test.ts`

**Assertion Library:**
- vitest's built-in `expect` from `import { expect }`
- No separate assertion library; vitest provides assertions natively

**Run Commands:**

```bash
pnpm test                              # Run all tests (backend only)
pnpm test convex/hiring/offers.test.ts # Run one file
pnpm test -t "declining an Offer"      # Run one test by name
```

## Test File Organization

**Location:**
- Co-located with implementation: test files sit next to the code they test
- Pattern: `convex/**/*.test.ts` (same directory as the `.ts` file being tested)
- Examples: `convex/hiring/offers.ts` → `convex/hiring/offers.test.ts`; `convex/people/users.ts` → `convex/people/users.test.ts`

**Naming:**
- File name: exact function filename with `.test.ts` suffix (e.g., `offers.test.ts`)
- Test descriptions: natural language sentences starting with "a" or "the"
  - Good: "a passed-with-offer Verdict gives the Participant a pending Offer"
  - Good: "accepting an Offer makes the Participant a Member and earns 120 Score"

**Structure:**

```
convex/
  hiring/
    offers.ts           (implementation)
    offers.test.ts      (tests)
  people/
    users.ts            (implementation)
    users.test.ts       (tests)
  test.helpers.ts       (shared test utilities)
  test.setup.ts         (module glob setup)
```

## Test Structure

**Suite Organization:**

```typescript
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { api } from "../_generated/api";
import { createTest, setUpStartup, signUp } from "../test.helpers";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test("a clear description of the behavior", async () => {
  const t = createTest();
  const setup = await setUpStartup(t);
  // assertions
});
```

**Patterns:**
- Setup: helper functions like `setUpStartup()`, `signUp()`, `createTrial()` prepare test state
- Execution: call `api.*` via `t.query()`, `t.mutation()`, or `as.query()` / `as.mutation()`
- Assertions: `expect()` on return values or side effects like notifications
- Cleanup: automatic via `afterEach` (reset fake timers)

## Mocking

**Framework:** vitest's `vi` module (vitest built-in)

**Patterns:**

```typescript
// Time mocking
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Advance time for scheduled functions
await advancePast(t, DAY + HOUR);  // Helper in test.helpers.ts
```

**What to Mock:**
- Time: always mock with `vi.useFakeTimers()` and `advancePast()` for tests involving time-based transitions (Trial Cycles starting, Cycles auto-closing, scheduled functions)

**What NOT to Mock:**
- Database: use in-memory convex-test database, not mocked
- API calls: test against real `api.*` references via convex-test
- Auth: use `t.withIdentity({ subject: "<id>|session" })` to simulate authenticated users

## Fixtures and Factories

**Test Data:**
Reusable setup helpers in `convex/test.helpers.ts`:

```typescript
// Create a test instance
const t = createTest();

// Sign up a user
const alice = await signUp(t, "Alice");

// Set up startup with founder and role
const setup = await setUpStartup(t);
// Returns: { founder, startupId, roleId }

// Create a trial (unpublished)
const trialCycleId = await createTrial(setup, { startsInMs: DAY });

// Start a trial with participants
const trialCycleId = await startedTrialWith(t, setup, [alice, bob]);

// Close a trial with verdicts
await closeWithVerdict(t, setup, trialCycleId, alice, "passed_with_offer");

// Join a cycle as a member
const member = await joinAsMember(t, setup, "memberName");

// Create and track a cycle pulse
const { cycleId, pulseId, statusOf } = await cyclePulseFor(t, setup, worker);

// Get score or notifications
const score = await scoreOf(t, alice.userId);
const titles = await notificationTitles(alice.as);
```

**Location:**
- `convex/test.helpers.ts` exports all factory and assertion helpers
- `convex/test.setup.ts` supplies the module glob to convex-test

## Coverage

**Requirements:** None enforced

**View Coverage:** Not configured

## Test Types

**Unit Tests:**
- Scope: individual Convex functions (queries, mutations)
- Approach: call `api.*` via test instance; assert on return value and side effects (notifications, activity logs)
- Example: "a pending Offer can no longer be accepted after withdrawal"

**Integration Tests:**
- Scope: workflows spanning multiple functions (create trial → join → start → close with verdict)
- Approach: chain helpers like `setUpStartup` → `createTrial` → `startedTrialWith` → `closeWithVerdict`
- Example: "accepting an Offer makes the Participant a Member and earns 120 Score"

**E2E Tests:**
- Status: Not used
- Frontend has no tests

## Common Patterns

**Async Testing:**
All tests are `async` and `await` on Convex function calls:

```typescript
test("name", async () => {
  const t = createTest();
  const result = await t.query(api.example.fn, { arg: value });
  expect(result).toBe(expectedValue);
});
```

**Error Testing:**

```typescript
test("a Founder can't withdraw an accepted Offer", async () => {
  // setup
  await expect(
    setup.founder.as.mutation(api.hiring.offers.withdraw, { offerId: offer._id })
  ).rejects.toThrow("Offer not found");
});
```

**Testing as Different Users:**

```typescript
// Get authenticated "as" handle for a user
const { userId, as } = await signUp(t, "Alice");

// Call as Alice
await as.mutation(api.example.fn, { ... });

// Call as founder
await setup.founder.as.mutation(api.example.fn, { ... });
```

**Testing Time-Based Transitions:**

```typescript
// Setup something with a start time
const trialCycleId = await createTrial(setup, { startsInMs: DAY });

// Advance past the event
await advancePast(t, DAY + HOUR);

// Assert the scheduled function ran
const trial = await alice.as.query(api.hiring.trialCycles.get, { trialCycleId });
expect(trial?.status).toBe("active");
```

**Testing Notifications:**

```typescript
const titles = await notificationTitles(alice.as);
expect(titles).toContain("Build a feature has started");
```

**Testing Score Calculations:**

```typescript
const score = await scoreOf(t, alice.userId);
expect(score).toBe(80);  // passed verdict without offer
```

## Convex-Test Integration

**Module Discovery:**
- File: `convex/test.setup.ts`
- Code: `export const modules = import.meta.glob(["./**/*.*s", "!./**/*.test.ts"]);`
- Purpose: provides module map to convex-test so it can load and link all Convex functions

**Test Instance Creation:**

```typescript
import { convexTest } from "convex-test";
import schema from "./schema";
import { modules } from "./test.setup";

function createTest() {
  return convexTest(schema, modules);
}
```

**Calling Functions in Tests:**

```typescript
const t = createTest();

// Query via test instance (no auth)
const data = await t.query(api.example.fn, { arg: value });

// Mutation via test instance
const result = await t.mutation(api.example.fn, { arg: value });

// As authenticated user
const alice = await signUp(t, "Alice");
const data = await alice.as.query(api.example.fn, { arg: value });
const result = await alice.as.mutation(api.example.fn, { arg: value });

// Run arbitrary async function in database context
await t.run(async (ctx) => {
  const doc = await ctx.db.get(someId);
  // direct database access
});
```

---

*Testing analysis: 2026-09-28*
