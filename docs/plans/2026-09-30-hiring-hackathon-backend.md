# Hiring Hackathon (Backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a pay-to-publish gate in front of Trial Cycles (drafts, a credits ledger, Dodo payments in INR), and add the entry and Score-integrity rules from the approved hiring hackathon design.

**Architecture:** One `hackathonCredits` table holds every kind of credit: launch codes, UPI codes, re-run credits, monthly Pro credits and one-time purchases. Each row is tagged with its `source`. `convex/lib/billing/credits.ts` grants, claims and spends credits. Trial Cycles are created as `draft` and become `open` only through `publish`, a single mutation that runs every check, spends exactly one credit and schedules the start. Dodo webhooks become thin `httpAction` adapters over internal mutations in `convex/billing/webhooks.ts`, so all webhook logic is unit-tested.

**Tech Stack:** Convex 1.46 (queries, mutations, actions, crons, scheduler), `@dodopayments/convex` 0.2.15, vitest 5 + `convex-test` 0.0.60 (edge-runtime), TypeScript 6, Biome.

**Spec:** `docs/designs/engin-hiring-hackathon.md` (approved design), with the binding decisions in `docs/designs/engin-hiring-hackathon-eng-review.md` (R1–R7, C1–C6) and the flows in `docs/designs/engin-hiring-hackathon-test-plan.md`. Read all three before starting.

## Global Constraints

- Prices (INR): Free pays ₹2,999 per hackathon. Pro is ₹999/mo or ₹9,999/yr and pays ₹1,499 per extra hackathon. Checkout currency is `INR`.
- Pro includes 1 hackathon credit per month. Unused credits roll over, **max 3 banked**.
- Spend order at publish: `launch` → `rerun` → `pro_monthly` → `upi` → `purchase`. Within one source, the credit that expires soonest goes first.
- Credits belong to the paying or claiming **user**, not the startup (R2). Spending needs founder membership of the target startup.
- Launch codes: at most **10 per 90 days**; UPI codes don't count against this. Each code is ≥10 random characters, single use, and case-insensitive.
- Re-run credit: granted by hand only. It requires fewer than **3 applications** by the entry cutoff (`applicationDeadline ?? startsAt`), expires after **60 days**, and a re-run can't earn another one.
- Contributor cap: **5 live entries** (`applied`, `joined`) with no Pro bypass. Exact message: `You're in 5 hackathons already. Finish or withdraw from one to join another.`
- A stealth startup (`isPublic: false`) can't publish.
- No data migration (R5). New Trial Cycles start as drafts; existing rows stay as they are.
- A webhook that matches no user logs with `console.error` and returns normally (R6).
- `createTrial` in `convex/test.helpers.ts` publishes, so every existing lifecycle test passes unchanged (R7).
- Every DB read is bounded with `.take(N)`, using a constant from `convex/lib/limits.ts`. Guards throw plain `Error`s with user-facing messages. Handlers stay thin and put logic in `convex/lib/`.
- No test-only public or internal functions. Tests seed data with `t.run`.
- Biome formatting: tabs, double quotes. `pnpm check` and `pnpm exec tsc -p convex --noEmit` must pass at the end of every task.

## Deviation from the eng review (flag to the user at handoff)

- **R1 grant key.** The review keys monthly Pro grants by `(subscriptionId, periodStart)`. A **yearly** subscription renews once a year, so that key would grant 1 credit a year instead of 1 a month. This plan keys grants by `pro_monthly:{userId}:{YYYY-MM}` (UTC) instead. The webhook grants the credit for the current month, and a daily cron grants the month's credit to every Pro user. Duplicate and active+renewed deliveries are still no-ops, which was R1's intent. A side effect: a founder at the 3-credit cap who spends one mid-month gets that month's credit the next day.

## Out of scope (separate plan)

The frontend pages: the pricing page rewrite, the hiring page (create draft, publish, balance, claim code, checkout), the public hackathon page (prize, IP notice) and the profile verdict list. `src/routes/_shell/_authed/s/$slug/_member/hiring/index.tsx` and `TrialCyclePage` are still stubs from the redesign. This plan touches the frontend only where the new `acceptTerms` argument would otherwise break the build (Task 6).

## Review Focus

These five inputs aren't exercised by the spec's own flows but are likely to bite. Each has a test in the task named.

1. A launch code typed in mixed case, with spaces or dashes, still claims the credit. Test in Task 1.
2. Webhook metadata carrying a `userId` that isn't a valid users id falls back to the customer email instead of throwing. Test in Task 5.
3. A co-founder with no credits publishing while the other founder has some is rejected, and nobody's credit is spent. Test in Task 2.
4. A payment landing for a draft that was cancelled in the meantime leaves the credit in the balance and changes nothing else. Test in Task 5.
5. A founder rescheduling an already-published hackathon is rejected, because its scheduled start would drift from its dates. Test in Task 2.

## File map

| File | Responsibility |
|---|---|
| `convex/schema.ts` | `creditSource`, `hackathonCredits` table, `draft` status, new Trial Cycle / application fields, `users.by_plan_tier` |
| `convex/lib/limits.ts` | New limits; removes `FREE_ACTIVE_TRIAL_APPLICATIONS` and `liveTrialCycles` |
| `convex/lib/billing/credits.ts` (new) | Code generation, spendable-credit reads, grant, spend, monthly Pro grant, Pro expiry |
| `convex/billing/credits.ts` (new) | `balance`, `claimLaunchCode`, internal `createLaunchCode`, `grantRerunCredit`, `grantMonthlyProCredits` |
| `convex/billing/webhooks.ts` (new) | Internal `applySubscriptionEvent`, `applyPaymentSucceeded`; user resolution + R6 logging |
| `convex/billing/checkout.ts` (new) | Internal `prepareHackathonCheckout`, action `createHackathonCheckout` |
| `convex/crons.ts` (new) | Daily monthly-credit grant |
| `convex/lib/hiring/publish.ts` (new) | `publishProblem`, `requirePublishable`, `publishDraft` |
| `convex/lib/hiring/ipTerms.ts` (new) | `requireIpTerms` |
| `convex/hiring/trialCycles.ts` | `create` → draft, `publish`, `reschedule`, draft-aware `cancel` / `get` |
| `convex/lib/hiring/entries.ts` | Member block, 5-entry cap |
| `convex/lib/hiring/verdicts.ts`, `convex/lib/reputation/score.ts`, `convex/lib/reputation/trialHistory.ts` | Score integrity, profile verdicts |
| `convex/http.ts`, `convex/dodo.ts`, `convex/people/billing.ts` | Thin webhook adapters, hackathon product IDs, INR |
| `convex/test.helpers.ts` | `createDraftTrial`, `giveCredit`, `balanceOf`; `createTrial` publishes |

Regenerate types whenever a task adds a Convex module or changes `schema.ts`. Run `pnpm exec convex codegen`, which needs the deployment in `.env.local`; or keep `pnpm dev:backend` running. `convex/_generated/` is tracked, so commit it with the task. vitest doesn't typecheck, but `tsc` does.

---

### Task 1: Credits ledger, launch codes and balance

**Files:**
- Modify: `convex/schema.ts` (add `creditSource` directly above `trialStatus`; add `hackathonCredits` table)
- Modify: `convex/lib/limits.ts`
- Create: `convex/lib/billing/credits.ts`
- Create: `convex/billing/credits.ts`
- Modify: `convex/test.helpers.ts` (add `balanceOf`)
- Test: `convex/billing/credits.test.ts`

**Interfaces:**
- Produces (schema): `export const creditSource = v.union(v.literal("launch"), v.literal("upi"), v.literal("rerun"), v.literal("pro_monthly"), v.literal("purchase"))`, and table `hackathonCredits` with indexes `by_owner_and_spent`, `by_code`, `by_grant_key`, `by_source`
- Produces (lib): `type CreditSource`, `normalizeCode(code: string): string`, `generateCode(): string`, `isSpendable(credit: Doc<"hackathonCredits">, now: number): boolean`, `listSpendableCredits(ctx: QueryCtx | MutationCtx, ownerUserId: Id<"users">, now: number): Promise<Doc<"hackathonCredits">[]>`
- Produces (API): `api.billing.credits.balance` → `{ available: number; credits: { _id; source: CreditSource; expiresAt: number | null }[] }`; `api.billing.credits.claimLaunchCode({ code: string })`; `internal.billing.credits.createLaunchCode({ source: "launch" | "upi", issuedTo: string })` → the code in upper case
- Produces (test helper): `balanceOf(as): Promise<number>`

- [ ] **Step 1: Add the schema**

In `convex/schema.ts`, directly above `trialStatus`, add the validator below. It sits there because Task 2 uses it in the `trialCycles` table, and a `const` must be declared before use.

```ts
/** Where a hackathon credit came from; decides spend order (eng review). */
export const creditSource = v.union(
	v.literal("launch"),
	v.literal("upi"),
	v.literal("rerun"),
	v.literal("pro_monthly"),
	v.literal("purchase"),
);
```

Inside `defineSchema`, after `trialMessages`, add:

```ts
	/**
	 * One row per hackathon credit, whatever it came from (eng review D2).
	 * A credit pays for publishing one Trial Cycle.
	 */
	hackathonCredits: defineTable({
		/** Unset until someone claims a launch or UPI code. */
		ownerUserId: v.optional(v.id("users")),
		source: creditSource,
		/** Launch and UPI codes, stored lowercase without spaces or dashes. */
		code: v.optional(v.string()),
		/** Who Engin handed a code to, e.g. "IIT-M E-cell session". */
		issuedTo: v.optional(v.string()),
		claimedAt: v.optional(v.number()),
		/**
		 * One credit per key, because webhooks repeat:
		 * `pro_monthly:{userId}:{YYYY-MM}`, `purchase:{paymentId}`, `rerun:{trialCycleId}`.
		 */
		grantKey: v.optional(v.string()),
		expiresAt: v.optional(v.number()),
		spentAt: v.optional(v.number()),
		spentOnTrialCycleId: v.optional(v.id("trialCycles")),
	})
		.index("by_owner_and_spent", ["ownerUserId", "spentAt"])
		.index("by_code", ["code"])
		.index("by_grant_key", ["grantKey"])
		.index("by_source", ["source"]),
```

- [ ] **Step 2: Add the limits**

In `convex/lib/limits.ts`, after `CYCLE_ENDING_SOON_MS`, add:

```ts
/** Bound on one person's unspent hackathon credits read at once. */
export const MAX_USER_CREDITS = 50;
/** Free launch codes Engin may create per window (design: Free allowance). */
export const MAX_LAUNCH_CODES = 10;
export const LAUNCH_CODE_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;
```

- [ ] **Step 3: Add `balanceOf` to the test helpers**

In `convex/test.helpers.ts`, after `notificationTitles`, add:

```ts
/** How many hackathon credits the signed-in person can spend right now. */
export async function balanceOf(as: ReturnType<TestConvex["withIdentity"]>) {
	return (await as.query(api.billing.credits.balance, {})).available;
}
```

- [ ] **Step 4: Write the failing tests**

Create `convex/billing/credits.test.ts`:

