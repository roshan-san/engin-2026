---
last_mapped_commit: f0a648da4386d24b5ee96348a96bf0cf757ba15f
last_mapped_at: 2026-09-29
---
# Testing Patterns

**Analysis Date:** 2026-09-29

## Test Framework

**Runner:**
- vitest 5.0.2
- Config: `vitest.config.ts`
- Environment: edge-runtime (Convex backend testing)

**Assertion Library:**
- vitest's built-in `expect()` (compatible with Jest syntax)

**Run Commands:**

```bash
pnpm test                        # Run all tests
pnpm test convex/hiring/offers.test.ts  # Run one file
pnpm test -t "declining an Offer"       # Run one test by name
```

## Test File Organization

**Location:**
- Backend tests co-located with code: `convex/**/*.test.ts`
- Frontend: no tests (tested manually or in E2E; not in scope)

**Naming:**
- File pattern: `*.test.ts`
- Located next to the module being tested (e.g., `convex/hiring/offers.test.ts` tests `convex/hiring/offers.ts`)

**Structure:**

```
convex/
├── hiring/
│   ├── offers.ts           # Backend module
│   ├── offers.test.ts      # Tests for offers.ts
│   ├── trialCycles.ts
│   └── trialCycles.test.ts
└── lib/
    ├── notify.ts
    └── (no test files for lib helpers)
```

## Test Structure

**Suite Organization:**

```typescript
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "../_generated/api";
import {
	closeWithVerdict,
	createTest,
	notificationTitles,
	scoreOf,
	setUpStartup,
	signUp,
	startedTrialWith,
	type TestConvex,
} from "../test.helpers";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

async function setUpOffer(t: TestConvex) {
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(t, setup, [alice]);
	await closeWithVerdict(t, setup, trialCycleId, alice, "passed_with_offer");
	const [offer] = await alice.as.query(api.hiring.offers.listMine, {});
	return { setup, alice, offer };
}

test("accepting an Offer makes the Participant a Member and earns 120 Score", async () => {
	const t = createTest();
	const { setup, alice, offer } = await setUpOffer(t);

	await alice.as.mutation(api.hiring.offers.accept, { offerId: offer._id });

	expect(await isMemberOf(alice.as, "Acme")).toBe(true);
	expect(await scoreOf(t, alice.userId)).toBe(200);
	expect(await notificationTitles(setup.founder.as)).toContain(
		"Alice accepted your Offer",
	);
});
```

**Patterns:**
- Fake timers enabled per test with `vi.useFakeTimers()`; disabled with `vi.useRealTimers()` in afterEach
- Setup helpers extract complex initialization into reusable async functions (top of file)
- Tests use Convex API directly via `t.run()`, `t.query()`, `t.mutation()`
- Identity simulation: `t.withIdentity()` returns a Convex client bound to a specific user

## Test Data & Setup

**Shared Helpers:**
Located in `convex/test.helpers.ts`:

- `createTest()` — Create a fresh in-memory test environment
- `signUp(t, name, planTier?)` — Create a user, return `{ userId, as: authedClient }`
- `setUpStartup(t, headcount?)` — Create founder, startup, role; return `{ founder, startupId, roleId }`
- `createTrial(setup, overrides?)` — Schedule a trial, optionally override start time, deadline, admission
- `startedTrialWith(t, setup, participants)` — Create trial, add participants, advance time past start
- `closeWithVerdict(t, setup, trialId, participant, verdict)` — Close trial and assign verdict to participant
- `scoreOf(t, userId)` — Query a user's score
- `notificationTitles(as)` — Query list of notification titles for a user
- `advancePast(t, ms)` — Advance fake timers and run scheduled functions
- `applicationIdOf(t, trialId, userId)` — Find an application by trial and user

**Constants in test.helpers:**
- `HOUR = 60 * 60 * 1000`
- `DAY = 24 * HOUR`

**Example Setup:**

```typescript
// convex/hiring/offers.test.ts
async function setUpOffer(t: TestConvex) {
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(t, setup, [alice]);
	await closeWithVerdict(t, setup, trialCycleId, alice, "passed_with_offer");
	const [offer] = await alice.as.query(api.hiring.offers.listMine, {});
	return { setup, alice, offer };
}
```

## Fixtures & Factories

**Test Data Generation:**
- `signUp(t, "Alice")` creates a user with email `alice@example.com`, username `alice`, plan `free` (override with `"pro"`)
- `setUpStartup(t)` creates founder, startup named "Acme", and engineer role
- Custom helpers in each test file for domain-specific setup (e.g., `setUpOffer`)

