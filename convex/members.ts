import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { toMemberUser } from "./lib/people/users";
import {
	requireFounderMembership,
	requireMembership,
} from "./lib/teams/membership";

export const list = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireMembership(ctx, args.startupId, userId);

		const memberships = await ctx.db
			.query("memberships")
			.withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
			.take(50);

		const members = [];
		for (const membership of memberships) {
			const user = await ctx.db.get(membership.userId);
			if (user) {
				members.push({
					_id: membership._id,
					role: membership.role,
					user: toMemberUser(user),
				});
			}
		}

		return members;
	},
});

export const remove = mutation({
	args: { membershipId: v.id("memberships") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const membership = await ctx.db.get(args.membershipId);
		if (!membership) {
			throw new Error("Member not found");
		}

		await requireFounderMembership(ctx, membership.startupId, userId);

		if (membership.role === "founder") {
			throw new Error("Founders cannot be removed from their own startup");
		}

		await ctx.db.delete(args.membershipId);
	},
});
