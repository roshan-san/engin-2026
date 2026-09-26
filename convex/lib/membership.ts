import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type MembershipCtx = QueryCtx | MutationCtx;

export async function getMembership(
	ctx: MembershipCtx,
	startupId: Id<"startups">,
	userId: Id<"users">,
): Promise<Doc<"memberships"> | null> {
	return await ctx.db
		.query("memberships")
		.withIndex("by_startup_and_user", (q) =>
			q.eq("startupId", startupId).eq("userId", userId),
		)
		.unique();
}

export async function requireMembership(
	ctx: MembershipCtx,
	startupId: Id<"startups">,
	userId: Id<"users">,
): Promise<Doc<"memberships">> {
	const membership = await getMembership(ctx, startupId, userId);
	if (!membership) {
		throw new Error("You are not a member of this startup");
	}
	return membership;
}

export async function requireFounderMembership(
	ctx: MembershipCtx,
	startupId: Id<"startups">,
	userId: Id<"users">,
): Promise<Doc<"memberships">> {
	const membership = await requireMembership(ctx, startupId, userId);
	if (membership.role !== "founder") {
		throw new Error("Only founders can perform this action");
	}
	return membership;
}