```ts
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "../_generated/api";
import { balanceOf, createTest, DAY, signUp } from "../test.helpers";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

test("a launch code gives the founder who claims it one credit", async () => {
	const t = createTest();
	const founder = await signUp(t, "Founder");
	const code = await t.mutation(internal.billing.credits.createLaunchCode, {
		source: "launch",
		issuedTo: "E-cell session",
	});

	await founder.as.mutation(api.billing.credits.claimLaunchCode, { code });

	const balance = await founder.as.query(api.billing.credits.balance, {});
	expect(balance.available).toBe(1);
	expect(balance.credits[0]?.source).toBe("launch");
});

test("a launch code claims whatever its case, spaces or dashes", async () => {
	const t = createTest();
	const founder = await signUp(t, "Founder");
	const code = await t.mutation(internal.billing.credits.createLaunchCode, {
		source: "launch",
		issuedTo: "E-cell session",
	});
	const typed = ` ${code.slice(0, 4).toLowerCase()}-${code.slice(4)} `;

	await founder.as.mutation(api.billing.credits.claimLaunchCode, {
		code: typed,
	});

	expect(await balanceOf(founder.as)).toBe(1);
});

test("a launch code can be claimed once", async () => {
	const t = createTest();
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	const code = await t.mutation(internal.billing.credits.createLaunchCode, {
		source: "launch",
		issuedTo: "E-cell session",
	});
	await alice.as.mutation(api.billing.credits.claimLaunchCode, { code });

	await expect(
		bob.as.mutation(api.billing.credits.claimLaunchCode, { code }),
	).rejects.toThrow("already been used");
	expect(await balanceOf(bob.as)).toBe(0);
});

test("an unknown code is rejected", async () => {
	const t = createTest();
	const founder = await signUp(t, "Founder");

	await expect(
		founder.as.mutation(api.billing.credits.claimLaunchCode, {
			code: "NOPE-NOPE-NOPE",
		}),
	).rejects.toThrow("doesn't exist");
});

test("Engin can create 10 launch codes per 90 days, and UPI codes don't count", async () => {
	const t = createTest();
	for (let index = 0; index < 10; index += 1) {
		await t.mutation(internal.billing.credits.createLaunchCode, {
			source: "launch",
			issuedTo: `Session ${index}`,
		});
	}

	await expect(
		t.mutation(internal.billing.credits.createLaunchCode, {
			source: "launch",
			issuedTo: "One too many",
		}),
	).rejects.toThrow("10 codes per 90 days");
	await t.mutation(internal.billing.credits.createLaunchCode, {
		source: "upi",
		issuedTo: "Paid by UPI",
	});

	vi.advanceTimersByTime(91 * DAY);
	await t.mutation(internal.billing.credits.createLaunchCode, {
		source: "launch",
		issuedTo: "Next quarter",
	});
});
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `pnpm vitest run convex/billing/credits.test.ts`
Expected: FAIL. `internal.billing.credits.createLaunchCode` doesn't exist yet, so the error names a missing function or module.

- [ ] **Step 6: Write the lib**

Create `convex/lib/billing/credits.ts`:

```ts
import type { Infer } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type { creditSource } from "../../schema";
import { MAX_USER_CREDITS } from "../limits";

type CreditCtx = QueryCtx | MutationCtx;

export type CreditSource = Infer<typeof creditSource>;

const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const CODE_LENGTH = 12;

/** Codes are stored lowercase without spaces or dashes, so claiming ignores all three. */
export function normalizeCode(code: string): string {
	return code.toLowerCase().replace(/[\s-]/g, "");
}

/** 12 characters from a 31-letter alphabet, so guessing one is infeasible (eng review C6). */
export function generateCode(): string {
	const bytes = new Uint8Array(CODE_LENGTH);
	crypto.getRandomValues(bytes);
	return Array.from(
		bytes,
		(byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length],
	).join("");
}

export function isSpendable(
	credit: Doc<"hackathonCredits">,
	now: number,
): boolean {
	return (
		credit.spentAt === undefined &&
		(credit.expiresAt === undefined || credit.expiresAt > now)
	);
}

export async function listSpendableCredits(
	ctx: CreditCtx,
	ownerUserId: Id<"users">,
	now: number,
): Promise<Doc<"hackathonCredits">[]> {
	const unspent = await ctx.db
		.query("hackathonCredits")
		.withIndex("by_owner_and_spent", (q) =>
			q.eq("ownerUserId", ownerUserId).eq("spentAt", undefined),
		)
		.take(MAX_USER_CREDITS);
	return unspent.filter((credit) => isSpendable(credit, now));
}
```

- [ ] **Step 7: Write the functions**

Create `convex/billing/credits.ts`:

```ts
import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import {
	generateCode,
	listSpendableCredits,
	normalizeCode,
} from "../lib/billing/credits";
import { LAUNCH_CODE_WINDOW_MS, MAX_LAUNCH_CODES } from "../lib/limits";
import { requireText } from "../lib/text";

export const balance = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const credits = await listSpendableCredits(ctx, userId, Date.now());
		return {
			available: credits.length,
			credits: credits.map((credit) => ({
				_id: credit._id,
				source: credit.source,
				expiresAt: credit.expiresAt ?? null,
			})),
		};
	},
});

export const claimLaunchCode = mutation({
	args: { code: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const code = normalizeCode(args.code);
		const credit = code
			? await ctx.db
					.query("hackathonCredits")
					.withIndex("by_code", (q) => q.eq("code", code))
					.first()
			: null;
		if (!credit) {
			throw new Error("That code doesn't exist. Check it and try again.");
		}
		if (credit.ownerUserId !== undefined) {
			throw new Error("That code has already been used.");
		}

		await ctx.db.patch(credit._id, {
			ownerUserId: userId,
			claimedAt: Date.now(),
		});
	},
});

/**
 * Run by Engin (`pnpm exec convex run billing/credits:createLaunchCode`).
 * UPI codes are paid for, so only free launch codes count against the budget.
 */
export const createLaunchCode = internalMutation({
	args: {
		source: v.union(v.literal("launch"), v.literal("upi")),
		issuedTo: v.string(),
	},
	handler: async (ctx, args) => {
		const issuedTo = requireText(args.issuedTo, "Issued to");
		if (args.source === "launch") {
			const since = Date.now() - LAUNCH_CODE_WINDOW_MS;
			const recent = await ctx.db
				.query("hackathonCredits")
				.withIndex("by_source", (q) =>
					q.eq("source", "launch").gt("_creationTime", since),
				)
				.take(MAX_LAUNCH_CODES);
			if (recent.length >= MAX_LAUNCH_CODES) {
				throw new Error(
					`The launch-code budget is ${MAX_LAUNCH_CODES} codes per 90 days`,
				);
			}
		}

		const code = generateCode();
		await ctx.db.insert("hackathonCredits", {
			source: args.source,
			code,
			issuedTo,
		});
		return code.toUpperCase();
	},
});
```

- [ ] **Step 8: Regenerate types and run the tests**

Run: `pnpm exec convex codegen && pnpm vitest run convex/billing/credits.test.ts`
Expected: PASS, 5 tests. If only the budget test fails, on its last `createLaunchCode` after `advanceTimersByTime`, then `convex-test` isn't stamping `_creationTime` from the faked clock. In that case add an indexed `createdAt: v.optional(v.number())` to launch rows, set it to `Date.now()` in `createLaunchCode`, and range over an index `["source", "createdAt"]` instead.

- [ ] **Step 9: Typecheck, lint, commit**

Run: `pnpm check && pnpm exec tsc -p convex --noEmit`
Expected: exit 0.

```bash
git add convex/schema.ts convex/lib/limits.ts convex/lib/billing/credits.ts convex/billing/credits.ts convex/billing/credits.test.ts convex/test.helpers.ts convex/_generated
git commit -m "feat(billing): hackathon credits ledger with launch codes"
```

---

### Task 2: Draft Trial Cycles and the publish gate

**Files:**
- Modify: `convex/schema.ts` (`trialStatus` gains `draft`; `trialCycles` gains `publishedAt`, `publishedByUserId`, `creditSource`, `ipAcknowledgedAt`, `prize`)
- Modify: `convex/lib/billing/credits.ts` (add `CREDIT_SPEND_ORDER`, `NO_CREDIT_MESSAGE`, `spendCredit`)
- Create: `convex/lib/hiring/ipTerms.ts`
- Create: `convex/lib/hiring/publish.ts`
- Modify: `convex/hiring/trialCycles.ts` (`create`, `get`, `cancel`; new `publish`, `reschedule`)
- Modify: `convex/lib/hiring/trialCycles.ts:47-52` (`requireAcceptingEntries`)
- Modify: `convex/lib/hiring/offers.ts:62-66` (`fillRoleIfFull` also cancels drafts)
- Modify: `convex/hiring/opportunities.ts:73-84` (trial card gains `prize`)
- Modify: `convex/test.helpers.ts` (`setUpStartup` returns `t`; `createDraftTrial`, `giveCredit`; `createTrial` publishes)
- Test: `convex/hiring/trialCycles.test.ts`

**Interfaces:**
- Consumes: `listSpendableCredits`, `CreditSource` (Task 1); `balanceOf` (Task 1)
- Produces (lib): `CREDIT_SPEND_ORDER: readonly CreditSource[]`, `NO_CREDIT_MESSAGE: string`, `spendCredit(ctx: MutationCtx, ownerUserId: Id<"users">, trialCycleId: Id<"trialCycles">, now: number): Promise<Doc<"hackathonCredits">>`
- Produces (lib): `requireIpTerms(accepted: boolean): void`, `IP_TERMS_MESSAGE`
- Produces (lib): `NEW_DATES_MESSAGE`, `publishProblem(ctx: MutationCtx, trial: Doc<"trialCycles">, now: number): Promise<string | null>`, `requirePublishable(ctx, trial, userId, now): Promise<void>`, `publishDraft(ctx, trial, userId, now): Promise<void>`
- Produces (API): `api.hiring.trialCycles.create` gains optional `prize` and returns a **draft** id; `api.hiring.trialCycles.publish({ trialCycleId, acceptTerms: boolean })`; `api.hiring.trialCycles.reschedule({ trialCycleId, startsAt, endsAt, applicationDeadline? })`
- Produces (test helpers): `setUpStartup` returns `{ t, founder, startupId, roleId }`; `createDraftTrial(setup, overrides)`; `giveCredit(t, userId, { source?, expiresAt? })`; `createTrial` (now publishes); overrides gain `prize?: string`

- [ ] **Step 1: Extend the schema**

In `convex/schema.ts`, replace `trialStatus` with:

```ts
export const trialStatus = v.union(
	/** Created but not paid for: hidden, not joinable, no start scheduled. */
	v.literal("draft"),
	v.literal("open"),
	v.literal("active"),
	v.literal("closed"),
	v.literal("cancelled"),
);
```

In the `trialCycles` table, after `compensation`, add:

```ts
		/** Optional prize text, paid off-platform, e.g. "₹5,000 to the winner". */
		prize: v.optional(v.string()),
		/** Set at the charge point, when a Founder publishes the draft. */
		publishedAt: v.optional(v.number()),
		publishedByUserId: v.optional(v.id("users")),
		/** The credit that paid for publishing; a "rerun" can't earn another re-run credit. */
		creditSource: v.optional(creditSource),
		/** When the publishing Founder acknowledged that contributors keep their IP. */
		ipAcknowledgedAt: v.optional(v.number()),
```

- [ ] **Step 2: Rework the test helpers (R7)**

In `convex/test.helpers.ts`:

1. Add `import type { Doc, Id } from "./_generated/dataModel";`. It replaces the existing `Id`-only import.
2. Make `setUpStartup` return `{ t, founder, startupId, roleId }`.
3. Replace `createTrial` with:

```ts
type TrialOverrides = {
	admission?: "open" | "application";
	maxContributors?: number;
	startsInMs?: number;
	applicationDeadlineInMs?: number;
	prize?: string;
};

/** A draft Trial Cycle: created, not paid for, not public. */
export async function createDraftTrial(
	setup: Awaited<ReturnType<typeof setUpStartup>>,
	overrides: TrialOverrides = {},
) {
	const now = Date.now();
	const startsAt = now + (overrides.startsInMs ?? DAY);
	return await setup.founder.as.mutation(api.hiring.trialCycles.create, {
		startupId: setup.startupId,
		roleId: setup.roleId,
		title: "Build a feature",
		description: "Ship it",
		admission: overrides.admission ?? "open",
		maxContributors: overrides.maxContributors ?? 5,
		startsAt,
		endsAt: startsAt + 7 * DAY,
		applicationDeadline:
			overrides.applicationDeadlineInMs === undefined
				? undefined
				: now + overrides.applicationDeadlineInMs,
		prize: overrides.prize,
	});
}

/** Gives someone one unspent hackathon credit, as if they had paid. */
export async function giveCredit(
	t: TestConvex,
	userId: Id<"users">,
	credit: {
		source?: Doc<"hackathonCredits">["source"];
		expiresAt?: number;
	} = {},
) {
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("hackathonCredits", {
				ownerUserId: userId,
				source: credit.source ?? "purchase",
				expiresAt: credit.expiresAt,
			}),
	);
}

/**
 * A published Trial Cycle (eng review R7): the Founder pays with a credit,
 * so every lifecycle test runs unchanged.
 */
