import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { notify } from "../notify";
import { getMembership, requireMembership } from "../teams/membership";

type CycleCtx = QueryCtx | MutationCtx;

export async function getCycleMember(
	ctx: CycleCtx,
	cycleId: Id<"cycles">,
	userId: Id<"users">,
): Promise<Doc<"cycleMembers"> | null> {
	return await ctx.db
		.query("cycleMembers")
		.withIndex("by_cycle_and_user", (q) =>
			q.eq("cycleId", cycleId).eq("userId", userId),
		)
		.unique();
}

/**
 * Founders implicitly belong to every Cycle; Members only to Cycles they were
 * added to. Every Cycle and internal-Pulse function goes through here.
 */
export async function requireCycleAccess(
	ctx: CycleCtx,
	cycleId: Id<"cycles">,
	userId: Id<"users">,
): Promise<{ cycle: Doc<"cycles">; membership: Doc<"memberships"> }> {
	const cycle = await ctx.db.get(cycleId);
	if (!cycle) {
		throw new Error("Cycle not found");
	}
	const membership = await requireMembership(ctx, cycle.startupId, userId);
	if (
		membership.role !== "founder" &&
		!(await getCycleMember(ctx, cycleId, userId))
	) {
		throw new Error("You are not part of this Cycle");
	}
	return { cycle, membership };
}

/**
 * Adds a Startup member as a Cycle Member and notifies them, unless they
 * already belong to the Cycle. Throws if they are not on the Startup's team.
 */
export async function addCycleMember(
	ctx: MutationCtx,
	cycle: Doc<"cycles">,
	targetUserId: Id<"users">,
): Promise<void> {
	const membership = await getMembership(ctx, cycle.startupId, targetUserId);
	if (!membership) {
		throw new Error("That user is not on the team");
	}
	if (await getCycleMember(ctx, cycle._id, targetUserId)) {
		return;
	}

	await ctx.db.insert("cycleMembers", {
		cycleId: cycle._id,
		userId: targetUserId,
	});
	await notify(ctx, {
		userId: targetUserId,
		kind: "cycle",
		title: `You were added to the Cycle ${cycle.title}`,
		href: "/app",
	});
}