**No dedicated fixture files:** Factories live inline in test files or in `test.helpers.ts`

## Coverage

**Requirements:** No enforced coverage target

**View Coverage:**

```bash

# Not configured; run pnpm test with coverage flag if needed

```

## Test Types

**Unit Tests:**
- Backend functions tested via public API (`api.*`)
- Tests exercise complete workflows, not isolated units
- Scope: a complete user action (e.g., "accepting an offer")

**Integration Tests:**
- Not separated from unit tests; all tests are integration-level
- Test real database queries, time-based transitions, side effects (notifications, activity logging)
- Use fake timers to test scheduled functions

**E2E Tests:**
- Not implemented
- UI tested manually

## Common Patterns

**Async Testing:**

```typescript
test("accepting an Offer makes the Participant a Member and earns 120 Score", async () => {
	const t = createTest();
	const { setup, alice, offer } = await setUpOffer(t);

	// Action
	await alice.as.mutation(api.hiring.offers.accept, { offerId: offer._id });

	// Assertions
	expect(await isMemberOf(alice.as, "Acme")).toBe(true);
	expect(await scoreOf(t, alice.userId)).toBe(200);
});
```

All tests are async; use `await` for queries, mutations, and setup.

**Time-Based Testing (Scheduled Functions):**

```typescript
beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

test("a Trial Cycle with Participants becomes active at its start time", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });
	const alice = await signUp(t, "Alice");
	await alice.as.mutation(api.hiring.applications.joinTrial, { trialCycleId });

	// Advance time to trigger scheduled transitions
	await advancePast(t, DAY + HOUR);

	const trial = await alice.as.query(api.hiring.trialCycles.get, {
		trialCycleId,
	});
	expect(trial?.status).toBe("active");
});
```

Use `advancePast(t, ms)` helper to advance timers and run scheduled functions.

**Error Assertion:**

```typescript
test("a withdrawn Offer can no longer be accepted", async () => {
	const t = createTest();
	const { setup, alice, offer } = await setUpOffer(t);

	await setup.founder.as.mutation(api.hiring.offers.withdraw, {
		offerId: offer._id,
	});

	await expect(
		alice.as.mutation(api.hiring.offers.accept, { offerId: offer._id }),
	).rejects.toThrow("no longer pending");
});
```

Wrap rejected mutations with `expect(...).rejects.toThrow(message)`.

**Query & Mutation Testing:**

```typescript
// Test a query
const profile = await t.query(api.people.users.getByUsername, { username: "alice" });
expect(profile?.evidence.score).toBe(80);

// Test a mutation
await alice.as.mutation(api.hiring.offers.accept, { offerId: offer._id });

// Run a raw database operation
const userId: Id<"users"> = await t.run(
	async (ctx) =>
		await ctx.db.insert("users", {
			name: "Bob",
			email: "bob@example.com",
			username: "bob",
			planTier: "free",
			score: 0,
		}),
);
```

**Identity Simulation:**

```typescript
const alice = await signUp(t, "Alice");
// alice.as is an authenticated Convex client for Alice

await alice.as.mutation(api.hiring.offers.accept, { offerId: offer._id });
// Mutation runs as Alice

// For raw DB operations:
const userId = await t.run(async (ctx) => {
	// ctx runs as system user (no identity)
	return await ctx.db.insert("users", { ... });
});
```

## Test Configuration

**vitest.config.ts:**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "edge-runtime",
		include: ["convex/**/*.test.ts"],
		server: { deps: { inline: ["convex-test"] } },
	},
});
```

**test.setup.ts:**

```typescript
/// <reference types="vite/client" />
export const modules = import.meta.glob(["./**/*.*s", "!./**/*.test.ts"]);
```

Provides the module glob that `convex-test` requires to load Convex functions.

## Best Practices

1. **One action per test:** Each test exercises one user action (accept, decline, etc.)
2. **Descriptive names:** Test names explain the outcome, not the setup (e.g., "accepting an Offer makes the Participant a Member")
3. **Reuse helpers:** Extract setup into helper functions, not inline
4. **Real workflows:** Test the actual API, not mocked implementations
5. **Fake timers:** Always use `vi.useFakeTimers()` in `beforeEach` to control time
6. **No arbitrary delays:** Use `advancePast()` instead of `sleep()`
7. **Test notification content:** Verify side effects like notifications and activity logs

---

*Testing analysis: 2026-09-29*