export async function createTrial(
	setup: Awaited<ReturnType<typeof setUpStartup>>,
	overrides: TrialOverrides = {},
) {
	const trialCycleId = await createDraftTrial(setup, overrides);
	await giveCredit(setup.t, setup.founder.userId);
	await setup.founder.as.mutation(api.hiring.trialCycles.publish, {
		trialCycleId,
		acceptTerms: true,
	});
	return trialCycleId;
}
```

- [ ] **Step 3: Write the failing tests**

In `convex/hiring/trialCycles.test.ts`, add `balanceOf`, `createDraftTrial`, `giveCredit` and `joinAsMember` to the `../test.helpers` import, then append:

```ts
async function publish(
	as: ReturnType<TestConvex["withIdentity"]>,
	trialCycleId: Awaited<ReturnType<typeof createDraftTrial>>,
	acceptTerms = true,
) {
	await as.mutation(api.hiring.trialCycles.publish, {
		trialCycleId,
		acceptTerms,
	});
}

test("a new Trial Cycle is a hidden draft: not listed, not joinable, not scheduled", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup, { startsInMs: DAY });
	const alice = await signUp(t, "Alice");

	expect(
		await alice.as.query(api.hiring.trialCycles.get, { trialCycleId }),
	).toBeNull();
	expect(
		(await t.query(api.hiring.opportunities.search, {})).trials,
	).toHaveLength(0);
	expect(
		await t.query(api.hiring.trialCycles.listOpenByStartup, {
			startupId: setup.startupId,
		}),
	).toHaveLength(0);
	await expect(
		alice.as.mutation(api.hiring.applications.joinTrial, { trialCycleId }),
	).rejects.toThrow("isn't published yet");

	await advancePast(t, 2 * DAY);
	const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
		trialCycleId,
	});
	expect(trial?.status).toBe("draft");
});

test("publishing spends one credit, opens the hackathon and schedules its start", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup, {
		startsInMs: DAY,
		prize: "₹5,000 to the winner",
	});
	await giveCredit(t, setup.founder.userId);

	await publish(setup.founder.as, trialCycleId);

	expect(await balanceOf(setup.founder.as)).toBe(0);
	const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
		trialCycleId,
	});
	expect(trial?.status).toBe("open");
	expect(trial?.creditSource).toBe("purchase");
	expect(trial?.ipAcknowledgedAt).toBeDefined();
	const { trials } = await t.query(api.hiring.opportunities.search, {});
	expect(trials.map((card) => card.prize)).toEqual(["₹5,000 to the winner"]);

	const alice = await signUp(t, "Alice");
	await alice.as.mutation(api.hiring.applications.joinTrial, { trialCycleId });
	await advancePast(t, DAY + HOUR);
	expect(
		(await alice.as.query(api.hiring.trialCycles.get, { trialCycleId }))
			?.status,
	).toBe("active");
});

test("publishing a second time is rejected and spends nothing", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup);
	await giveCredit(t, setup.founder.userId);
	await giveCredit(t, setup.founder.userId);
	await publish(setup.founder.as, trialCycleId);

	await expect(publish(setup.founder.as, trialCycleId)).rejects.toThrow(
		"Only a draft",
	);
	expect(await balanceOf(setup.founder.as)).toBe(1);
});

test("publishing without a credit fails and leaves the draft", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup);

	await expect(publish(setup.founder.as, trialCycleId)).rejects.toThrow(
		"no hackathon credits",
	);
	const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
		trialCycleId,
	});
	expect(trial?.status).toBe("draft");
});

test("publishing spends launch credits first, then re-run, Pro, UPI and purchase", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	for (const source of [
		"purchase",
		"upi",
		"pro_monthly",
		"rerun",
		"launch",
	] as const) {
		await giveCredit(t, setup.founder.userId, { source });
	}

	const spent = [];
	for (let index = 0; index < 5; index += 1) {
		const trialCycleId = await createDraftTrial(setup);
		await publish(setup.founder.as, trialCycleId);
		const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		spent.push(trial?.creditSource);
	}

	expect(spent).toEqual(["launch", "rerun", "pro_monthly", "upi", "purchase"]);
});

test("within one source, the credit expiring soonest is spent first", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const later = Date.now() + 30 * DAY;
	await giveCredit(t, setup.founder.userId, {
		source: "rerun",
		expiresAt: later,
	});
	await giveCredit(t, setup.founder.userId, {
		source: "rerun",
		expiresAt: Date.now() + 10 * DAY,
	});

	await publish(setup.founder.as, await createDraftTrial(setup));

	const { credits } = await setup.founder.as.query(
		api.billing.credits.balance,
		{},
	);
	expect(credits.map((credit) => credit.expiresAt)).toEqual([later]);
});

test("an expired credit is never spent", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await giveCredit(t, setup.founder.userId, {
		source: "rerun",
		expiresAt: Date.now() - 1,
	});

	await expect(
		publish(setup.founder.as, await createDraftTrial(setup)),
	).rejects.toThrow("no hackathon credits");
});

test("only a Founder can publish, and only with their own credits", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup);
	const member = await joinAsMember(t, setup, "Mia");
	await giveCredit(t, member.userId);

	await expect(publish(member.as, trialCycleId)).rejects.toThrow(
		"Only founders",
	);

	const cofounder = await signUp(t, "Cody");
	await t.run(async (ctx) => {
		await ctx.db.insert("memberships", {
			startupId: setup.startupId,
			userId: cofounder.userId,
			role: "founder",
		});
	});
	await giveCredit(t, setup.founder.userId);
	await expect(publish(cofounder.as, trialCycleId)).rejects.toThrow(
		"no hackathon credits",
	);
	expect(await balanceOf(setup.founder.as)).toBe(1);
});

test("a stealth startup can't publish a public hackathon", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup);
	await giveCredit(t, setup.founder.userId);
	await setup.founder.as.mutation(api.teams.startups.update, {
		startupId: setup.startupId,
		isPublic: false,
	});

	await expect(publish(setup.founder.as, trialCycleId)).rejects.toThrow(
		"Turn off stealth mode",
	);
});

test("a draft for a closed Role can't be published", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup);
	await giveCredit(t, setup.founder.userId);
	await t.run(async (ctx) => {
		await ctx.db.patch(setup.roleId, { status: "closed" });
	});

	await expect(publish(setup.founder.as, trialCycleId)).rejects.toThrow(
		"This Role is closed",
	);
});

test("a draft whose dates passed must get new dates before it can publish", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup, { startsInMs: DAY });
	await giveCredit(t, setup.founder.userId);
	vi.advanceTimersByTime(2 * DAY);

	await expect(publish(setup.founder.as, trialCycleId)).rejects.toThrow(
		"Pick new dates",
	);
	expect(await balanceOf(setup.founder.as)).toBe(1);

	const startsAt = Date.now() + DAY;
	await setup.founder.as.mutation(api.hiring.trialCycles.reschedule, {
		trialCycleId,
		startsAt,
		endsAt: startsAt + 7 * DAY,
	});
	await publish(setup.founder.as, trialCycleId);
	expect(await balanceOf(setup.founder.as)).toBe(0);
});

test("only a draft can be rescheduled", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup);
	const startsAt = Date.now() + 3 * DAY;

	await expect(
		setup.founder.as.mutation(api.hiring.trialCycles.reschedule, {
			trialCycleId,
			startsAt,
			endsAt: startsAt + 7 * DAY,
		}),
	).rejects.toThrow("Only a draft");
});

test("publishing requires the IP acknowledgment", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup);
	await giveCredit(t, setup.founder.userId);

	await expect(
		publish(setup.founder.as, trialCycleId, false),
	).rejects.toThrow("IP terms");
	expect(await balanceOf(setup.founder.as)).toBe(1);
});

test("a Founder can cancel a draft", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup);

	await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
		trialCycleId,
	});

	const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
		trialCycleId,
	});
	expect(trial?.status).toBe("cancelled");
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `pnpm vitest run convex/hiring/trialCycles.test.ts`
Expected: FAIL. `api.hiring.trialCycles.publish` doesn't exist, so every existing test fails inside `createTrial` too. That's the R7 regression contract, which Step 10 turns green.

- [ ] **Step 5: Add spending to the credits lib**

Append to `convex/lib/billing/credits.ts`:

```ts
/** A publish spends the first of these it finds (eng review, spend order). */
export const CREDIT_SPEND_ORDER: readonly CreditSource[] = [
	"launch",
	"rerun",
	"pro_monthly",
	"upi",
	"purchase",
];

export const NO_CREDIT_MESSAGE =
	"You have no hackathon credits. Pay for this hackathon to publish it.";

/** Spend order first, then the soonest expiry, then the oldest. */
function compareForSpending(
	a: Doc<"hackathonCredits">,
	b: Doc<"hackathonCredits">,
): number {
	const bySource =
		CREDIT_SPEND_ORDER.indexOf(a.source) - CREDIT_SPEND_ORDER.indexOf(b.source);
	if (bySource !== 0) {
		return bySource;
	}
	const aExpiry = a.expiresAt ?? Number.MAX_SAFE_INTEGER;
	const bExpiry = b.expiresAt ?? Number.MAX_SAFE_INTEGER;
	if (aExpiry !== bExpiry) {
		return aExpiry - bExpiry;
	}
	return a._creationTime - b._creationTime;
}

export async function spendCredit(
	ctx: MutationCtx,
	ownerUserId: Id<"users">,
	trialCycleId: Id<"trialCycles">,
	now: number,
): Promise<Doc<"hackathonCredits">> {
	const credits = await listSpendableCredits(ctx, ownerUserId, now);
	const credit = credits.sort(compareForSpending)[0];
	if (!credit) {
		throw new Error(NO_CREDIT_MESSAGE);
	}
	await ctx.db.patch(credit._id, {
		spentAt: now,
		spentOnTrialCycleId: trialCycleId,
	});
	return credit;
}
```

- [ ] **Step 6: Add the IP terms guard**

Create `convex/lib/hiring/ipTerms.ts`:

```ts
export const IP_TERMS_MESSAGE =
	"Accept the hackathon IP terms to continue";

/**
 * Founders (at publish) and contributors (at entry) both acknowledge that
 * contributors keep ownership of what they submit (design: IP of submissions).
 */
export function requireIpTerms(accepted: boolean): void {
	if (!accepted) {
		throw new Error(IP_TERMS_MESSAGE);
	}
}
```

- [ ] **Step 7: Add the publish lib**

Create `convex/lib/hiring/publish.ts`:

```ts
import { internal } from "../../_generated/api";
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { spendCredit } from "../billing/credits";
import { requireFounderMembership } from "../teams/membership";

export const NEW_DATES_MESSAGE =
	"This hackathon's start or application deadline has passed. Pick new dates, then publish.";

/**
 * Why a draft can't be published now, or null when it can. Checks run in the
 * eng review's C4 order; the Founder check is the caller's.
 */
export async function publishProblem(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
	now: number,
): Promise<string | null> {
	if (trial.status !== "draft") {
		return "Only a draft can be published";
	}
	const startup = await ctx.db.get(trial.startupId);
	if (!startup?.isPublic) {
		return "Turn off stealth mode before publishing a public hackathon";
	}
	const role = await ctx.db.get(trial.roleId);
	if (role?.status !== "open") {
		return "This Role is closed";
	}
	const entryClosesAt = trial.applicationDeadline ?? trial.startsAt;
	if (trial.startsAt <= now || entryClosesAt <= now) {
		return NEW_DATES_MESSAGE;
	}
	return null;
}

export async function requirePublishable(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
	userId: Id<"users">,
	now: number,
): Promise<void> {
	await requireFounderMembership(ctx, trial.startupId, userId);
	const problem = await publishProblem(ctx, trial, now);
	if (problem) {
		throw new Error(problem);
	}
}

/**
 * The charge point: spends one of the Founder's credits, opens the hackathon
 * and schedules its start. Run `requirePublishable` first.
 */
export async function publishDraft(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
	userId: Id<"users">,
	now: number,
): Promise<void> {
	const credit = await spendCredit(ctx, userId, trial._id, now);
	await ctx.db.patch(trial._id, {
		status: "open",
		publishedAt: now,
		publishedByUserId: userId,
		creditSource: credit.source,
	});
	await ctx.scheduler.runAt(
		trial.startsAt,
		internal.hiring.trialCycles.start,
		{ trialCycleId: trial._id },
	);
}
```

- [ ] **Step 8: Rework `convex/hiring/trialCycles.ts`**

1. Imports: remove `import { internal } from "../_generated/api";`, since `create` no longer schedules. Add `isTrialLive` to the `../lib/hiring/trialCycles` import. Add:

