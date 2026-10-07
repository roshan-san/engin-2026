import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getHackathonApplication } from "../hiring/hackathons.rules";
import { MAX_BOARD_TASKS } from "../lib/limits";
import type { CycleRole } from "./cycles.rules";

type LaneCtx = QueryCtx | MutationCtx;

export const NO_BOARD_ACCESS_MESSAGE = "You do not have access to this Board";
export const NOT_YOUR_LANE_MESSAGE = "This Task is not on your lane";
export const FIXED_LANE_MESSAGE = "A hackathon Task stays on its lane";

/**
 * Whose lane the viewer may read on a hackathon's Cycle: a Participant only
 * their own (still after the close), a Founder anyone's. Members who aren't
 * Founders have no access to the Cycle at all (ADR 0003).
 */
export function requireLaneOwner(
	role: CycleRole,
	viewerUserId: Id<"users">,
	requestedOwnerId?: Id<"users">,
): Id<"users"> {
	const ownerId = requestedOwnerId ?? viewerUserId;
	if (role === "founder" || ownerId === viewerUserId) {
		return ownerId;
	}
	throw new Error(NO_BOARD_ACCESS_MESSAGE);
}

/** One lane: the Tasks assigned to `ownerId`. Never the unassigned Starter Tasks. */
export async function loadLane(
	ctx: LaneCtx,
	cycleId: Id<"cycles">,
	ownerId: Id<"users">,
): Promise<Doc<"tasks">[]> {
	return await ctx.db
		.query("tasks")
		.withIndex("by_cycle_and_assignee", (q) =>
			q.eq("cycleId", cycleId).eq("assigneeUserId", ownerId),
		)
		.take(MAX_BOARD_TASKS);
}

/** The hackathon a Cycle belongs to, if it is a hackathon's. */
export async function loadCycleHackathon(
	ctx: LaneCtx,
	cycle: Doc<"cycles">,
): Promise<Doc<"hackathons"> | null> {
	return cycle.hackathonId ? await ctx.db.get(cycle.hackathonId) : null;
}

/** Lanes change only while the hackathon runs. */
export async function requireActiveHackathon(
	ctx: LaneCtx,
	cycle: Doc<"cycles">,
): Promise<Doc<"hackathons">> {
	const hackathon = await loadCycleHackathon(ctx, cycle);
	if (hackathon?.status !== "active") {
		throw new Error("This Hackathon is not active");
	}
	return hackathon;
}

/** A lane Task is worked only by its owner; a Founder acts on it only by reviewing it. */
export async function requireLaneWork(
	ctx: LaneCtx,
	cycle: Doc<"cycles">,
	task: Doc<"tasks">,
	userId: Id<"users">,
): Promise<void> {
	if (task.assigneeUserId !== userId) {
		throw new Error(NOT_YOUR_LANE_MESSAGE);
	}
	await requireActiveHackathon(ctx, cycle);
}

/** A Participant adds a Task to their own lane, up to `MAX_BOARD_TASKS`. */
export async function createLaneTask(
	ctx: MutationCtx,
	cycle: Doc<"cycles">,
	role: CycleRole,
	userId: Id<"users">,
	title: string,
): Promise<Id<"tasks">> {
	if (role !== "participant") {
		throw new Error("Only Participants add Tasks to a hackathon");
	}
	await requireActiveHackathon(ctx, cycle);
	if ((await loadLane(ctx, cycle._id, userId)).length >= MAX_BOARD_TASKS) {
		throw new Error(`A Board can have at most ${MAX_BOARD_TASKS} Tasks`);
	}

	return await ctx.db.insert("tasks", {
		startupId: cycle.startupId,
		cycleId: cycle._id,
		assigneeUserId: userId,
		title,
		status: "todo",
		createdByUserId: userId,
	});
}

/** A Participant who left or withdrew; their Tasks in Review still need a Founder. */
export async function hasLeftHackathon(
	ctx: LaneCtx,
	hackathonId: Id<"hackathons">,
	userId: Id<"users">,
): Promise<boolean> {
	const application = await getHackathonApplication(ctx, hackathonId, userId);
	return (
		application?.status !== "accepted" && application?.status !== "completed"
	);
}
