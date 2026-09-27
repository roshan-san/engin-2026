import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { isTrialLive, requireTrialAccess } from "../lib/hiring/trialCycles";
import { loadPublicUser } from "../lib/people/users";
import { requireText } from "../lib/text";

export const list = query({
	args: { trialCycleId: v.id("trialCycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}
		await requireTrialAccess(ctx, trial, userId);

		const messages = await ctx.db
			.query("trialMessages")
			.withIndex("by_trial", (q) => q.eq("trialCycleId", args.trialCycleId))
			.order("asc")
			.take(100);

		const results = [];
		for (const message of messages) {
			results.push({
				_id: message._id,
				body: message.body,
				createdAt: message._creationTime,
				user: await loadPublicUser(ctx, message.userId),
			});
		}
		return results;
	},
});

export const send = mutation({
	args: {
		trialCycleId: v.id("trialCycles"),
		body: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}
		await requireTrialAccess(ctx, trial, userId);

		await ctx.db.insert("trialMessages", {
			trialCycleId: args.trialCycleId,
			userId,
			body: requireText(args.body, "Message"),
		});
	},
});

export const listRooms = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const applications = await ctx.db
			.query("applications")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.take(50);

		const rooms = [];
		for (const application of applications) {
			if (application.status !== "joined" || !application.trialCycleId) {
				continue;
			}
			const trial = await ctx.db.get(application.trialCycleId);
			if (!trial || !isTrialLive(trial)) {
				continue;
			}
			rooms.push({
				trialCycleId: trial._id,
				title: trial.title,
			});
		}

		const memberships = await ctx.db
			.query("memberships")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.take(20);

		for (const membership of memberships) {
			const trials = await ctx.db
				.query("trialCycles")
				.withIndex("by_startup", (q) => q.eq("startupId", membership.startupId))
				.take(20);
			for (const trial of trials) {
				if (!isTrialLive(trial)) {
					continue;
				}
				if (rooms.some((room) => room.trialCycleId === trial._id)) {
					continue;
				}
				rooms.push({
					trialCycleId: trial._id,
					title: trial.title,
				});
			}
		}

		return rooms;
	},
});
