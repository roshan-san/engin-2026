import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { cycleHeader } from "./activity/model";
import { dropUnfinishedCards, loadUnfinishedCards } from "./cards/model";
import { MAX_BOARD_CARDS } from "./cards/rules";
import { closeCycle, loadGoal, loadGoalRow, saveGoal } from "./cycles/model";
import { cycleNumber, isReviewDue, shiftWeek, weekOf } from "./cycles/rules";
import { requireUserId } from "./lib/auth";
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

/** What the Founder's Monday review of last week covers, or null when none is due. */
export const getReview = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { startup, role } = await requireTeam(ctx, args.startupId, userId);
		if (role !== "founder") {
			return null;
		}

		const now = Date.now();
		const week = shiftWeek(weekOf(now), -1);
		const row = await loadGoalRow(ctx, args.startupId, week);
		// Closed for most of the week: this runs on every Cycle page, so skip the Cards.
		if (row?.reviewedAt !== undefined) {
			return null;
		}
		const [unfinished, currentGoal] = await Promise.all([
			loadUnfinishedCards(ctx, args.startupId),
			loadGoal(ctx, args.startupId, weekOf(now)),
		]);
		const number = cycleNumber(startup._creationTime, now);
		if (
			!isReviewDue({
				cycleNumber: number,
				isReviewed: false,
				hasGoal: row?.goal !== undefined,
				unfinishedCount: unfinished.length,
			})
		) {
			return null;
		}
		return {
			week,
			number: number - 1,
			goal: row?.goal ?? null,
			currentGoal,
			unfinished: unfinished.map(({ _id, title }) => ({ _id, title })),
		};
	},
});

/** Closes last week: whether the goal happened, the Cards to drop, and maybe this week's goal. */
export const closeReview = mutation({
	args: {
		startupId: v.id("startups"),
		week: v.string(),
		goalMet: v.optional(v.boolean()),
		dropCardIds: v.array(v.id("cards")),
		nextGoal: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounder(ctx, args.startupId, userId);

		const now = Date.now();
		// A sheet left open past Sunday must not close a newer week with old answers.
		if (args.week !== shiftWeek(weekOf(now), -1)) {
			throw new ConvexError("This review has passed");
		}
		const row = await loadGoalRow(ctx, args.startupId, args.week);
		if (row?.reviewedAt !== undefined) {
			throw new ConvexError("This Cycle is already closed");
		}
		if (args.dropCardIds.length > 2 * MAX_BOARD_CARDS) {
			throw new ConvexError("That's too many Cards to drop at once");
		}
		const hasGoal = row?.goal !== undefined;
		if (hasGoal && args.goalMet === undefined) {
			throw new ConvexError("Say whether the goal happened");
		}

		await closeCycle(ctx, row, args.startupId, args.week, {
			goalMet: hasGoal ? args.goalMet : undefined,
			now,
		});
		// A Card that moved on or left since the sheet opened just stays as it is.
		await dropUnfinishedCards(ctx, args.startupId, args.dropCardIds);
		if (args.nextGoal?.trim()) {
			await saveGoal(ctx, args.startupId, weekOf(now), args.nextGoal);
		}
	},
});