```ts
import { requireIpTerms } from "../lib/hiring/ipTerms";
import { publishDraft, requirePublishable } from "../lib/hiring/publish";
```

2. In `get`, right after `const membership = await getMembership(...)` and `const isMember = membership !== null;`, add the line below. Move the `isMember` line up so it comes before `getTrialApplication`.

```ts
		if (trial.status === "draft" && !isMember) {
			return null;
		}
```

3. In `create`: add `prize: v.optional(v.string()),` to `args`. In the insert, change `status: "open"` to `status: "draft"` and add `prize: optionalText(args.prize),`. Delete the `ctx.scheduler.runAt(...)` block. Add this doc comment above `export const create`:

```ts
/** Creates a draft. Nothing is public or scheduled until `publish`. */
```

4. After `create`, add:

```ts
/**
 * The charge point (design: Pricing rules). One mutation, so a double click
 * or a second tab can't spend twice (eng review C4).
 */
export const publish = mutation({
	args: { trialCycleId: v.id("trialCycles"), acceptTerms: v.boolean() },
	handler: async (ctx, args): Promise<void> => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}

		const now = Date.now();
		await requirePublishable(ctx, trial, userId, now);
		requireIpTerms(args.acceptTerms);
		await ctx.db.patch(trial._id, { ipAcknowledgedAt: now });
		await publishDraft(ctx, trial, userId, now);
	},
});

/** "Pick new dates": only a draft moves, because a published one has its start scheduled. */
export const reschedule = mutation({
	args: {
		trialCycleId: v.id("trialCycles"),
		startsAt: v.number(),
		endsAt: v.number(),
		applicationDeadline: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}

		await requireFounderMembership(ctx, trial.startupId, userId);
		if (trial.status !== "draft") {
			throw new Error("Only a draft's dates can change");
		}
		if (args.endsAt <= args.startsAt) {
			throw new Error("Trial Cycle end must be after start");
		}

		await ctx.db.patch(trial._id, {
			startsAt: args.startsAt,
			endsAt: args.endsAt,
			applicationDeadline: args.applicationDeadline,
		});
	},
});
```

5. In `cancel`, replace the status check with:

```ts
		if (trial.status !== "draft" && !isTrialLive(trial)) {
			throw new Error(
				"Only a draft, open or active Trial Cycle can be cancelled",
			);
		}
```

- [ ] **Step 9: Make entries, role filling and Explore draft-aware**

In `convex/lib/hiring/trialCycles.ts`, at the start of `requireAcceptingEntries`, add:

```ts
	if (trial.status === "draft") {
		throw new Error("This hackathon isn't published yet");
	}
```

In `convex/lib/hiring/offers.ts` `fillRoleIfFull`, change `if (trial.status === "open")` to `if (trial.status === "open" || trial.status === "draft")`.

In `convex/hiring/opportunities.ts`, add `prize: trial.prize ?? null,` to the pushed trial card, after `endsAt`.

- [ ] **Step 10: Regenerate types and run the hiring tests**

Run: `pnpm exec convex codegen && pnpm vitest run convex/hiring`
Expected: PASS. This includes every pre-existing test in `convex/hiring`, which is the R7 regression contract.

- [ ] **Step 11: Run the whole suite**

Run: `pnpm test`
Expected: PASS. `createTrial` still leaves an `open` Trial Cycle, so the plan-usage counts in `convex/teams/startups.test.ts` don't change.

- [ ] **Step 12: Typecheck, lint, commit**

Run: `pnpm check && pnpm exec tsc -p convex --noEmit`
Expected: exit 0.

```bash
git add convex/schema.ts convex/lib/billing/credits.ts convex/lib/hiring/ipTerms.ts convex/lib/hiring/publish.ts convex/hiring/trialCycles.ts convex/lib/hiring/trialCycles.ts convex/lib/hiring/offers.ts convex/hiring/opportunities.ts convex/test.helpers.ts convex/hiring/trialCycles.test.ts convex/_generated
git commit -m "feat(hiring): draft Trial Cycles and a one-credit publish gate"
```

---

### Task 3: Retire `liveTrialCycles` as a plan limit

**Files:**
- Modify: `convex/lib/limits.ts:26-51`
- Modify: `convex/lib/teams/plan.ts`
- Test: `convex/teams/startups.test.ts` (expectations near lines 292, 298, 352, 387)

**Interfaces:**
- Produces: `PlanLimits` = `{ capacity; openRoles; members; stealth }` and `StartupPlan.usage` = `{ openRoles; members; stealth }`. Nothing in `src/` reads `liveTrialCycles`; confirm with the grep in Step 4.

- [ ] **Step 1: Update the expectations first**

In `convex/teams/startups.test.ts`, delete every `liveTrialCycles: …,` line inside the `plan`, `limits` and `usage` objects: four lines, near 292, 298, 352 and 387.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run convex/teams/startups.test.ts`
Expected: FAIL. The received objects still contain `liveTrialCycles`.

- [ ] **Step 3: Remove the field**

In `convex/lib/limits.ts`: remove `liveTrialCycles: number | null;` from `PlanLimits`, and remove `liveTrialCycles` from both tiers of `PLAN_LIMITS`. Replace the `PLAN_LIMITS` doc comment with:

```ts
/** A Plan's limits (issue #19). Publishing hackathons is gated by credits, not
 * by the Plan (design: Founder Pro subscription). `null` means unlimited —
 * Convex values cannot encode `Infinity`. */
```

In `convex/lib/teams/plan.ts`: remove `liveTrialCycles` from `StartupPlan.usage`, delete the `openTrials` / `activeTrials` queries and the `liveTrialCycles` sum, and drop `liveTrialCycles` from the returned `usage`. Replace the `loadStartupPlan` doc comment with the one below (eng review C3):

```ts
/**
 * Display-only Plan for a Startup. Paid rights (the Pro tier and hackathon
 * credits) belong to the user, not the Startup (eng review R2): a Startup
 * shows as Pro when any Founder is Pro. Don't move credits onto Startups.
 */
```

- [ ] **Step 4: Run the tests and grep for leftovers**

Run: `pnpm vitest run convex/teams/startups.test.ts && grep -rn "liveTrialCycles" convex src --include=*.ts --include=*.tsx | grep -v _generated`
Expected: tests PASS, and the grep prints nothing.

- [ ] **Step 5: Typecheck, lint, commit**

Run: `pnpm check && pnpm exec tsc -p convex --noEmit`
Expected: exit 0.

```bash
git add convex/lib/limits.ts convex/lib/teams/plan.ts convex/teams/startups.test.ts
git commit -m "refactor(teams): hackathons are gated by credits, not plan limits"
```

---

### Task 4: Re-run credits

**Files:**
- Modify: `convex/lib/limits.ts`
- Modify: `convex/lib/billing/credits.ts` (add `grantCredit`)
- Modify: `convex/billing/credits.ts` (add `grantRerunCredit`)
- Test: `convex/billing/credits.test.ts`

**Interfaces:**
- Consumes: `createTrial`, `createDraftTrial`, `giveCredit`, `setUpStartup`, `balanceOf` (Tasks 1–2); `trialCycles.publishedByUserId`, `creditSource` (Task 2)
- Produces (lib): `grantCredit(ctx: MutationCtx, grant: { ownerUserId: Id<"users">; source: CreditSource; grantKey: string; expiresAt?: number }): Promise<Id<"hackathonCredits"> | null>` (`null` means the key was already used)
- Produces (API): `internal.billing.credits.grantRerunCredit({ trialCycleId })` → the credit id

- [ ] **Step 1: Add the limits**

Append to `convex/lib/limits.ts`:

```ts
/** A hackathon with fewer applications than this by its cutoff can earn a re-run. */
export const RERUN_MIN_APPLICATIONS = 3;
export const RERUN_CREDIT_TTL_MS = 60 * 24 * 60 * 60 * 1000;
```

- [ ] **Step 2: Write the failing tests**

Add `createDraftTrial`, `createTrial`, `giveCredit`, `HOUR` and `setUpStartup` to the imports of `convex/billing/credits.test.ts`, then append:

```ts
async function applyWith(
	t: Parameters<typeof signUp>[0],
	trialCycleId: Awaited<ReturnType<typeof createTrial>>,
	names: string[],
) {
	for (const name of names) {
		const person = await signUp(t, name);
		await person.as.mutation(api.hiring.applications.applyToTrial, {
			trialCycleId,
		});
	}
}

test("a hackathon with fewer than 3 applications earns its founder a re-run credit for 60 days", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, {
		admission: "application",
		startsInMs: DAY,
	});
	await applyWith(t, trialCycleId, ["Alice", "Bob"]);
	vi.advanceTimersByTime(DAY + HOUR);

	await t.mutation(internal.billing.credits.grantRerunCredit, {
		trialCycleId,
	});

	const { credits } = await setup.founder.as.query(
		api.billing.credits.balance,
		{},
	);
	expect(credits.map((credit) => credit.source)).toEqual(["rerun"]);
	vi.advanceTimersByTime(61 * DAY);
	expect(await balanceOf(setup.founder.as)).toBe(0);
});

test("a re-run credit waits until entry closes", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });

	await expect(
		t.mutation(internal.billing.credits.grantRerunCredit, { trialCycleId }),
	).rejects.toThrow("Entry is still open");
});

test("3 applications earn no re-run credit", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, {
		admission: "application",
		startsInMs: DAY,
	});
	await applyWith(t, trialCycleId, ["Alice", "Bob", "Cara"]);
	vi.advanceTimersByTime(DAY + HOUR);

	await expect(
		t.mutation(internal.billing.credits.grantRerunCredit, { trialCycleId }),
	).rejects.toThrow("3 or more applications");
});

test("a hackathon earns at most one re-run credit", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });
	vi.advanceTimersByTime(DAY + HOUR);
	await t.mutation(internal.billing.credits.grantRerunCredit, {
		trialCycleId,
	});

	await expect(
		t.mutation(internal.billing.credits.grantRerunCredit, { trialCycleId }),
	).rejects.toThrow("already got a re-run credit");
	expect(await balanceOf(setup.founder.as)).toBe(1);
});

test("a re-run can't earn another re-run credit", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup, { startsInMs: DAY });
	await giveCredit(t, setup.founder.userId, { source: "rerun" });
	await setup.founder.as.mutation(api.hiring.trialCycles.publish, {
		trialCycleId,
		acceptTerms: true,
	});
	vi.advanceTimersByTime(DAY + HOUR);

	await expect(
		t.mutation(internal.billing.credits.grantRerunCredit, { trialCycleId }),
	).rejects.toThrow("can't earn another");
});

test("a draft or an ungated hackathon earns no re-run credit", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup, { startsInMs: DAY });
	vi.advanceTimersByTime(DAY + HOUR);

	await expect(
		t.mutation(internal.billing.credits.grantRerunCredit, { trialCycleId }),
	).rejects.toThrow("published through the paid gate");
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `pnpm vitest run convex/billing/credits.test.ts`
Expected: the 6 new tests FAIL because `grantRerunCredit` is missing. The 5 Task 1 tests still pass.

- [ ] **Step 4: Add `grantCredit`**

Append to `convex/lib/billing/credits.ts`:

```ts
type CreditGrant = {
	ownerUserId: Id<"users">;
	source: CreditSource;
	grantKey: string;
	expiresAt?: number;
};

/**
 * Inserts the credit unless its grant key was used before, because webhooks
 * repeat (eng review R1, R4). Returns null for a repeat.
 */
export async function grantCredit(
	ctx: MutationCtx,
	grant: CreditGrant,
): Promise<Id<"hackathonCredits"> | null> {
	const existing = await ctx.db
		.query("hackathonCredits")
		.withIndex("by_grant_key", (q) => q.eq("grantKey", grant.grantKey))
		.first();
	if (existing) {
		return null;
	}
	return await ctx.db.insert("hackathonCredits", grant);
}
```

- [ ] **Step 5: Add `grantRerunCredit`**

In `convex/billing/credits.ts`, add `grantCredit` to the lib import and `RERUN_CREDIT_TTL_MS, RERUN_MIN_APPLICATIONS` to the limits import, then append:

