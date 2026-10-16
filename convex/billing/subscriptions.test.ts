import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { planForProduct } from "../model/billing";
import { givePro } from "../testing/billing.setup";
import { publishedHackathon } from "../testing/hackathons.setup";
import { setUpStartup } from "../testing/startups.setup";
import { createTest, DAY, type TestConvex } from "../testing/test.setup";

beforeEach(() => {
	vi.stubEnv("DODO_PRODUCT_MONTHLY", "pdt_monthly");
	vi.stubEnv("DODO_PRODUCT_SIX_MONTHS", "pdt_six");
	vi.stubEnv("DODO_PRODUCT_YEARLY", "pdt_yearly");
});

afterEach(() => {
	vi.unstubAllEnvs();
});

function event(userId: string, overrides: Record<string, unknown> = {}) {
	return {
		dodoSubscriptionId: "sub_1",
		dodoCustomerId: "cus_1",
		productId: "pdt_six",
		status: "active" as const,
		periodStart: Date.now(),
		periodEnd: Date.now() + 180 * DAY,
		userId,
		eventAt: Date.now(),
		...overrides,
	};
}

async function subscriptionsOf(t: TestConvex, userId: Id<"users">) {
	return await t.run(
		async (ctx) =>
			await ctx.db
				.query("subscriptions")
				.withIndex("by_user", (q) => q.eq("userId", userId))
				.take(10),
	);
}

describe("planForProduct", () => {
	it("maps each Dodo product to its plan", () => {
		expect(planForProduct("pdt_monthly")).toBe("monthly");
		expect(planForProduct("pdt_six")).toBe("six_months");
		expect(planForProduct("pdt_yearly")).toBe("yearly");
		expect(planForProduct("pdt_other")).toBeNull();
	});
});

describe("sync", () => {
	it("the first event copies the subscription in", async () => {
		const { t, founder } = await setUpStartup(createTest());

		await t.mutation(
			internal.billing.subscriptions.sync,
			event(founder.userId),
		);

		expect(await subscriptionsOf(t, founder.userId)).toMatchObject([
			{
				dodoSubscriptionId: "sub_1",
				dodoCustomerId: "cus_1",
				plan: "six_months",
				status: "active",
			},
		]);
	});

	it("a newer event updates the same row", async () => {
		const { t, founder } = await setUpStartup(createTest());
		await t.mutation(
			internal.billing.subscriptions.sync,
			event(founder.userId),
		);

		await t.mutation(
			internal.billing.subscriptions.sync,
			event(founder.userId, {
				status: "on_hold",
				eventAt: Date.now() + 1000,
			}),
		);

		const rows = await subscriptionsOf(t, founder.userId);
		expect(rows).toHaveLength(1);
		expect(rows[0].status).toBe("on_hold");
	});

	it("an older event arriving late changes nothing", async () => {
		const { t, founder } = await setUpStartup(createTest());
		await t.mutation(
			internal.billing.subscriptions.sync,
			event(founder.userId, {
				status: "cancelled",
				eventAt: Date.now() + 1000,
			}),
		);

		await t.mutation(
			internal.billing.subscriptions.sync,
			event(founder.userId, { status: "active", eventAt: Date.now() }),
		);

		expect((await subscriptionsOf(t, founder.userId))[0].status).toBe(
			"cancelled",
		);
	});

	it("a plan change switches the plan", async () => {
		const { t, founder } = await setUpStartup(createTest());
		await t.mutation(
			internal.billing.subscriptions.sync,
			event(founder.userId),
		);

		await t.mutation(
			internal.billing.subscriptions.sync,
			event(founder.userId, {
				productId: "pdt_yearly",
				eventAt: Date.now() + 1000,
			}),
		);

		expect((await subscriptionsOf(t, founder.userId))[0].plan).toBe("yearly");
	});

	it("an unknown product or a missing person changes nothing", async () => {
		const { t, founder } = await setUpStartup(createTest());

		await t.mutation(
			internal.billing.subscriptions.sync,
			event(founder.userId, { productId: "pdt_other" }),
		);
		await t.mutation(
			internal.billing.subscriptions.sync,
			event(founder.userId, {
				userId: undefined,
				dodoSubscriptionId: "sub_2",
			}),
		);
		await t.mutation(
			internal.billing.subscriptions.sync,
			event("not-an-id", { dodoSubscriptionId: "sub_3" }),
		);

		const all = await t.run(
			async (ctx) => await ctx.db.query("subscriptions").take(10),
		);
		expect(all).toEqual([]);
	});
});

describe("mine", () => {
	it("no plan reads as null", async () => {
		const { founder } = await setUpStartup(createTest());

		expect(
			await founder.as.query(api.billing.subscriptions.mine, {}),
		).toBeNull();
	});

	it("a plan says what's left of it", async () => {
		const setup = await setUpStartup(createTest());
		await givePro(setup.t, setup.founder, "monthly");
		await publishedHackathon(setup);

		const mine = await setup.founder.as.query(
			api.billing.subscriptions.mine,
			{},
		);

		expect(mine).toMatchObject({
			plan: "monthly",
			allowance: 1,
			hackathonsLeft: 0,
			running: 1,
		});
	});
});

describe("customerIdFor", () => {
	it("is the Dodo customer of the Founder's latest subscription", async () => {
		const { t, founder } = await setUpStartup(createTest());
		await givePro(t, founder);

		const customerId = await t.query(
			internal.billing.subscriptions.customerIdFor,
			{ userId: founder.userId },
		);

		expect(customerId).toBe(`cus_${founder.userId}`);
	});
});
