import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { taskHref } from "../lib/links";
import { notify } from "../people/notifications.rules";
import { loadPublicUser } from "../people/users.rules";
import type { proofLink } from "../schema";
import { requireFounderMembership } from "../teams/membership.rules";
import { loadCycleHackathon, requireLaneWork } from "./boards.rules";
import {
	type CycleRole,
	getCycleAccess,
	requireCycleAccess,
	requireOpenCycle,
} from "./cycles.rules";

type TaskCtx = QueryCtx | MutationCtx;
type ProofLink = Infer<typeof proofLink>;

export const NO_PROOF_MESSAGE = "Add proof before sending this Task for review";

export function proofLinksOf(task: Doc<"tasks">): ProofLink[] {
	return task.proofLinks ?? [];
}

export function toTask(task: Doc<"tasks">) {
	return {
		_id: task._id,
		title: task.title,
		description: task.description ?? null,
		status: task.status,
		proofLinks: proofLinksOf(task),
		reviewNote: task.reviewNote ?? null,
		cycleId: task.cycleId,
		assigneeUserId: task.assigneeUserId ?? null,
	};
}

export async function withAssignees(ctx: QueryCtx, tasks: Doc<"tasks">[]) {
	const results = [];
	for (const task of tasks) {
		results.push({
			...toTask(task),
			assignee: await loadPublicUser(ctx, task.assigneeUserId),
		});
	}
	return results;
}

export async function requireTask(
	ctx: TaskCtx,
	taskId: Id<"tasks">,
): Promise<Doc<"tasks">> {
	const task = await ctx.db.get(taskId);
	if (!task) {
		throw new Error("Task not found");
	}
	return task;
}

/**
 * The one path to working a Task, on either kind of Cycle: the viewer can
 * open its Cycle, the Cycle is open (on a hackathon: it's their lane and the
 * hackathon runs), and the Task isn't locked in Review or Done, where only a
 * Founder's review moves it.
 */
export async function requireWorkableTask(
	ctx: MutationCtx,
	taskId: Id<"tasks">,
): Promise<{
	task: Doc<"tasks">;
	cycle: Doc<"cycles">;
	role: CycleRole;
	userId: Id<"users">;
}> {
	const userId = await requireUserId(ctx);
	const task = await requireTask(ctx, taskId);
	const { cycle, role } = await requireCycleAccess(ctx, task.cycleId, userId);
	if (cycle.kind === "hackathon") {
		await requireLaneWork(ctx, cycle, task, userId);
	} else {
		requireOpenCycle(cycle);
	}
	if (task.status === "review") {
		throw new Error("This Task is awaiting review");
	}
	if (task.status === "done") {
		throw new Error("This Task is already verified");
	}
	return { task, cycle, role, userId };
}

/** Loads a Submitted Task the current user, as a Founder, may review. */
export async function requireSubmittedTask(
	ctx: MutationCtx,
	taskId: Id<"tasks">,
): Promise<Doc<"tasks">> {
	const userId = await requireUserId(ctx);
	const task = await requireTask(ctx, taskId);
	await requireFounderMembership(ctx, task.startupId, userId);
	const cycle = await ctx.db.get(task.cycleId);
	if (cycle) {
		requireOpenCycle(cycle);
	}
	if (task.status !== "review") {
		throw new Error("This Task is not awaiting review");
	}
	return task;
}

export async function resolveReview(
	ctx: MutationCtx,
	task: Doc<"tasks">,
	outcome:
		| { status: "done"; reviewNote: undefined }
		| { status: "in_progress"; reviewNote: string },
): Promise<void> {
	await ctx.db.patch(task._id, outcome);
	if (!task.assigneeUserId) {
		return;
	}

	await notify(ctx, {
		userId: task.assigneeUserId,
		kind: "task",
		title:
			outcome.status === "done"
				? `${task.title} was verified`
				: `${task.title} needs changes`,
		body: outcome.reviewNote,
		href: await taskHref(ctx, task),
	});
}

/** Where a Task lives, as My Tasks labels and links it. */
export type TaskPlace =
	| { kind: "cycle"; cycleId: Id<"cycles">; title: string }
	| { kind: "hackathon"; hackathonId: Id<"hackathons">; title: string };

/** Labels a Cycle by what it is: a team Cycle by its title, a hackathon's by the hackathon. */
export async function placeOfCycle(
	ctx: QueryCtx,
	cycle: Doc<"cycles">,
): Promise<TaskPlace | null> {
	if (cycle.kind === "team") {
		return { kind: "cycle", cycleId: cycle._id, title: cycle.title };
	}
	const hackathon = await loadCycleHackathon(ctx, cycle);
	return hackathon
		? { kind: "hackathon", hackathonId: hackathon._id, title: hackathon.title }
		: null;
}

/**
 * Where `viewerId` can open `task`, or `null` once they can't: removed from
 * its Cycle, or no longer in its hackathon. `cache` is keyed by Cycle id so a
 * list resolves each one once.
 */
export async function loadTaskPlace(
	ctx: QueryCtx,
	task: Doc<"tasks">,
	viewerId: Id<"users">,
	cache: Map<Id<"cycles">, TaskPlace | null>,
): Promise<TaskPlace | null> {
	const cached = cache.get(task.cycleId);
	if (cached !== undefined) {
		return cached;
	}

	const access = await getCycleAccess(ctx, task.cycleId, viewerId);
	const place = access ? await placeOfCycle(ctx, access.cycle) : null;
	cache.set(task.cycleId, place);
	return place;
}