```ts
/**
 * Engin grants this by hand, on request, when a published hackathon drew too
 * few applications (design: Refunds). Applications count, not joins, so
 * rejecting applicants can't produce one.
 */
export const grantRerunCredit = internalMutation({
	args: { trialCycleId: v.id("trialCycles") },
	handler: async (ctx, args) => {
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial?.publishedByUserId) {
			throw new Error(
				"Only a hackathon published through the paid gate can earn a re-run credit",
			);
		}
		if (trial.creditSource === "rerun") {
			throw new Error("A re-run can't earn another re-run credit");
		}
		const now = Date.now();
		if (now <= (trial.applicationDeadline ?? trial.startsAt)) {
			throw new Error("Entry is still open for this hackathon");
		}
		const applications = await ctx.db
			.query("applications")
			.withIndex("by_trial", (q) => q.eq("trialCycleId", trial._id))
			.take(RERUN_MIN_APPLICATIONS);
		if (applications.length >= RERUN_MIN_APPLICATIONS) {
			throw new Error(
				`This hackathon got ${RERUN_MIN_APPLICATIONS} or more applications`,
			);
		}

		const creditId = await grantCredit(ctx, {
			ownerUserId: trial.publishedByUserId,
			source: "rerun",
			grantKey: `rerun:${trial._id}`,
			expiresAt: now + RERUN_CREDIT_TTL_MS,
		});
		if (!creditId) {
			throw new Error("This hackathon already got a re-run credit");
		}
		return creditId;
	},
});
```

- [ ] **Step 6: Regenerate types and run the tests**

Run: `pnpm exec convex codegen && pnpm vitest run convex/billing/credits.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 7: Typecheck, lint, commit**

Run: `pnpm check && pnpm exec tsc -p convex --noEmit`
Expected: exit 0.

```bash
git add convex/lib/limits.ts convex/lib/billing/credits.ts convex/billing/credits.ts convex/billing/credits.test.ts convex/_generated
git commit -m "feat(billing): manual re-run credits with expiry and no chaining"
```

---

### Task 5: Dodo webhooks, monthly Pro credits and hackathon checkout

**Files:**
- Modify: `convex/schema.ts` (`users` gains `.index("by_plan_tier", ["planTier"])`)
- Modify: `convex/lib/limits.ts`
- Modify: `convex/lib/billing/credits.ts` (add `HACKATHON_PAYMENT_KIND`, `monthKey`, `grantMonthlyProCredit`, `expireProCredits`)
- Modify: `convex/billing/credits.ts` (add `grantMonthlyProCredits`)
- Create: `convex/billing/webhooks.ts`
- Create: `convex/billing/checkout.ts`
- Create: `convex/crons.ts`
- Modify: `convex/dodo.ts` (add `getHackathonProductId`)
- Modify: `convex/people/billing.ts` (INR; delete the now-unused `setPlanTier`)
- Modify: `convex/http.ts` (thin adapters)
- Test: `convex/billing/webhooks.test.ts`

**Interfaces:**
- Consumes: `grantCredit`, `listSpendableCredits` (Tasks 1, 4); `publishProblem`, `publishDraft`, `requirePublishable` (Task 2); `createDraftTrial`, `balanceOf`, `setUpStartup` (Tasks 1–2)
- Produces (lib): `HACKATHON_PAYMENT_KIND = "hackathon"`, `monthKey(now: number): string`, `grantMonthlyProCredit(ctx, userId, now): Promise<boolean>`, `expireProCredits(ctx, userId, at: number): Promise<void>`
- Produces (API): `internal.billing.webhooks.applySubscriptionEvent({ event: "active" | "renewed" | "on_hold" | "cancelled" | "failed" | "expired", subscriptionId: string, metadataUserId?: string, email?: string, nextBillingAt?: number })`; `internal.billing.webhooks.applyPaymentSucceeded({ paymentId: string, kind?: string, trialCycleId?: string, metadataUserId?: string, email?: string })`; `internal.billing.credits.grantMonthlyProCredits({})` → number granted; `internal.billing.checkout.prepareHackathonCheckout({ userId, trialCycleId })` → `{ email, name, planTier }`; `api.billing.checkout.createHackathonCheckout({ trialCycleId, returnUrl, acceptTerms })` → `{ checkoutUrl }`
- Produces (env): `DODO_HACKATHON_PRODUCT_ID` (₹2,999) and `DODO_HACKATHON_PRO_PRODUCT_ID` (₹1,499). `DODO_MONTHLY_PLAN_ID` and `DODO_YEARLY_PLAN_ID` must now point at the ₹999 and ₹9,999 INR products.

- [ ] **Step 1: Add the index and limits**

In `convex/schema.ts`, after `.index("by_username", ["username"])` on `users`, add `.index("by_plan_tier", ["planTier"])`.

Append to `convex/lib/limits.ts`:

```ts
/** Pro includes one hackathon credit a month; unused ones bank up to this. */
export const MAX_BANKED_PRO_CREDITS = 3;
/** Bound on the Pro users the daily credit job reads. */
export const MAX_PRO_USERS_SCAN = 500;
```

- [ ] **Step 2: Write the failing tests**

Create `convex/billing/webhooks.test.ts`:

```ts
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "../_generated/api";
import {
	balanceOf,
	createDraftTrial,
	createTest,
	DAY,
	notificationTitles,
	setUpStartup,
	signUp,
	type TestConvex,
} from "../test.helpers";

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date("2026-10-05T12:00:00Z"));
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

type SubscriptionEvent =
	| "active"
	| "renewed"
	| "on_hold"
	| "cancelled"
	| "failed"
	| "expired";

async function subscription(
	t: TestConvex,
	event: SubscriptionEvent,
	metadataUserId: string,
	extra: { email?: string; nextBillingAt?: number } = {},
) {
	await t.mutation(internal.billing.webhooks.applySubscriptionEvent, {
		event,
		subscriptionId: "sub_1",
		metadataUserId,
		...extra,
	});
}

async function paid(
	t: TestConvex,
	payment: { paymentId?: string; userId: string; trialCycleId?: string },
) {
	await t.mutation(internal.billing.webhooks.applyPaymentSucceeded, {
		paymentId: payment.paymentId ?? "pay_1",
		kind: "hackathon",
		trialCycleId: payment.trialCycleId,
		metadataUserId: payment.userId,
	});
}

async function creditRows(t: TestConvex) {
	return await t.run(
		async (ctx) => await ctx.db.query("hackathonCredits").collect(),
	);
}

test("Pro grants one credit a month, however often Dodo repeats itself", async () => {
	const t = createTest();
	const founder = await signUp(t, "Founder");

	await subscription(t, "active", founder.userId);
	await subscription(t, "renewed", founder.userId);
	await subscription(t, "renewed", founder.userId);

	expect(await balanceOf(founder.as)).toBe(1);
	expect(
		(await founder.as.query(api.people.billing.getPlan, {})).isPro,
	).toBe(true);
});

test("each new month adds a credit, up to 3 banked", async () => {
	const t = createTest();
	const founder = await signUp(t, "Founder");
	await subscription(t, "active", founder.userId);

	for (const month of ["2026-11-05", "2026-12-05", "2027-01-05"]) {
		vi.setSystemTime(new Date(`${month}T12:00:00Z`));
		await subscription(t, "renewed", founder.userId);
	}

	expect(await balanceOf(founder.as)).toBe(3);
});

test("cancelling Pro keeps banked credits until the period ends", async () => {
	const t = createTest();
	const founder = await signUp(t, "Founder");
	await subscription(t, "active", founder.userId);

	await subscription(t, "cancelled", founder.userId, {
		nextBillingAt: Date.now() + 10 * DAY,
	});

	expect(await balanceOf(founder.as)).toBe(1);
	vi.advanceTimersByTime(11 * DAY);
	expect(await balanceOf(founder.as)).toBe(0);
});

test("an expired subscription loses its credits at once", async () => {
	const t = createTest();
	const founder = await signUp(t, "Founder");
	await subscription(t, "active", founder.userId);

	await subscription(t, "expired", founder.userId);

	expect(await balanceOf(founder.as)).toBe(0);
	expect(
		(await founder.as.query(api.people.billing.getPlan, {})).isPro,
	).toBe(false);
});

test("the daily job grants every Pro user this month's credit once", async () => {
	const t = createTest();
	const pat = await signUp(t, "Pat", "pro");
	const fay = await signUp(t, "Fay");

	await t.mutation(internal.billing.credits.grantMonthlyProCredits, {});
	await t.mutation(internal.billing.credits.grantMonthlyProCredits, {});

	expect(await balanceOf(pat.as)).toBe(1);
	expect(await balanceOf(fay.as)).toBe(0);
});

test("a webhook that matches no user is logged, not thrown", async () => {
	const t = createTest();
	const logged = vi.spyOn(console, "error").mockImplementation(() => {});

	await subscription(t, "active", "not-a-user-id", {
		email: "nobody@example.com",
	});

	expect(logged).toHaveBeenCalledWith(
		expect.stringContaining("matched no user"),
	);
	expect(await creditRows(t)).toHaveLength(0);
});

test("a bad user id in metadata falls back to the customer email", async () => {
	const t = createTest();
	const founder = await signUp(t, "Founder");

	await subscription(t, "active", "garbage", {
		email: "founder@example.com",
	});

	expect(await balanceOf(founder.as)).toBe(1);
});

test("paying for a hackathon publishes its draft", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup);
	await t.mutation(internal.billing.checkout.prepareHackathonCheckout, {
		userId: setup.founder.userId,
		trialCycleId,
	});

	await paid(t, { userId: setup.founder.userId, trialCycleId });

	const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
		trialCycleId,
	});
	expect(trial?.status).toBe("open");
	expect(trial?.creditSource).toBe("purchase");
	expect(await balanceOf(setup.founder.as)).toBe(0);
	expect(await notificationTitles(setup.founder.as)).toContain(
		"Payment received. Build a feature is live",
	);
});

test("a repeated payment webhook grants one credit and publishes once", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup);
	await t.mutation(internal.billing.checkout.prepareHackathonCheckout, {
		userId: setup.founder.userId,
		trialCycleId,
	});

	await paid(t, { userId: setup.founder.userId, trialCycleId });
	await paid(t, { userId: setup.founder.userId, trialCycleId });

	expect(await creditRows(t)).toHaveLength(1);
	expect(await balanceOf(setup.founder.as)).toBe(0);
});

test("a payment after the dates passed keeps the credit and asks for new dates", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup, { startsInMs: DAY });
	await t.mutation(internal.billing.checkout.prepareHackathonCheckout, {
		userId: setup.founder.userId,
		trialCycleId,
	});
	vi.advanceTimersByTime(2 * DAY);

	await paid(t, { userId: setup.founder.userId, trialCycleId });

	const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
		trialCycleId,
	});
	expect(trial?.status).toBe("draft");
	expect(await balanceOf(setup.founder.as)).toBe(1);
	expect(await notificationTitles(setup.founder.as)).toContain(
		"Payment received. Build a feature is still a draft",
	);
});

test("a payment for a hackathon cancelled meanwhile stays as a credit", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup);
	await t.mutation(internal.billing.checkout.prepareHackathonCheckout, {
		userId: setup.founder.userId,
		trialCycleId,
	});
	await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
		trialCycleId,
	});

	await paid(t, { userId: setup.founder.userId, trialCycleId });

	const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
		trialCycleId,
	});
	expect(trial?.status).toBe("cancelled");
	expect(await balanceOf(setup.founder.as)).toBe(1);
});

test("subscription payments don't grant hackathon credits", async () => {
	const t = createTest();
	const founder = await signUp(t, "Founder");

	await t.mutation(internal.billing.webhooks.applyPaymentSucceeded, {
		paymentId: "pay_sub",
		metadataUserId: founder.userId,
	});

	expect(await balanceOf(founder.as)).toBe(0);
});

test("preparing a checkout runs the publish checks and records the IP acknowledgment", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createDraftTrial(setup);

	const payer = await t.mutation(
		internal.billing.checkout.prepareHackathonCheckout,
		{ userId: setup.founder.userId, trialCycleId },
	);

	expect(payer.planTier).toBe("free");
	const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
		trialCycleId,
	});
	expect(trial?.ipAcknowledgedAt).toBeDefined();

	await setup.founder.as.mutation(api.teams.startups.update, {
		startupId: setup.startupId,
		isPublic: false,
	});
	await expect(
		t.mutation(internal.billing.checkout.prepareHackathonCheckout, {
			userId: setup.founder.userId,
			trialCycleId,
		}),
	).rejects.toThrow("Turn off stealth mode");
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `pnpm vitest run convex/billing/webhooks.test.ts`
Expected: FAIL. `internal.billing.webhooks` doesn't exist.

