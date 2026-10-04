import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_USER_MEMBERSHIPS } from "../lib/limits";

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

type MembershipEntry = {
	startup: Doc<"startups">;
	role: Doc<"memberships">["role"];
};

/** The Startups someone belongs to, by name, with their role in each. */
export async function loadMembershipsOf(
	ctx: MembershipCtx,
	userId: Id<"users">,
): Promise<MembershipEntry[]> {
	const memberships = await ctx.db
		.query("memberships")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(MAX_USER_MEMBERSHIPS);

	const entries: MembershipEntry[] = [];
	for (const membership of memberships) {
		const startup = await ctx.db.get(membership.startupId);
		if (startup) {
			entries.push({ startup, role: membership.role });
		}
	}

	// Stable order for the switcher (edge SHELL-01/ordering): break ties on slug.
	entries.sort(
		(a, b) =>
			a.startup.name.localeCompare(b.startup.name) ||
			a.startup.slug.localeCompare(b.startup.slug),
	);
	return entries;
}
