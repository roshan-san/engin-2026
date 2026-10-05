import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { MAX_LISTED_CYCLES } from "../lib/limits";
import { notify } from "../people/notifications.rules";
import { logActivity } from "./activity.rules";

/** Loads a membership a Founder may remove: Members only, never co-Founders. */
export async function requireRemovableMembership(
	ctx: MutationCtx,
	membershipId: Doc<"memberships">["_id"],
): Promise<Doc<"memberships">> {
	const membership = await ctx.db.get(membershipId);
	if (!membership) {
		throw new Error("Member not found");
	}
	if (membership.role === "founder") {
		throw new Error("Co-founders can't be removed");
	}
	return membership;
}

/**
 * Takes a Member off the team: their membership, their seats on the Startup's
 * Cycles, and their focus on it. Their Pulses stay where they are.
 */
export async function removeMember(
	ctx: MutationCtx,
	membership: Doc<"memberships">,
) {
	const { startupId, userId } = membership;
	await ctx.db.delete(membership._id);

	const cycles = await ctx.db
		.query("cycles")
		.withIndex("by_startup", (q) => q.eq("startupId", startupId))
		.take(MAX_LISTED_CYCLES);
	for (const cycle of cycles) {
		const seat = await ctx.db
			.query("cycleMembers")
			.withIndex("by_cycle_and_user", (q) =>
				q.eq("cycleId", cycle._id).eq("userId", userId),
			)
			.unique();
		if (seat) {
			await ctx.db.delete(seat._id);
		}
	}

	const user = await ctx.db.get(userId);
	if (user?.focusedStartupId === startupId) {
		await ctx.db.patch(userId, { focusedStartupId: undefined });
	}

	const startup = await ctx.db.get(startupId);
	await notify(ctx, {
		userId,
		kind: "team",
		title: `You were removed from ${startup?.name ?? "a startup"}`,
		href: "/my-pulses",
	});
	await logActivity(ctx, {
		startupId,
		kind: "member_removed",
		summary: `${user?.name ?? "Someone"} was removed from the team`,
	});
}