- [ ] **Step 4: Add the monthly-grant and expiry helpers**

In `convex/lib/billing/credits.ts`, add `MAX_BANKED_PRO_CREDITS` to the limits import and append:

```ts
/** Marks a one-time Dodo payment as a hackathon purchase (checkout metadata `kind`). */
export const HACKATHON_PAYMENT_KIND = "hackathon";

/** UTC calendar month, e.g. "2026-10". */
export function monthKey(now: number): string {
	return new Date(now).toISOString().slice(0, 7);
}

/**
 * This month's Pro credit, once per user per month, while fewer than 3 are
 * banked. Keyed by user and month so yearly plans get monthly credits too.
 */
export async function grantMonthlyProCredit(
	ctx: MutationCtx,
	userId: Id<"users">,
	now: number,
): Promise<boolean> {
	const banked = (await listSpendableCredits(ctx, userId, now)).filter(
		(credit) => credit.source === "pro_monthly",
	);
	if (banked.length >= MAX_BANKED_PRO_CREDITS) {
		return false;
	}
	const creditId = await grantCredit(ctx, {
		ownerUserId: userId,
		source: "pro_monthly",
		grantKey: `pro_monthly:${userId}:${monthKey(now)}`,
	});
	return creditId !== null;
}

/** Banked Pro credits stay usable until `at`, then lapse (eng review C5). */
export async function expireProCredits(
	ctx: MutationCtx,
	userId: Id<"users">,
	at: number,
): Promise<void> {
	for (const credit of await listSpendableCredits(ctx, userId, Date.now())) {
		if (
			credit.source === "pro_monthly" &&
			(credit.expiresAt === undefined || credit.expiresAt > at)
		) {
			await ctx.db.patch(credit._id, { expiresAt: at });
		}
	}
}
```

- [ ] **Step 5: Add the daily grant and the cron**

In `convex/billing/credits.ts`, add `grantMonthlyProCredit` to the lib import and `MAX_PRO_USERS_SCAN` to the limits import, then append:

```ts
/** Daily (convex/crons.ts): every Pro user gets this month's credit, once. */
export const grantMonthlyProCredits = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const proUsers = await ctx.db
			.query("users")
			.withIndex("by_plan_tier", (q) => q.eq("planTier", "pro"))
			.take(MAX_PRO_USERS_SCAN);

		let granted = 0;
		for (const user of proUsers) {
			if (await grantMonthlyProCredit(ctx, user._id, now)) {
				granted += 1;
			}
		}
		return granted;
	},
});
```

Create `convex/crons.ts`:

```ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
	"grant monthly Pro hackathon credits",
	{ hourUTC: 0, minuteUTC: 10 },
	internal.billing.credits.grantMonthlyProCredits,
	{},
);

export default crons;
```

- [ ] **Step 6: Add the webhook mutations**

Create `convex/billing/webhooks.ts`:

```ts
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { internalMutation, type MutationCtx } from "../_generated/server";
import {
	expireProCredits,
	grantCredit,
	grantMonthlyProCredit,
	HACKATHON_PAYMENT_KIND,
} from "../lib/billing/credits";
import { IP_TERMS_MESSAGE } from "../lib/hiring/ipTerms";
import { publishDraft, publishProblem } from "../lib/hiring/publish";
import { trialCycleHref } from "../lib/links";
import { notify } from "../lib/notify";
import { getMembership } from "../lib/teams/membership";

export const subscriptionEvent = v.union(
	v.literal("active"),
	v.literal("renewed"),
	v.literal("on_hold"),
	v.literal("cancelled"),
	v.literal("failed"),
	v.literal("expired"),
);

/**
 * The checkout's `userId` metadata, else the customer email. With neither,
 * log and give up (eng review R6): someone fixes it by hand from the logs.
 */
async function resolveWebhookUser(
	ctx: MutationCtx,
	input: {
		event: string;
		reference: string;
		metadataUserId?: string;
		email?: string;
	},
): Promise<Id<"users"> | null> {
	const fromMetadata = input.metadataUserId
		? ctx.db.normalizeId("users", input.metadataUserId)
		: null;
	if (fromMetadata && (await ctx.db.get(fromMetadata))) {
		return fromMetadata;
	}
	if (input.email) {
		const user = await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", input.email))
			.first();
		if (user) {
			return user._id;
		}
	}
	console.error(
		`Dodo webhook ${input.event} (${input.reference}) matched no user; customer email: ${input.email ?? "none"}`,
	);
	return null;
}

export const applySubscriptionEvent = internalMutation({
	args: {
		event: subscriptionEvent,
		subscriptionId: v.string(),
		metadataUserId: v.optional(v.string()),
		email: v.optional(v.string()),
		nextBillingAt: v.optional(v.number()),
	},
	handler: async (ctx, args): Promise<void> => {
		const userId = await resolveWebhookUser(ctx, {
			event: `subscription.${args.event}`,
			reference: args.subscriptionId,
			metadataUserId: args.metadataUserId,
			email: args.email,
		});
		if (!userId) {
			return;
		}

		const now = Date.now();
		if (args.event === "active" || args.event === "renewed") {
			await ctx.db.patch(userId, { planTier: "pro" });
			await grantMonthlyProCredit(ctx, userId, now);
			return;
		}

		await ctx.db.patch(userId, { planTier: "free" });
		if (args.event === "cancelled") {
			await expireProCredits(ctx, userId, args.nextBillingAt ?? now);
		} else if (args.event === "expired") {
			await expireProCredits(ctx, userId, now);
		}
	},
});

/** Why a paid-for draft can't go live, or null (eng review R4). */
async function paidPublishProblem(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
	userId: Id<"users">,
	now: number,
): Promise<string | null> {
	const membership = await getMembership(ctx, trial.startupId, userId);
	if (membership?.role !== "founder") {
		return "You're no longer a founder of this startup.";
	}
	if (trial.ipAcknowledgedAt === undefined) {
		return IP_TERMS_MESSAGE;
	}
	return await publishProblem(ctx, trial, now);
}

/**
 * A one-time hackathon payment: grant a purchase credit keyed by payment,
 * then publish the draft named in the checkout if it still can. Otherwise
 * the credit waits in the balance (eng review R4).
 */
export const applyPaymentSucceeded = internalMutation({
	args: {
		paymentId: v.string(),
		kind: v.optional(v.string()),
		trialCycleId: v.optional(v.string()),
		metadataUserId: v.optional(v.string()),
		email: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<void> => {
		// Subscription renewals are payments too; subscription events handle those.
		if (args.kind !== HACKATHON_PAYMENT_KIND) {
			return;
		}
		const userId = await resolveWebhookUser(ctx, {
			event: "payment.succeeded",
			reference: args.paymentId,
			metadataUserId: args.metadataUserId,
			email: args.email,
		});
		if (!userId) {
			return;
		}

		const creditId = await grantCredit(ctx, {
			ownerUserId: userId,
			source: "purchase",
			grantKey: `purchase:${args.paymentId}`,
		});
		if (!creditId) {
			return;
		}

		const trialCycleId = args.trialCycleId
			? ctx.db.normalizeId("trialCycles", args.trialCycleId)
			: null;
		const trial = trialCycleId ? await ctx.db.get(trialCycleId) : null;
		if (!trial) {
			return;
		}

		const now = Date.now();
		const problem = await paidPublishProblem(ctx, trial, userId, now);
		const href = await trialCycleHref(ctx, trial);
		if (problem) {
			await notify(ctx, {
				userId,
				kind: "billing",
				title: `Payment received. ${trial.title} is still a draft`,
				body: `${problem} Your hackathon credit is in your balance.`,
				href,
			});
			return;
		}

		await publishDraft(ctx, trial, userId, now);
		await notify(ctx, {
			userId,
			kind: "billing",
			title: `Payment received. ${trial.title} is live`,
			href,
		});
	},
});
```

- [ ] **Step 7: Add hackathon checkout and INR**

In `convex/dodo.ts`, append:

```ts
/** ₹2,999 on Free, ₹1,499 on Pro (design: Pricing). */
export function getHackathonProductId(planTier: "free" | "pro"): string {
	const productId =
		planTier === "pro"
			? process.env.DODO_HACKATHON_PRO_PRODUCT_ID
			: process.env.DODO_HACKATHON_PRODUCT_ID;

	if (!productId) {
		throw new Error(
			planTier === "pro"
				? "DODO_HACKATHON_PRO_PRODUCT_ID is not configured"
				: "DODO_HACKATHON_PRODUCT_ID is not configured",
		);
	}

	return productId;
}
```

Create `convex/billing/checkout.ts`:

```ts
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action, internalMutation } from "../_generated/server";
import { checkout, getHackathonProductId } from "../dodo";
import { HACKATHON_PAYMENT_KIND } from "../lib/billing/credits";
import { requireIpTerms } from "../lib/hiring/ipTerms";
import { requirePublishable } from "../lib/hiring/publish";

/**
 * Runs the publish checks before taking money, and records the Founder's IP
 * acknowledgment so the webhook can publish once the payment lands.
 */
export const prepareHackathonCheckout = internalMutation({
	args: { userId: v.id("users"), trialCycleId: v.id("trialCycles") },
	handler: async (
		ctx,
		args,
	): Promise<{ email: string; name: string; planTier: "free" | "pro" }> => {
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}
		const now = Date.now();
		await requirePublishable(ctx, trial, args.userId, now);

		const user = await ctx.db.get(args.userId);
		if (!user?.email) {
			throw new Error("Add an email to your account before paying");
		}
		await ctx.db.patch(trial._id, { ipAcknowledgedAt: now });

		return {
			email: user.email,
			name: user.name ?? user.email,
			planTier: user.planTier ?? "free",
		};
	},
});

export const createHackathonCheckout = action({
	args: {
		trialCycleId: v.id("trialCycles"),
		returnUrl: v.string(),
		acceptTerms: v.boolean(),
	},
	handler: async (ctx, args): Promise<{ checkoutUrl: string }> => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}
		requireIpTerms(args.acceptTerms);

		const payer = await ctx.runMutation(
			internal.billing.checkout.prepareHackathonCheckout,
			{ userId, trialCycleId: args.trialCycleId },
		);
		const session = await checkout(ctx, {
			payload: {
				product_cart: [
					{ product_id: getHackathonProductId(payer.planTier), quantity: 1 },
				],
				customer: { email: payer.email, name: payer.name },
				return_url: args.returnUrl,
				billing_currency: "INR",
				metadata: {
					userId,
					kind: HACKATHON_PAYMENT_KIND,
					trialCycleId: args.trialCycleId,
				},
			},
		});

		if (!session?.checkout_url) {
			throw new Error("Checkout session did not return a checkout_url");
		}
		return { checkoutUrl: session.checkout_url };
	},
});
```

In `convex/people/billing.ts`: change `billing_currency: "USD"` to `billing_currency: "INR"`. Delete `setPlanTier`, since subscription webhooks now patch `planTier` in `applySubscriptionEvent`, and remove `internalMutation` from the imports.

- [ ] **Step 8: Make `http.ts` a thin adapter**

Replace everything below `auth.addHttpRoutes(http);` in `convex/http.ts` with the code below. Replace the imports with the `createDodoWebhookHandler`, `GenericActionCtx`/`GenericDataModel`, `httpRouter`, `Infer`, `internal`, `auth` and `subscriptionEvent` type imports it uses. The `Id` import is no longer needed.

