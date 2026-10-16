import type { Doc, Id } from "../_generated/dataModel";
import { PLANS, type PlanKey } from "../shared/plans";
import { DAY, type TestConvex } from "./test.setup";
import type { Person } from "./users.setup";

/** A Dodo subscription copied in, as if its webhook had landed. */
export async function givePro(
	t: TestConvex,
	founder: Person,
	plan: PlanKey = "yearly",
	options: {
		periodStart?: number;
		status?: Doc<"subscriptions">["status"];
	} = {},
): Promise<Id<"subscriptions">> {
	const periodStart = options.periodStart ?? Date.now();
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("subscriptions", {
				userId: founder.userId,
				dodoSubscriptionId: `sub_${founder.userId}_${plan}_${periodStart}`,
				dodoCustomerId: `cus_${founder.userId}`,
				plan,
				status: options.status ?? "active",
				periodStart,
				periodEnd: periodStart + PLANS[plan].months * 31 * DAY,
				syncedAt: periodStart,
			}),
	);
}
