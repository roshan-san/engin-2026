import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_CYCLE_MEMBERS, MAX_CYCLE_PULSES } from "../lib/limits";
import { cycleHref } from "../lib/links";
import { notify, notifyFounders } from "../people/notifications.rules";
import {
	getMembership,
	requireFounderMembership,
	requireMembership,
} from "../teams/membership.rules";

type CycleCtx = QueryCtx | MutationCtx;

/** Pulse statuses that are not finished and move with a carry-over. */
const UNFINISHED_STATUSES: ReadonlySet<Doc<"pulses">["status"]> = new Set([
	"todo",
	"in_progress",
	"review",
]);

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
 * The Cycle and the viewer's membership if they may open it, else `null`.
 * Founders implicitly belong to every Cycle; Members only to Cycles they were
 * added to.
 */
export async function getCycleAccess(
	ctx: CycleCtx,
	cycleId: Id<"cycles">,
	userId: Id<"users">,
): Promise<{ cycle: Doc<"cycles">; membership: Doc<"memberships"> } | null> {
	const cycle = await ctx.db.get(cycleId);
	if (!cycle) {
		return null;
	}
	const membership = await getMembership(ctx, cycle.startupId, userId);
	if (!membership) {
		return null;
	}
	if (
		membership.role !== "founder" &&
		!(await getCycleMember(ctx, cycleId, userId))
	) {
		return null;
	}
	return { cycle, membership };
}

/** Every Cycle and internal-Pulse function goes through here. */
export async function requireCycleAccess(
	ctx: CycleCtx,
	cycleId: Id<"cycles">,
	userId: Id<"users">,
): Promise<{ cycle: Doc<"cycles">; membership: Doc<"memberships"> }> {
	const cycle = await ctx.db.get(cycleId);
	if (!cycle) {
		throw new Error("Cycle not found");
	}
	await requireMembership(ctx, cycle.startupId, userId);
	const access = await getCycleAccess(ctx, cycleId, userId);
	if (!access) {
		throw new Error("You are not part of this Cycle");
	}
	return access;
}

/** Loads a Cycle the user, as a Founder of its Startup, may manage. */
export async function requireFounderCycle(
	ctx: CycleCtx,
	cycleId: Id<"cycles">,
	userId: Id<"users">,
): Promise<Doc<"cycles">> {
	const cycle = await ctx.db.get(cycleId);
	if (!cycle) {
		throw new Error("Cycle not found");
	}
	await requireFounderMembership(ctx, cycle.startupId, userId);
	return cycle;
}

/** A closed Cycle is read-only. */
export function requireOpenCycle(cycle: Doc<"cycles">): void {
	if (cycle.status === "closed") {
		throw new Error("This Cycle is closed");
	}
}

export async function loadCyclePulses(
	ctx: CycleCtx,
	cycleId: Id<"cycles">,
): Promise<Doc<"pulses">[]> {
	return await ctx.db
		.query("pulses")
		.withIndex("by_cycle", (q) => q.eq("cycleId", cycleId))
		.take(MAX_CYCLE_PULSES);
}

export async function loadCycleMembers(
	ctx: CycleCtx,
	cycleId: Id<"cycles">,
): Promise<Doc<"cycleMembers">[]> {
	return await ctx.db
		.query("cycleMembers")
		.withIndex("by_cycle", (q) => q.eq("cycleId", cycleId))
		.take(MAX_CYCLE_MEMBERS);
}

/**
 * Adds a Startup member as a Cycle Member and notifies them, unless they
 * already belong to the Cycle. Throws for Founders and people off the team.
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
	if (membership.role === "founder") {
		throw new Error("Founders already belong to every Cycle");
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
		href: await cycleHref(ctx, cycle),
	});
}

/** Tells a Cycle's Members and the other Founders about a lifecycle change. */
export async function notifyCycle(
	ctx: MutationCtx,
	cycle: Doc<"cycles">,
	title: string,
	actorUserId: Id<"users">,
): Promise<void> {
	const href = await cycleHref(ctx, cycle);
	for (const member of await loadCycleMembers(ctx, cycle._id)) {
		if (member.userId !== actorUserId) {
			await notify(ctx, { userId: member.userId, kind: "cycle", title, href });
		}
	}
	await notifyFounders(
		ctx,
		cycle.startupId,
		{ kind: "cycle", title, href },
		{ except: actorUserId },
	);
}

/** Checks a carry-over target before the close writes anything. */
export async function requireCarryOverTarget(
	ctx: MutationCtx,
	from: Doc<"cycles">,
	targetId: Id<"cycles">,
): Promise<Doc<"cycles">> {
	const target = await ctx.db.get(targetId);
	if (
		!target ||
		target.startupId !== from.startupId ||
		target.status !== "planned"
	) {
		throw new Error("Unfinished Pulses can only carry over to a planned Cycle");
	}
	return target;
}

/**
 * Moves a closing Cycle's unfinished Pulses, as they are, to `target`. Their
 * assignees join the target so they keep seeing their work.
 */
export async function carryOverPulses(
	ctx: MutationCtx,
	from: Doc<"cycles">,
	target: Doc<"cycles">,
): Promise<number> {
	const unfinished = (await loadCyclePulses(ctx, from._id)).filter((pulse) =>
		UNFINISHED_STATUSES.has(pulse.status),
	);
	const existing = await loadCyclePulses(ctx, target._id);
	if (existing.length + unfinished.length > MAX_CYCLE_PULSES) {
		throw new Error(`A Cycle can have at most ${MAX_CYCLE_PULSES} Pulses`);
	}

	const assignees = new Set<Id<"users">>();
	for (const pulse of unfinished) {
		await ctx.db.patch(pulse._id, { cycleId: target._id });
		if (pulse.assigneeUserId) {
			assignees.add(pulse.assigneeUserId);
		}
	}
	for (const userId of assignees) {
		const membership = await getMembership(ctx, target.startupId, userId);
		if (membership?.role === "member") {
			await addCycleMember(ctx, target, userId);
		}
	}
	return unfinished.length;
}