```ts
type WebhookCtx = GenericActionCtx<GenericDataModel>;
type Metadata = Record<string, unknown> | undefined;
type SubscriptionPayload = {
	data: {
		subscription_id: string;
		customer?: { email?: string };
		metadata?: Record<string, unknown>;
		next_billing_date?: Date | string;
	};
};

function metadataString(metadata: Metadata, key: string): string | undefined {
	const value = metadata?.[key];
	return typeof value === "string" ? value : undefined;
}

/** Dodo parses dates into `Date`s; accept an ISO string as well. */
function toMillis(value: Date | string | undefined): number | undefined {
	return value === undefined ? undefined : new Date(value).getTime();
}

function onSubscription(event: Infer<typeof subscriptionEvent>) {
	return async (ctx: WebhookCtx, payload: SubscriptionPayload) => {
		await ctx.runMutation(internal.billing.webhooks.applySubscriptionEvent, {
			event,
			subscriptionId: payload.data.subscription_id,
			metadataUserId: metadataString(payload.data.metadata, "userId"),
			email: payload.data.customer?.email,
			nextBillingAt: toMillis(payload.data.next_billing_date),
		});
	};
}

http.route({
	path: "/dodopayments-webhook",
	method: "POST",
	handler: createDodoWebhookHandler({
		onPaymentSucceeded: async (ctx, payload) => {
			const metadata: Metadata = payload.data.metadata;
			await ctx.runMutation(internal.billing.webhooks.applyPaymentSucceeded, {
				paymentId: payload.data.payment_id,
				kind: metadataString(metadata, "kind"),
				trialCycleId: metadataString(metadata, "trialCycleId"),
				metadataUserId: metadataString(metadata, "userId"),
				email: payload.data.customer?.email,
			});
		},
		onSubscriptionActive: onSubscription("active"),
		onSubscriptionRenewed: onSubscription("renewed"),
		onSubscriptionOnHold: onSubscription("on_hold"),
		onSubscriptionCancelled: onSubscription("cancelled"),
		onSubscriptionFailed: onSubscription("failed"),
		onSubscriptionExpired: onSubscription("expired"),
	}),
});

export default http;
```

- [ ] **Step 9: Regenerate types and run the tests**

Run: `pnpm exec convex codegen && pnpm vitest run convex/billing`
Expected: PASS, 13 webhook tests and 11 credits tests.

- [ ] **Step 10: Typecheck the adapter**

Run: `pnpm check && pnpm exec tsc -p convex --noEmit`
Expected: exit 0. If `tsc` rejects an `onSubscription(...)` handler as not assignable, loosen `SubscriptionPayload` to match Dodo's payload types (`WebhookPayload` from `@dodopayments/convex`), rather than casting at the call site.

- [ ] **Step 11: Commit**

```bash
git add convex/schema.ts convex/lib/limits.ts convex/lib/billing/credits.ts convex/billing convex/crons.ts convex/dodo.ts convex/people/billing.ts convex/http.ts convex/_generated
git commit -m "feat(billing): Pro monthly credits, hackathon checkout and idempotent Dodo webhooks"
```

---

### Task 6: Entry rules: IP acknowledgment, no self-entry, 5 live entries

**Files:**
- Modify: `convex/schema.ts` (`applications` gains `ipAcknowledgedAt`)
- Modify: `convex/lib/limits.ts:13-16`
- Modify: `convex/lib/hiring/entries.ts`
- Modify: `convex/hiring/applications.ts` (`applyToTrial`, `joinTrial`)
- Modify: every `convex/**/*.test.ts` that calls `joinTrial` / `applyToTrial` (mechanical)
- Modify: `src/features/hiring/trialCycles/constants.ts`, `src/features/hiring/opportunities/components/ApplyButtons.tsx`, `src/features/hiring/trialCycles/components/ParticipantTrialActions.tsx`
- Test: `convex/hiring/applications.test.ts`

**Interfaces:**
- Consumes: `requireIpTerms` (Task 2); `getMembership` (`convex/lib/teams/membership.ts`)
- Produces (API): `applyToTrial({ trialCycleId, message?, acceptTerms: boolean })` and `joinTrial({ trialCycleId, acceptTerms: boolean })`; `MAX_LIVE_ENTRIES = 5`
- Produces (frontend): `CONTRIBUTOR_IP_TERMS: string`, `confirmIpTerms(): boolean` in `src/features/hiring/trialCycles/constants.ts`

- [ ] **Step 1: Add `acceptTerms: true` to every existing entry call (mechanical)**

Run:

```bash
perl -0pi -e 's/(api\.hiring\.applications\.(?:joinTrial|applyToTrial),\s*\{)/$1 acceptTerms: true,/g' $(grep -rlE "applications\.(joinTrial|applyToTrial)" convex --include=*.ts)
pnpm format
grep -rnE "applications\.(joinTrial|applyToTrial)" convex --include=*.ts -A2 | grep -c "acceptTerms"
```

Expected: the final count equals the number of call sites. Compare it with `grep -rcE "applications\.(joinTrial|applyToTrial)," convex --include=*.ts`. The substitution also covers `startedTrialWith` in `convex/test.helpers.ts`.

- [ ] **Step 2: Replace the cap tests and add the new rules**

In `convex/hiring/applications.test.ts`, add `joinAsMember` to the imports. Delete the tests `"a free person can hold 3 live entries, and cancelled Trial Cycles free a slot"` and `"a pro person has no entry limit"`, then append:

```ts
test("a person can hold 5 live entries, and a cancelled Trial Cycle frees a slot", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trials = [];
	for (let index = 0; index < 6; index += 1) {
		trials.push(await createTrial(setup));
	}
	const alice = await signUp(t, "Alice");
	for (const trialCycleId of trials.slice(0, 5)) {
		await alice.as.mutation(api.hiring.applications.joinTrial, {
			trialCycleId,
			acceptTerms: true,
		});
	}

	await expect(
		alice.as.mutation(api.hiring.applications.joinTrial, {
			trialCycleId: trials[5],
			acceptTerms: true,
		}),
	).rejects.toThrow(
		"You're in 5 hackathons already. Finish or withdraw from one to join another.",
	);

	await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
		trialCycleId: trials[0],
	});
	await alice.as.mutation(api.hiring.applications.joinTrial, {
		trialCycleId: trials[5],
		acceptTerms: true,
	});
});

test("Pro gives no extra entries", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice", "pro");
	for (let index = 0; index < 5; index += 1) {
		await alice.as.mutation(api.hiring.applications.joinTrial, {
			trialCycleId: await createTrial(setup),
			acceptTerms: true,
		});
	}

	await expect(
		alice.as.mutation(api.hiring.applications.joinTrial, {
			trialCycleId: await createTrial(setup),
			acceptTerms: true,
		}),
	).rejects.toThrow("You're in 5 hackathons already");
});

test("a startup's own Founders and Members can't enter its hackathon", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const openTrial = await createTrial(setup);
	const applicationTrial = await createTrial(setup, {
		admission: "application",
	});
	const member = await joinAsMember(t, setup, "Mia");

	await expect(
		setup.founder.as.mutation(api.hiring.applications.joinTrial, {
			trialCycleId: openTrial,
			acceptTerms: true,
		}),
	).rejects.toThrow("on this startup's team");
	await expect(
		member.as.mutation(api.hiring.applications.applyToTrial, {
			trialCycleId: applicationTrial,
			acceptTerms: true,
		}),
	).rejects.toThrow("on this startup's team");
});

test("entering requires the IP acknowledgment, and records when it was given", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup);
	const alice = await signUp(t, "Alice");

	await expect(
		alice.as.mutation(api.hiring.applications.joinTrial, {
			trialCycleId,
			acceptTerms: false,
		}),
	).rejects.toThrow("IP terms");

	await alice.as.mutation(api.hiring.applications.joinTrial, {
		trialCycleId,
		acceptTerms: true,
	});
	const application = await t.run(
		async (ctx) =>
			await ctx.db
				.query("applications")
				.withIndex("by_trial_and_user", (q) =>
					q.eq("trialCycleId", trialCycleId).eq("userId", alice.userId),
				)
				.unique(),
	);
	expect(application?.ipAcknowledgedAt).toBeDefined();
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `pnpm vitest run convex/hiring/applications.test.ts`
Expected: FAIL. The `acceptTerms` argument is rejected by the validator, which reports an extra field, so every entry call fails.

- [ ] **Step 4: Change the limits and schema**

In `convex/lib/limits.ts`, replace `FREE_ACTIVE_TRIAL_APPLICATIONS` and the `LIVE_ENTRY_STATUSES` comment with:

```ts
/** Live entries one person can hold across hackathons; Pro doesn't raise it. */
export const MAX_LIVE_ENTRIES = 5;

/** Applications that hold one of a person's live-entry slots. */
export const LIVE_ENTRY_STATUSES = ["applied", "joined"] as const;
```

In `convex/schema.ts` `applications`, after `evaluationPublic`, add:

```ts
		/** When the entrant acknowledged the hackathon IP terms. */
		ipAcknowledgedAt: v.optional(v.number()),
```

- [ ] **Step 5: Rewrite `requireCanEnter`**

In `convex/lib/hiring/entries.ts`: drop the `isProUser` import, import `MAX_LIVE_ENTRIES` instead of `FREE_ACTIVE_TRIAL_APPLICATIONS`, add `import { getMembership } from "../teams/membership";`, and replace `requireCanEnter` with:

```ts
/**
 * Nobody enters their own startup's hackathon (Score integrity, eng review
 * R3), everyone gets one attempt per Trial Cycle, and nobody holds more than
 * 5 live entries.
 */
export async function requireCanEnter(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
	userId: Id<"users">,
): Promise<void> {
	if (await getMembership(ctx, trial.startupId, userId)) {
		throw new Error(
			"You're on this startup's team, so you can't enter its hackathon",
		);
	}
	if (await getTrialApplication(ctx, trial._id, userId)) {
		throw new Error(
			"You get one attempt per Trial Cycle. Look for a later one for this Role.",
		);
	}
	if ((await countLiveEntries(ctx, userId)) >= MAX_LIVE_ENTRIES) {
		throw new Error(
			`You're in ${MAX_LIVE_ENTRIES} hackathons already. Finish or withdraw from one to join another.`,
		);
	}
}
```

- [ ] **Step 6: Require and store the acknowledgment on entry**

In `convex/hiring/applications.ts`, add `import { requireIpTerms } from "../lib/hiring/ipTerms";`. Then:
- Add `acceptTerms: v.boolean(),` to the `args` of both `applyToTrial` and `joinTrial`.
- In both handlers, call `requireIpTerms(args.acceptTerms);` right before `await requireCanEnter(ctx, trial, userId);`.
- In both `ctx.db.insert("applications", { … })` calls, add `ipAcknowledgedAt: Date.now(),`.

- [ ] **Step 7: Run the backend tests**

Run: `pnpm exec convex codegen && pnpm test`
Expected: PASS, the whole suite.

- [ ] **Step 8: Update the two frontend entry buttons**

Append to `src/features/hiring/trialCycles/constants.ts`:

```ts
/** What a contributor agrees to on entry (design: IP of submissions). */
export const CONTRIBUTOR_IP_TERMS =
	"You keep ownership of what you submit. The startup may use your work only if you accept their Offer, or if they pay you for it separately.";

export function confirmIpTerms(): boolean {
	return window.confirm(CONTRIBUTOR_IP_TERMS);
}
```

In `src/features/hiring/opportunities/components/ApplyButtons.tsx`, import `confirmIpTerms` next to `askForMessage`. In both buttons, start the `onClick` with `if (!confirmIpTerms()) { return; }`, and pass `acceptTerms: true` in the `joinTrial({ trialCycleId, acceptTerms: true })` and `applyToTrial({ trialCycleId, message: askForMessage(), acceptTerms: true })` calls.

In `src/features/hiring/trialCycles/components/ParticipantTrialActions.tsx`, do the same. Import `confirmIpTerms`, return early from the join/apply `onClick` when it's false, and pass `acceptTerms: true` to both mutations.

- [ ] **Step 9: Typecheck, lint, commit**

Run: `pnpm check && pnpm exec tsc -p convex --noEmit`
Expected: exit 0.

```bash
git add convex src/features/hiring
git commit -m "feat(hiring): IP acknowledgment, no self-entry, 5 live entries without Pro bypass"
```

---

### Task 7: Score integrity and verdicts on the public profile

**Files:**
- Modify: `convex/schema.ts` (`applications` gains `scoreExcluded`)
- Modify: `convex/lib/hiring/verdicts.ts:60-86`
- Modify: `convex/lib/reputation/score.ts:41-66`
- Modify: `convex/lib/reputation/trialHistory.ts`
- Modify: `convex/people/users.ts:135-153` (`getByUsername` returns `verdicts`)
- Test: `convex/hiring/verdicts.test.ts`

**Interfaces:**
- Consumes: `getMembership`, `isPassed` (existing)
- Produces: `applications.scoreExcluded?: boolean`; `api.people.users.getByUsername` result gains `verdicts: { _id; trialTitle: string; startupName: string; startupSlug: string | null; verdict: "passed" | "passed_with_offer" }[]`

- [ ] **Step 1: Write the failing tests**

In `convex/hiring/verdicts.test.ts`, add `closeWithVerdict` and `type TestConvex` to the `../test.helpers` imports, then append:

```ts
async function joinTeamMidTrial(
	t: TestConvex,
	setup: Awaited<ReturnType<typeof setUpStartup>>,
	userId: Awaited<ReturnType<typeof signUp>>["userId"],
) {
	await t.run(async (ctx) => {
		await ctx.db.insert("memberships", {
			startupId: setup.startupId,
			userId,
			role: "member",
		});
	});
}

