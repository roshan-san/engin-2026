import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../model/auth";
import { requireFounder, requireTeam } from "../model/teamAccess";
import { cycleNumber, WEEK_MS, weekOf, weekStart } from "../shared/cycles";
import { loadGoal, saveGoal } from "../model/goals";

export const getCurrent = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { startup } = await requireTeam(ctx, args.startupId, userId);

		const week = weekOf(Date.now());
		const startsAt = weekStart(week);
		return {
			number: cycleNumber(startup._creationTime, startsAt),
			week,
			startsAt,
			endsAt: startsAt + WEEK_MS,
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
