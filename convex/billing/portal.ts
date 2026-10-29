import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import { action } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { customerPortal } from "../model/dodo";

/** Dodo's customer portal: cancel, switch plan, change card, invoices. */
export const open = action({
	args: {},
	handler: async (ctx): Promise<{ url: string }> => {
		const userId = await requireUserId(ctx);
		const customerId = await ctx.runQuery(
			internal.billing.subscriptions.customerIdFor,
			{ userId },
		);
		if (!customerId) {
			throw new ConvexError("You don't have a plan yet.");
		}
		const { portal_url } = await customerPortal(ctx, { send_email: false });
		return { url: portal_url };
	},
});
