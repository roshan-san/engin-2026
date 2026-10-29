import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { requireThreadAccess } from "./threads/access";
import {
	buildThreadViews,
	loadHackathonThreads,
	loadTeamThreads,
	markThreadRead,
} from "./threads/model";

export const list = query({
	args: {
		startupId: v.optional(v.id("startups")),
		hackathonId: v.optional(v.id("hackathons")),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { startupId, hackathonId } = args;

		if (startupId && !hackathonId) {
			const threads = await loadTeamThreads(ctx, startupId);
			return await buildThreadViews(ctx, threads, userId);
		}
		if (hackathonId && !startupId) {
			const threads = await loadHackathonThreads(ctx, hackathonId);
			return await buildThreadViews(ctx, threads, userId);
		}
		throw new ConvexError("Pick a startup or a Hackathon");
	},
});

export const markRead = mutation({
	args: { threadId: v.id("threads") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireThreadAccess(ctx, args.threadId, userId);

		await markThreadRead(ctx, args.threadId, userId);
	},
});
