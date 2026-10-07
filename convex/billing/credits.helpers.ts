import { api } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { Client, TestConvex } from "../lib/testing.helpers";

/** Gives someone one unspent hackathon credit, as if they had paid. */
export async function giveCredit(
	t: TestConvex,
	userId: Id<"users">,
	credit: {
		source?: Doc<"credits">["source"];
		expiresAt?: number;
	} = {},
) {
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("credits", {
				ownerUserId: userId,
				source: credit.source ?? "purchase",
				expiresAt: credit.expiresAt,
			}),
	);
}

/** How many hackathon credits the signed-in person can spend right now. */
export async function balanceOf(as: Client) {
	return (await as.query(api.billing.credits.balance, {})).available;
}
