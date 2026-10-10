import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { requireTeam } from "../startups/access.rules";
import { loadActivityByCycle } from "./activity.rules";

export const list = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { startup } = await requireTeam(ctx, args.startupId, userId);

		return await loadActivityByCycle(ctx, startup);
	},
});
