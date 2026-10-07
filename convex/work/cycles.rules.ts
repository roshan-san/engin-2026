import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { GOAL_MAX, MAX_CYCLE_MEMBERS, MAX_CYCLE_TASKS } from "../lib/limits";
import { cycleHref } from "../lib/links";
import { limitText } from "../lib/text";
import { notify, notifyFounders } from "../people/notifications.rules";
import { getHackathonApplication } from "../hiring/hackathons.rules";
import {
	getMembership,
	requireFounderMembership,
} from "../teams/membership.rules";

type CycleCtx = QueryCtx | MutationCtx;

/** Task statuses that are not finished and move with a carry-over. */
const UNFINISHED_STATUSES: ReadonlySet<Doc<"tasks">["status"]> = new Set([
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

/** How the viewer belongs to a Cycle: Participants only ever reach a hackathon's. */
export type CycleRole = "founder" | "member" | "participant";
export type CycleAccess = { cycle: Doc<"cycles">; role: CycleRole };

/**
 * The Cycle and how the viewer belongs to it, or `null` if they may not open
 * it. Founders implicitly belong to every Cycle. Members belong to the team
 * Cycles they were added to; Participants (still in, or finished) to their
 * hackathon's Cycle.
 */
export async function getCycleAccess(
	ctx: CycleCtx,
	cycleId: Id<"cycles">,
	userId: Id<"users">,
): Promise<CycleAccess | null> {
	const cycle = await ctx.db.get(cycleId);
	if (!cycle) {
		return null;
	}
	const membership = await getMembership(ctx, cycle.startupId, userId);
	if (membership?.role === "founder") {
		return { cycle, role: "founder" };
	}
	if (cycle.kind === "hackathon") {
		const application = cycle.hackathonId
			? await getHackathonApplication(ctx, cycle.hackathonId, userId)
			: null;
		return application?.status === "accepted" ||
			application?.status === "completed"
			? { cycle, role: "participant" }
			: null;
	}
	if (!membership || !(await getCycleMember(ctx, cycleId, userId))) {
		return null;
	}
	return { cycle, role: "member" };
}

/** Every Cycle and internal-Task function goes through here. */
export async function requireCycleAccess(
	ctx: CycleCtx,
	cycleId: Id<"cycles">,
	userId: Id<"users">,
): Promise<CycleAccess> {
	const access = await getCycleAccess(ctx, cycleId, userId);
	if (!access) {
		if (!(await ctx.db.get(cycleId))) {
			throw new Error("Cycle not found");
		}
		throw new Error("You are not part of this Cycle");
	}
	return access;
}

/**
 * Loads a team Cycle the user, as a Founder of its Startup, may manage. A
 * hackathon's Cycle follows its hackathon instead.
 */
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
	if (cycle.kind !== "team") {
		throw new Error("Manage this Cycle from its hackathon");
	}
	return cycle;
}

/** A Cycle's one-line goal: required, at most `GOAL_MAX` characters. */
export function parseGoal(goal: string): string {
	const text = limitText(goal, "Goal", GOAL_MAX);
	if (!text) {
		throw new Error("A Cycle needs a goal");
	}
	return text;
}

/** A closed Cycle is read-only. */
export function requireOpenCycle(cycle: Doc<"cycles">): void {
	if (cycle.status === "closed") {
		throw new Error("This Cycle is closed");
	}
}

export async function loadCycleTasks(
	ctx: CycleCtx,
	cycleId: Id<"cycles">,
): Promise<Doc<"tasks">[]> {
	return await ctx.db
		.query("tasks")
		.withIndex("by_cycle", (q) => q.eq("cycleId", cycleId))
		.take(MAX_CYCLE_TASKS);
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

/**
 * Tells a team Cycle's Members and the other Founders about a lifecycle
 * change. A hackathon's own news goes out from the hackathon.
 */
export async function notifyCycle(
	ctx: MutationCtx,
	cycle: Doc<"cycles">,
	title: string,
	actorUserId: Id<"users">,
): Promise<void> {
	if (cycle.kind !== "team") {
		return;
	}
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
		target.kind !== "team" ||
		target.status !== "planned"
	) {
		throw new Error("Unfinished Tasks can only carry over to a planned Cycle");
	}
	return target;
}

/**
 * Moves a closing Cycle's unfinished Tasks, as they are, to `target`. Their
 * assignees join the target so they keep seeing their work.
 */
export async function carryOverTasks(
	ctx: MutationCtx,
	from: Doc<"cycles">,
	target: Doc<"cycles">,
): Promise<number> {
	const unfinished = (await loadCycleTasks(ctx, from._id)).filter((task) =>
		UNFINISHED_STATUSES.has(task.status),
	);
	const existing = await loadCycleTasks(ctx, target._id);
	if (existing.length + unfinished.length > MAX_CYCLE_TASKS) {
		throw new Error(`A Cycle can have at most ${MAX_CYCLE_TASKS} Tasks`);
	}

	const assignees = new Set<Id<"users">>();
	for (const task of unfinished) {
		await ctx.db.patch(task._id, { cycleId: target._id });
		if (task.assigneeUserId) {
			assignees.add(task.assigneeUserId);
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
