import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { toMemberUser } from "../people/users.rules";
import { removeMember, requireRemovableMembership } from "./members.rules";
import {
	requireFounderMembership,
	requireMembership,
} from "./membership.rules";

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

		await removeMember(
			ctx,
			await requireRemovableMembership(ctx, args.membershipId),
		);
	},
});
