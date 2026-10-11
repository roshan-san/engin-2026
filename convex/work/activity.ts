import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { CYCLES_PAGE } from "../lib/limits";
import { requireTeam } from "../startups/access.rules";
import { loadCycles } from "./activity.rules";

/** The team's full Activity: the newest `count` Cycles. */
export const list = query({
	args: { startupId: v.id("startups"), count: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { startup } = await requireTeam(ctx, args.startupId, userId);

		return await loadCycles(ctx, startup, {
			count: args.count ?? CYCLES_PAGE,
			masked: false,
		});
	},
});
