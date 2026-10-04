import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "../_generated/api";
import { createDraftTrial } from "../hiring/trialCycles.helpers";
import { createTest, DAY, type TestConvex } from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { signUp } from "../people/users.helpers";
import { setUpStartup } from "../teams/startups.helpers";
import { balanceOf } from "./credits.helpers";

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

describe("Pro monthly credits", () => {
	test("Pro grants one credit a month, however often Dodo repeats itself", async () => {
		const t = createTest();
		const founder = await signUp(t, "Founder");

		await subscription(t, "active", founder.userId);
		await subscription(t, "renewed", founder.userId);
		await subscription(t, "renewed", founder.userId);

		expect(await balanceOf(founder.as)).toBe(1);
		expect((await founder.as.query(api.billing.plan.getPlan, {})).isPro).toBe(
			true,
		);
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
		expect((await founder.as.query(api.billing.plan.getPlan, {})).isPro).toBe(
			false,
		);
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

	test("resubscribing after a cancel keeps the banked credits past the old period end", async () => {
		const t = createTest();
		const founder = await signUp(t, "Founder");
		await subscription(t, "active", founder.userId);
		await subscription(t, "cancelled", founder.userId, {
			nextBillingAt: Date.now() + 10 * DAY,
		});

		await subscription(t, "active", founder.userId);

		vi.advanceTimersByTime(11 * DAY);
		expect(await balanceOf(founder.as)).toBe(1);
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
});

describe("matching a webhook to a user", () => {
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
});

describe("hackathon payments", () => {
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
});