test("someone who joins the team mid-trial gets their Verdict but no Score", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(t, setup, [alice]);
	await joinTeamMidTrial(t, setup, alice.userId);

	await closeWithVerdict(t, setup, trialCycleId, alice, "passed");

	const trial = await alice.as.query(api.hiring.trialCycles.get, {
		trialCycleId,
	});
	expect(trial?.myVerdict).toBe("passed");
	expect(await scoreOf(t, alice.userId)).toBe(0);
});

test("an Offer accepted by someone already on the team earns no Score", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(t, setup, [alice]);
	await joinTeamMidTrial(t, setup, alice.userId);
	await closeWithVerdict(t, setup, trialCycleId, alice, "passed_with_offer");

	const [offer] = await alice.as.query(api.hiring.offers.listMine, {});
	await alice.as.mutation(api.hiring.offers.accept, {
		offerId: offer?._id as NonNullable<typeof offer>["_id"],
	});

	expect(await scoreOf(t, alice.userId)).toBe(0);
});

test("a passed Verdict shows on the profile with the startup that issued it", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(t, setup, [alice]);

	await closeWithVerdict(t, setup, trialCycleId, alice, "passed");

	const profile = await t.query(api.people.users.getByUsername, {
		username: "alice",
	});
	expect(
		profile?.verdicts.map(({ startupName, verdict }) => ({
			startupName,
			verdict,
		})),
	).toEqual([{ startupName: "Acme", verdict: "passed" }]);
});

test("Verdicts that earn no Score aren't listed on the profile", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	const trialCycleId = await startedTrialWith(t, setup, [alice, bob]);
	await joinTeamMidTrial(t, setup, bob.userId);

	await setup.founder.as.mutation(api.hiring.trialCycles.close, {
		trialCycleId,
		verdicts: [
			{
				applicationId: await applicationIdOf(t, trialCycleId, alice.userId),
				verdict: "not_passed",
			},
			{
				applicationId: await applicationIdOf(t, trialCycleId, bob.userId),
				verdict: "passed",
			},
		],
	});

	for (const username of ["alice", "bob"]) {
		const profile = await t.query(api.people.users.getByUsername, {
			username,
		});
		expect(profile?.verdicts).toEqual([]);
	}
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run convex/hiring/verdicts.test.ts`
Expected: FAIL. The mid-trial tests get Score 80 instead of 0, and `profile.verdicts` is `undefined`.

- [ ] **Step 3: Add the field and mark excluded verdicts at close**

In `convex/schema.ts` `applications`, after `ipAcknowledgedAt`, add:

```ts
		/** A Verdict that earns no Score: the person was on the Startup's team at close (eng review R3). */
		scoreExcluded: v.optional(v.boolean()),
```

In `convex/lib/hiring/verdicts.ts`, add `import { getMembership } from "../teams/membership";`. In the participant loop, replace the `ctx.db.patch(participant._id, { … })` call with:

```ts
		// Score integrity: someone who joined the team mid-trial keeps the
		// Verdict but earns no Score from it (eng review R3).
		const isOnTeam =
			(await getMembership(ctx, trial.startupId, participant.userId)) !== null;
		await ctx.db.patch(participant._id, {
			status: "completed",
			verdict: entry.verdict,
			evaluation: optionalText(entry.evaluation),
			...(isOnTeam ? { scoreExcluded: true } : {}),
		});
```

- [ ] **Step 4: Leave excluded verdicts and their Offers out of the Score**

In `convex/lib/reputation/score.ts` `loadScoreEvidence`, change the `trialCyclesPassed` filter to:

```ts
	const trialCyclesPassed = applications.filter(
		(application) =>
			application.status === "completed" &&
			isPassed(application.verdict) &&
			!application.scoreExcluded,
	).length;
```

Replace the use of `acceptedOffers.length` with a count that skips Offers from excluded applications:

```ts
	let teamConversions = 0;
	for (const offer of acceptedOffers) {
		const application = await ctx.db.get(offer.applicationId);
		if (!application?.scoreExcluded) {
			teamConversions += 1;
		}
	}
```

In `signals`, use `teamConversions` instead of `acceptedOffers.length`.

- [ ] **Step 5: List Score-earning verdicts with the issuing startup**

Replace `loadTrialHistory` in `convex/lib/reputation/trialHistory.ts` with:

```ts
import type { Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import { isPassed } from "../hiring/trialCycles";
import { MAX_USER_APPLICATIONS } from "../limits";

/**
 * Public Trial Cycle history: Score-earning Verdicts with the Startup that
 * issued them, Evaluations the person chose to show, and Leaving.
 */
export async function loadTrialHistory(ctx: QueryCtx, userId: Id<"users">) {
	const applications = await ctx.db
		.query("applications")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(MAX_USER_APPLICATIONS);

	const verdicts = [];
	const evaluations = [];
	const trialCyclesLeft = [];
	for (const application of applications) {
		const isScoredVerdict =
			application.status === "completed" &&
			isPassed(application.verdict) &&
			!application.scoreExcluded;
		const isShownEvaluation =
			application.evaluationPublic && application.evaluation;
		if (
			!isScoredVerdict &&
			!isShownEvaluation &&
			application.status !== "left"
		) {
			continue;
		}
		const trial = await ctx.db.get(application.trialCycleId);
		const startup = await ctx.db.get(application.startupId);
		const context = {
			trialTitle: trial?.title ?? "Trial Cycle",
			startupName: startup?.name ?? "Startup",
		};
		if (
			isScoredVerdict &&
			(application.verdict === "passed" ||
				application.verdict === "passed_with_offer")
		) {
			verdicts.push({
				...context,
				_id: application._id,
				startupSlug: startup?.isPublic ? startup.slug : null,
				verdict: application.verdict,
			});
		}
		if (isShownEvaluation && application.evaluation) {
			evaluations.push({
				...context,
				_id: application._id,
				verdict: application.verdict ?? null,
				evaluation: application.evaluation,
			});
		}
		if (application.status === "left") {
			trialCyclesLeft.push({ ...context, _id: application._id });
		}
	}

	return { verdicts, evaluations, trialCyclesLeft };
}
```

In `convex/people/users.ts` `getByUsername`, destructure `verdicts` from `loadTrialHistory`, and return it next to `evaluations`.

- [ ] **Step 6: Run the tests**

Run: `pnpm exec convex codegen && pnpm test`
Expected: PASS, the whole suite.

- [ ] **Step 7: Typecheck, lint, commit**

Run: `pnpm check && pnpm exec tsc -p convex --noEmit`
Expected: exit 0.

```bash
git add convex/schema.ts convex/lib/hiring/verdicts.ts convex/lib/reputation convex/people/users.ts convex/hiring/verdicts.test.ts convex/_generated
git commit -m "feat(reputation): no Score from own-team verdicts; profile shows issuing startup"
```

---

### Task 8: Final verification and operator notes

**Files:**
- Modify (local only, gitignored): `CLAUDE.md`

- [ ] **Step 1: Full verification**

Run: `pnpm check && pnpm exec tsc -p convex --noEmit && pnpm test`
Expected: exit 0 from all three, with no failing or skipped tests.

- [ ] **Step 2: Test-plan coverage check**

Go through every line in the Key Interactions and Edge Cases sections of `docs/designs/engin-hiring-hackathon-test-plan.md`, and name the test that covers it. The only lines without a backend test should be UI lines: the Explore page rendering and the "pick new dates" prompt. Those belong to the frontend plan.

- [ ] **Step 3: Set up Dodo (by hand, test mode first)**

1. In the Dodo dashboard (test mode), create INR products: Pro monthly ₹999 (subscription), Pro yearly ₹9,999 (subscription), Hackathon ₹2,999 (one-time), and Hackathon for Pro ₹1,499 (one-time).
2. Run `pnpm exec convex env set DODO_MONTHLY_PLAN_ID <id>`, and the same for `DODO_YEARLY_PLAN_ID`, `DODO_HACKATHON_PRODUCT_ID` and `DODO_HACKATHON_PRO_PRODUCT_ID`.
3. Check the Dodo dashboard for existing founder Pro subscribers (design: Existing subscriptions). The daily cron gives each Pro user their first credit within a day.

- [ ] **Step 4: Update the local CLAUDE.md**

In `CLAUDE.md`, replace the `http.ts` bullet with:

```md
- `http.ts` has the auth routes and the Dodo webhook, a thin adapter over `internal.billing.webhooks.*` (plan tier, Pro monthly credits, one-time hackathon purchases). Hackathon credits live in one `hackathonCredits` ledger (`lib/billing/credits.ts`); Trial Cycles start as `draft` and go public only through `hiring.trialCycles.publish`.
- Operator commands: `pnpm exec convex run billing/credits:createLaunchCode '{"source":"launch","issuedTo":"<who>"}'` (use `"upi"` for paid UPI codes) and `pnpm exec convex run billing/credits:grantRerunCredit '{"trialCycleId":"<id>"}'`.
```

`CLAUDE.md` is gitignored, so there's nothing to commit.

## Artifacts this plan produces

- Tables and fields: `hackathonCredits`; `trialCycles.{prize, publishedAt, publishedByUserId, creditSource, ipAcknowledgedAt}`; `applications.{ipAcknowledgedAt, scoreExcluded}`; `trialStatus` `"draft"`; index `users.by_plan_tier`.
- Validators: `creditSource` (schema), `subscriptionEvent` (`convex/billing/webhooks.ts`).
- Public functions: `billing.credits.balance`, `billing.credits.claimLaunchCode`, `billing.checkout.createHackathonCheckout`, `hiring.trialCycles.publish`, `hiring.trialCycles.reschedule`.
- Internal functions: `billing.credits.createLaunchCode`, `billing.credits.grantRerunCredit`, `billing.credits.grantMonthlyProCredits`, `billing.webhooks.applySubscriptionEvent`, `billing.webhooks.applyPaymentSucceeded`, `billing.checkout.prepareHackathonCheckout`.
- Lib: `lib/billing/credits.ts` (`normalizeCode`, `generateCode`, `isSpendable`, `listSpendableCredits`, `CREDIT_SPEND_ORDER`, `NO_CREDIT_MESSAGE`, `spendCredit`, `grantCredit`, `HACKATHON_PAYMENT_KIND`, `monthKey`, `grantMonthlyProCredit`, `expireProCredits`), `lib/hiring/publish.ts` (`NEW_DATES_MESSAGE`, `publishProblem`, `requirePublishable`, `publishDraft`), `lib/hiring/ipTerms.ts` (`IP_TERMS_MESSAGE`, `requireIpTerms`), `dodo.ts` `getHackathonProductId`.
- Limits: `MAX_USER_CREDITS`, `MAX_LAUNCH_CODES`, `LAUNCH_CODE_WINDOW_MS`, `RERUN_MIN_APPLICATIONS`, `RERUN_CREDIT_TTL_MS`, `MAX_BANKED_PRO_CREDITS`, `MAX_PRO_USERS_SCAN`, `MAX_LIVE_ENTRIES`. Removed: `FREE_ACTIVE_TRIAL_APPLICATIONS`, `PlanLimits.liveTrialCycles`, `people.billing.setPlanTier`.
- Cron: `convex/crons.ts` daily at 00:10 UTC.
- Test helpers: `createDraftTrial`, `giveCredit`, `balanceOf`; `setUpStartup` returns `t`; `createTrial` publishes.
- Frontend: `CONTRIBUTOR_IP_TERMS` and `confirmIpTerms` in `src/features/hiring/trialCycles/constants.ts`.
- Env vars: `DODO_HACKATHON_PRODUCT_ID`, `DODO_HACKATHON_PRO_PRODUCT_ID`.
