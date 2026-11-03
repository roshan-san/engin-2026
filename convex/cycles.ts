import { v } from "convex/values";
import { query } from "./_generated/server";
import { cycleHeader } from "./activity/model";
import { weekOf } from "./cycles/rules";
import { requireUserId } from "./lib/auth";
import { requireTeam } from "./startups/team";

export const getCurrent = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { startup } = await requireTeam(ctx, args.startupId, userId);

		return cycleHeader(startup, weekOf(Date.now()));
	},
});
