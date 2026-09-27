import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";

export const toggle = mutation({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const startup = await ctx.db.get(args.startupId);

		if (!startup?.isPublic) {
			throw new Error("Startup not found");
		}

		const existing = await ctx.db
			.query("follows")
			.withIndex("by_user_and_startup", (q) =>
				q.eq("userId", userId).eq("startupId", args.startupId),
			)
			.unique();

		if (existing) {
			await ctx.db.delete(existing._id);
			await ctx.db.patch(args.startupId, {
				followerCount: Math.max(0, startup.followerCount - 1),
			});
			return { following: false };
		}

		await ctx.db.insert("follows", { userId, startupId: args.startupId });
		await ctx.db.patch(args.startupId, {
			followerCount: startup.followerCount + 1,
		});
		return { following: true };
	},
});

export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);

		const follows = await ctx.db
			.query("follows")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.take(50);

		const startups = [];
		for (const follow of follows) {
			const startup = await ctx.db.get(follow.startupId);
			if (startup?.isPublic) {
				startups.push({
					_id: startup._id,
					name: startup.name,
					slug: startup.slug,
					tagline: startup.tagline ?? null,
					followerCount: startup.followerCount,
				});
			}
		}

		return startups;
	},
});
