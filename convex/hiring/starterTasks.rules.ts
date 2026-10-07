import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_STARTER_TASKS, STARTER_TASK_TEXT_LIMITS } from "../lib/limits";
import { hackathonHref } from "../lib/links";
import { limitText, requireLimitedText } from "../lib/text";
import { notify } from "../people/notifications.rules";
import { logActivity } from "../teams/activity.rules";
import { listHackathonApplications } from "./hackathons.rules";

export type StarterTaskInput = { title: string; description?: string };

/** A Starter Task's text, trimmed and bounded. */
export function buildStarterTaskFields(item: StarterTaskInput) {
	return {
		title: requireLimitedText(
			item.title,
			"Starter Task title",
			STARTER_TASK_TEXT_LIMITS.title,
		),
		description: limitText(
			item.description,
			"Starter Task description",
			STARTER_TASK_TEXT_LIMITS.description,
		),
	};
}

export function requireStarterTaskRoom(count: number): void {
	if (count > MAX_STARTER_TASKS) {
		throw new Error(
			`A hackathon can have at most ${MAX_STARTER_TASKS} Starter Tasks`,
		);
	}
}

/**
 * Starter Tasks change while the hackathon is a draft, open or running; once
 * running, changes reach every current Participant's Board.
 */
export function requireStarterTasksEditable(
	hackathon: Doc<"hackathons">,
): void {
	if (
		hackathon.status !== "draft" &&
		hackathon.status !== "open" &&
		hackathon.status !== "active"
	) {
		throw new Error("Starter Tasks can't change after the Hackathon ends");
	}
}

type HackathonCycle = Pick<Doc<"hackathons">, "startupId" | "cycleId">;

/**
 * A Starter Task is a template: a Task on the hackathon's Cycle assigned to
 * nobody, so no lane or My Tasks read ever finds it.
 */
export async function loadStarterTasks(
	ctx: QueryCtx | MutationCtx,
	hackathon: Pick<Doc<"hackathons">, "cycleId">,
) {
	return await ctx.db
		.query("tasks")
		.withIndex("by_cycle_and_assignee", (q) =>
			q.eq("cycleId", hackathon.cycleId).eq("assigneeUserId", undefined),
		)
		.take(MAX_STARTER_TASKS);
}

/** Loads a Starter Task and its hackathon, refusing any Task that is on a lane or a team Cycle. */
export async function requireStarterTask(
	ctx: QueryCtx | MutationCtx,
	taskId: Id<"tasks">,
): Promise<{ starterTask: Doc<"tasks">; hackathonId: Id<"hackathons"> }> {
	const task = await ctx.db.get(taskId);
	const cycle = task ? await ctx.db.get(task.cycleId) : null;
	if (!task || task.assigneeUserId !== undefined || !cycle?.hackathonId) {
		throw new Error("Starter Task not found");
	}
	return { starterTask: task, hackathonId: cycle.hackathonId };
}

export async function insertStarterTask(
	ctx: MutationCtx,
	hackathon: HackathonCycle,
	item: StarterTaskInput,
	userId: Id<"users">,
): Promise<Id<"tasks">> {
	return await ctx.db.insert("tasks", {
		startupId: hackathon.startupId,
		cycleId: hackathon.cycleId,
		...buildStarterTaskFields(item),
		status: "todo",
		createdByUserId: userId,
	});
}

/**
 * Gives each Participant their own copy of one Starter Task on their lane,
 * e.g. one added mid-hackathon. The copy is theirs: editing the Starter Task
 * never changes it.
 */
export async function seedStarterTask(
	ctx: MutationCtx,
	starterTask: Doc<"tasks">,
	participantUserIds: Id<"users">[],
): Promise<void> {
	for (const participantUserId of participantUserIds) {
		await ctx.db.insert("tasks", {
			startupId: starterTask.startupId,
			cycleId: starterTask.cycleId,
			assigneeUserId: participantUserId,
			title: starterTask.title,
			description: starterTask.description,
			status: "todo",
			createdByUserId: starterTask.createdByUserId,
		});
	}
}

export async function seedLanes(
	ctx: MutationCtx,
	hackathon: HackathonCycle,
	participantUserIds: Id<"users">[],
): Promise<void> {
	for (const starterTask of await loadStarterTasks(ctx, hackathon)) {
		await seedStarterTask(ctx, starterTask, participantUserIds);
	}
}

/**
 * A draft's Starter Tasks become exactly `items`, in order. Safe to delete and
 * reinsert: no lane holds a copy until the start.
 */
export async function replaceStarterTasks(
	ctx: MutationCtx,
	hackathon: HackathonCycle,
	items: StarterTaskInput[],
	userId: Id<"users">,
): Promise<void> {
	requireStarterTaskRoom(items.length);
	items.forEach(buildStarterTaskFields);

	for (const starterTask of await loadStarterTasks(ctx, hackathon)) {
		await ctx.db.delete(starterTask._id);
	}
	for (const item of items) {
		await insertStarterTask(ctx, hackathon, item, userId);
	}
}

/** Mid-hackathon changes reach whoever is in now: Participants who left are out. */
export async function listCurrentParticipantIds(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
): Promise<Id<"users">[]> {
	if (hackathon.status !== "active") {
		return [];
	}
	const applications = await listHackathonApplications(ctx, hackathon._id);
	return applications
		.filter((application) => application.status === "accepted")
		.map((application) => application.userId);
}

/** Tells each current Participant and logs it for the Startup. */
export async function announceStarterTaskChange(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	participantIds: Id<"users">[],
	title: string,
	kind: "hackathon_starter_task_added" | "hackathon_starter_task_removed",
) {
	const href = await hackathonHref(ctx, hackathon);
	for (const userId of participantIds) {
		await notify(ctx, { userId, kind: "hackathon", title, href });
	}
	await logActivity(ctx, {
		startupId: hackathon.startupId,
		kind,
		hackathonId: hackathon._id,
		summary: title,
	});
}
