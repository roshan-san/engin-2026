import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../_generated/api";
import { createTest, DAY } from "../testing/test.setup";
import { signUp } from "../testing/users.setup";

describe("maintenance", () => {
	it("the site is open until maintenance is turned on", async () => {
		const t = createTest();

		expect(await t.query(api.site.maintenance.status, {})).toBe(false);
	});

	it("turning maintenance on shows it to everyone, signed in or not", async () => {
		const t = createTest();
		const fay = await signUp(t, "Fay");

		await t.mutation(internal.site.maintenance.set, { on: true });

		expect(await t.query(api.site.maintenance.status, {})).toBe(true);
		expect(await fay.as.query(api.site.maintenance.status, {})).toBe(true);
	});

	it("under maintenance, a change is refused", async () => {
		const t = createTest();
		const fay = await signUp(t, "Fay");
		await t.mutation(internal.site.maintenance.set, { on: true });

		await expect(
			fay.as.mutation(api.people.users.updateProfile, { bio: "Hello" }),
		).rejects.toThrow("engin is down for maintenance");
	});

	it("turning maintenance off lets changes through again", async () => {
		const t = createTest();
		const fay = await signUp(t, "Fay");
		await t.mutation(internal.site.maintenance.set, { on: true });

		await t.mutation(internal.site.maintenance.set, { on: false });
		await fay.as.mutation(api.people.users.updateProfile, { bio: "Hello" });

		expect(await t.query(api.site.maintenance.status, {})).toBe(false);
		const me = await fay.as.query(api.people.users.getMe, {});
		expect(me?.bio).toBe("Hello");
	});

	describe("Dodo's webhook", () => {
		beforeEach(() => {
			vi.stubEnv("DODO_PRODUCT_YEARLY", "pdt_yearly");
		});

		afterEach(() => {
			vi.unstubAllEnvs();
		});

		it("still syncs a plan under maintenance", async () => {
			const t = createTest();
			const fay = await signUp(t, "Fay");
			await t.mutation(internal.site.maintenance.set, { on: true });

			await t.mutation(internal.billing.subscriptions.sync, {
				dodoSubscriptionId: "sub_1",
				dodoCustomerId: "cus_1",
				productId: "pdt_yearly",
				status: "active",
				periodStart: Date.now(),
				periodEnd: Date.now() + 365 * DAY,
				userId: fay.userId,
				eventAt: Date.now(),
			});

			const plans = await t.run(
				async (ctx) =>
					await ctx.db
						.query("subscriptions")
						.withIndex("by_user", (q) => q.eq("userId", fay.userId))
						.take(10),
			);
			expect(plans).toHaveLength(1);
		});
	});
});
