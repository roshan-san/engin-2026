import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { loadGoal, saveGoal } from "./cycles/model";
import { weekOf } from "./cycles/rules";
import { requireUserId } from "./lib/auth";
import { cycleHeader } from "./model/activity";
import { requireFounder, requireTeam } from "./startups/team";

export const getCurrent = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { startup } = await requireTeam(ctx, args.startupId, userId);

		const week = weekOf(Date.now());
		return {
			...cycleHeader(startup, week),
			goal: await loadGoal(ctx, args.startupId, week),
		};
	},
});

export const setGoal = mutation({
	args: { startupId: v.id("startups"), goal: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounder(ctx, args.startupId, userId);

		await saveGoal(ctx, args.startupId, weekOf(Date.now()), args.goal);
	},
});
