import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "../_generated/api";
import { createDraftTrial } from "../hiring/trialCycles.helpers";
import { createTest, DAY, type TestConvex } from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { signUp } from "../people/users.helpers";
import {
	goStealth,
	joinAsCoFounder,
	setUpStartup,
} from "../teams/startups.helpers";
import { balanceOf, giveCredit } from "./credits.helpers";

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date("2026-10-05T12:00:00Z"));
	vi.stubEnv("DODO_HACKATHON_PRODUCT_ID", "pdt_hackathon");
	vi.stubEnv("DODO_HACKATHON_PRO_PRODUCT_ID", "pdt_hackathon_pro");
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.unstubAllEnvs();
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
	extra: { email?: string } = {},
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

describe("Pro subscription", () => {
	test("going Pro gives 2 hackathon credits that lapse a month later", async () => {
		const t = createTest();
		const founder = await signUp(t, "Founder");

		await subscription(t, "active", founder.userId);

		const { credits } = await founder.as.query(api.billing.credits.balance, {});
		expect(credits.map((credit) => credit.source)).toEqual([
			"pro_monthly",
			"pro_monthly",
		]);
		expect(
			credits.every(
				(credit) => credit.expiresAt === Date.parse("2026-11-05T12:00:00Z"),
			),
		).toBe(true);
	});

	test("unused Pro credits don't bank: a new Pro month replaces them", async () => {
		const t = createTest();
		const founder = await signUp(t, "Founder");
		await subscription(t, "active", founder.userId);

		vi.advanceTimersByTime(31 * DAY);
		await subscription(t, "renewed", founder.userId);

		expect(await balanceOf(founder.as)).toBe(2);
		expect(
			(await creditRows(t)).filter((row) => row.source === "pro_monthly"),
		).toHaveLength(2);
	});

	test("yearly Pro gets its 2 credits every month from the daily grant", async () => {
		const t = createTest();
		const founder = await signUp(t, "Founder");
		await subscription(t, "active", founder.userId);

		vi.advanceTimersByTime(62 * DAY);
		await t.mutation(internal.billing.credits.grantProCredits, {});

		const { credits } = await founder.as.query(api.billing.credits.balance, {});
		expect(credits).toHaveLength(2);
		expect(credits[0]?.expiresAt).toBe(Date.parse("2027-01-05T12:00:00Z"));
	});

	test("a renewal or a repeated grant in the same Pro month adds nothing", async () => {
		const t = createTest();
		const founder = await signUp(t, "Founder");
		await subscription(t, "active", founder.userId);

		await subscription(t, "renewed", founder.userId);
		await t.mutation(internal.billing.credits.grantProCredits, {});
		await t.mutation(internal.billing.credits.grantProCredits, {});

		expect(await balanceOf(founder.as)).toBe(2);
	});

	test("ending Pro keeps this month's Pro credits and every other credit, and stops new grants", async () => {
		const t = createTest();
		const founder = await signUp(t, "Founder");
		await giveCredit(t, founder.userId);
		await giveCredit(t, founder.userId, { source: "signup" });
		await subscription(t, "active", founder.userId);

		await subscription(t, "cancelled", founder.userId);
		expect(await balanceOf(founder.as)).toBe(4);
		expect((await founder.as.query(api.billing.plan.getPlan, {})).isPro).toBe(
			false,
		);

		vi.advanceTimersByTime(40 * DAY);
		await t.mutation(internal.billing.credits.grantProCredits, {});
		expect(await balanceOf(founder.as)).toBe(2);
	});

	test("resubscribing starts a new Pro month with 2 new credits", async () => {
		const t = createTest();
		const founder = await signUp(t, "Founder");
		await subscription(t, "active", founder.userId);
		await subscription(t, "expired", founder.userId);
		vi.advanceTimersByTime(10 * DAY);

		await subscription(t, "active", founder.userId);

		const { credits } = await founder.as.query(api.billing.credits.balance, {});
		expect(
			credits.filter(
				(credit) => credit.expiresAt === Date.parse("2026-11-15T12:00:00Z"),
			),
		).toHaveLength(2);
	});

	test("a Pro user from before Pro months existed starts one at the daily grant", async () => {
		const t = createTest();
		const founder = await signUp(t, "Founder");
		await t.run(async (ctx) => {
			await ctx.db.patch(founder.userId, { planTier: "pro" });
		});

		await t.mutation(internal.billing.credits.grantProCredits, {});

		expect(await balanceOf(founder.as)).toBe(2);
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

		expect((await founder.as.query(api.billing.plan.getPlan, {})).isPro).toBe(
			true,
		);
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

		expect(payer.productId).toBe("pdt_hackathon");
		const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.ipAcknowledgedAt).toBeDefined();

		await goStealth(setup);
		await expect(
			t.mutation(internal.billing.checkout.prepareHackathonCheckout, {
				userId: setup.founder.userId,
				trialCycleId,
			}),
		).rejects.toThrow("Turn off stealth mode");
	});

	test("a paid draft with no Starting Pulse stays a draft, and the credit waits", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup);
		await t.mutation(internal.billing.checkout.prepareHackathonCheckout, {
			userId: setup.founder.userId,
			trialCycleId,
		});
		await t.run(async (ctx) => {
			for (const challenge of await ctx.db.query("challenges").collect()) {
				await ctx.db.delete(challenge._id);
			}
		});

		await paid(t, { userId: setup.founder.userId, trialCycleId });

		const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.status).toBe("draft");
		expect(await balanceOf(setup.founder.as)).toBe(1);
	});
	test("a Pro founder is charged the Pro price product", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup);
		await subscription(t, "active", setup.founder.userId);

		const payer = await t.mutation(
			internal.billing.checkout.prepareHackathonCheckout,
			{ userId: setup.founder.userId, trialCycleId },
		);

		expect(payer.productId).toBe("pdt_hackathon_pro");
	});

	test("a missing product setting stops checkout before anything is recorded", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup);
		vi.stubEnv("DODO_HACKATHON_PRODUCT_ID", "");

		await expect(
			t.mutation(internal.billing.checkout.prepareHackathonCheckout, {
				userId: setup.founder.userId,
				trialCycleId,
			}),
		).rejects.toThrow("DODO_HACKATHON_PRODUCT_ID is not configured");

		const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.ipAcknowledgedAt).toBeUndefined();
	});

	test("a co-founder's payment publishes another founder's draft on the co-founder's credit", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const coFounder = await joinAsCoFounder(setup, "Cofounder");
		const trialCycleId = await createDraftTrial(setup);
		await t.mutation(internal.billing.checkout.prepareHackathonCheckout, {
			userId: coFounder.userId,
			trialCycleId,
		});

		await paid(t, { userId: coFounder.userId, trialCycleId });

		const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.status).toBe("open");
		expect(await balanceOf(coFounder.as)).toBe(0);
		const rows = await creditRows(t);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			ownerUserId: coFounder.userId,
			source: "purchase",
		});
		expect(rows[0]?.spentAt).toBeDefined();
	});
});
