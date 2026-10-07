import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import {
	MAX_CYCLE_TASKS,
	MAX_PROOF_LINKS,
	MAX_USER_TASKS,
} from "../lib/limits";
import { taskHref } from "../lib/links";
import { assertUrl, optionalText, requireText } from "../lib/text";
import { notifyFounders } from "../people/notifications.rules";
import { loadPublicUser } from "../people/users.rules";
import { proofLinkKind, taskStatus } from "../schema";
import { logActivity } from "../teams/activity.rules";
import { loadMembershipsOf } from "../teams/membership.rules";
import {
	createLaneTask,
	FIXED_LANE_MESSAGE,
	hasLeftHackathon,
	loadLane,
	NO_BOARD_ACCESS_MESSAGE,
	requireLaneOwner,
} from "./boards.rules";
import {
	getCycleAccess,
	loadCycleTasks,
	requireCycleAccess,
	requireOpenCycle,
} from "./cycles.rules";
import {
	loadTaskPlace,
	NO_PROOF_MESSAGE,
	placeOfCycle,
	proofLinksOf,
	requireSubmittedTask,
	requireTask,
	requireWorkableTask,
	resolveReview,
	type TaskPlace,
	toTask,
	withAssignees,
} from "./tasks.rules";

/** A team Cycle's whole board. A hackathon's is read a lane at a time. */
export const listForCycle = query({
	args: { cycleId: v.id("cycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { cycle, role } = await requireCycleAccess(ctx, args.cycleId, userId);
		if (cycle.kind === "hackathon") {
			throw new Error("Open this board from its hackathon");
		}

		const tasks = await ctx.db
			.query("tasks")
			.withIndex("by_cycle", (q) => q.eq("cycleId", args.cycleId))
			.order("desc")
			.take(MAX_CYCLE_TASKS);

		const isFounder = role === "founder";
		return (await withAssignees(ctx, tasks)).map((task, index) => ({
			...task,
			/** Its creator or a Founder; the status lock still applies. */
			canDelete: isFounder || tasks[index]?.createdByUserId === userId,
		}));
	},
});

/**
 * One Participant's lane on a hackathon's Cycle: their own for a Participant,
 * anyone's for a Founder.
 */
export const listLane = query({
	args: {
		cycleId: v.id("cycles"),
		assigneeUserId: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const access = await getCycleAccess(ctx, args.cycleId, userId);
		if (access?.cycle.kind !== "hackathon") {
			throw new Error(NO_BOARD_ACCESS_MESSAGE);
		}
		const ownerId = requireLaneOwner(access.role, userId, args.assigneeUserId);

		const tasks = await loadLane(ctx, access.cycle._id, ownerId);
		// Same shape as a team board's Tasks; the lane owner may delete any of theirs.
		return (await withAssignees(ctx, tasks)).map((task) => ({
			...task,
			canDelete: true,
		}));
	},
});

/**
 * Every Task in Review across a hackathon's lanes, oldest first, for a
 * Founder. `truncated` says there were more than `MAX_CYCLE_TASKS`.
 */
export const listReview = query({
	args: { cycleId: v.id("cycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const access = await getCycleAccess(ctx, args.cycleId, userId);
		if (access?.role !== "founder") {
			throw new Error(NO_BOARD_ACCESS_MESSAGE);
		}
		const { cycle } = access;

		const inReview = await ctx.db
			.query("tasks")
			.withIndex("by_cycle_and_status", (q) =>
				q.eq("cycleId", cycle._id).eq("status", "review"),
			)
			.take(MAX_CYCLE_TASKS + 1);

		const left = new Map<Id<"users">, boolean>();
		const tasks = [];
		for (const task of inReview.slice(0, MAX_CYCLE_TASKS)) {
			const assigneeId = task.assigneeUserId;
			if (assigneeId && cycle.hackathonId && !left.has(assigneeId)) {
				left.set(
					assigneeId,
					await hasLeftHackathon(ctx, cycle.hackathonId, assigneeId),
				);
			}
			tasks.push({
				...toTask(task),
				assignee: await loadPublicUser(ctx, assigneeId),
				assigneeLeft: assigneeId ? (left.get(assigneeId) ?? false) : false,
			});
		}
		return { tasks, truncated: inReview.length > MAX_CYCLE_TASKS };
	},
});

/** The viewer's own Tasks, newest first, on Cycles and hackathons they can still open. */
export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const tasks = await ctx.db
			.query("tasks")
			.withIndex("by_assignee", (q) => q.eq("assigneeUserId", userId))
			.order("desc")
			.take(MAX_USER_TASKS);

		const places = new Map<Id<"cycles">, TaskPlace | null>();
		const startups = new Map<Id<"startups">, Doc<"startups"> | null>();
		const results = [];
		for (const task of tasks) {
			const place = await loadTaskPlace(ctx, task, userId, places);
			if (!place) {
				continue;
			}
			if (!startups.has(task.startupId)) {
				startups.set(task.startupId, await ctx.db.get(task.startupId));
			}
			const startup = startups.get(task.startupId);
			if (!startup) {
				continue;
			}
			results.push({
				...toTask(task),
				startupName: startup.name,
				startupSlug: startup.slug,
				place,
			});
		}
		return results;
	},
});

/** Tasks awaiting review on open Cycles, hackathons included, across every Startup the viewer founds. */
export const listToReview = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const memberships = await loadMembershipsOf(ctx, userId);

		const results = [];
		for (const { startup, role } of memberships) {
			if (role !== "founder") {
				continue;
			}
			const tasks = await ctx.db
				.query("tasks")
				.withIndex("by_startup_and_status", (q) =>
					q.eq("startupId", startup._id).eq("status", "review"),
				)
				.take(MAX_CYCLE_TASKS);
			const places = new Map<Id<"cycles">, TaskPlace | null>();
			for (const task of tasks) {
				if (!places.has(task.cycleId)) {
					const cycle = await ctx.db.get(task.cycleId);
					places.set(
						task.cycleId,
						cycle && cycle.status !== "closed"
							? await placeOfCycle(ctx, cycle)
							: null,
					);
				}
				const place = places.get(task.cycleId);
				if (!place) {
					continue;
				}
				results.push({
					...toTask(task),
					assignee: await loadPublicUser(ctx, task.assigneeUserId),
					startupName: startup.name,
					startupSlug: startup.slug,
					place,
				});
			}
		}
		return results;
	},
});

/** On a team Cycle anyone in it adds work; on a hackathon a Participant adds to their own lane. */
export const create = mutation({
	args: {
		startupId: v.id("startups"),
		title: v.string(),
		cycleId: v.id("cycles"),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const title = requireText(args.title, "Task title");
		const { cycle, role } = await requireCycleAccess(ctx, args.cycleId, userId);
		if (cycle.startupId !== args.startupId) {
			throw new Error("Cycle not found");
		}

		if (cycle.kind === "hackathon") {
			return await createLaneTask(ctx, cycle, role, userId, title);
		}

		requireOpenCycle(cycle);
		if ((await loadCycleTasks(ctx, cycle._id)).length >= MAX_CYCLE_TASKS) {
			throw new Error(`A Cycle can have at most ${MAX_CYCLE_TASKS} Tasks`);
		}
		return await ctx.db.insert("tasks", {
			startupId: args.startupId,
			cycleId: cycle._id,
			title,
			status: "todo",
			createdByUserId: userId,
		});
	},
});

export const update = mutation({
	args: {
		taskId: v.id("tasks"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { task } = await requireWorkableTask(ctx, args.taskId);
		await ctx.db.patch(task._id, {
			...(args.title !== undefined && {
				title: requireText(args.title, "Task title"),
			}),
			...(args.description !== undefined && {
				description: optionalText(args.description),
			}),
		});
	},
});

/** Todo, In progress and Review; only a Founder's `verify` reaches Done. */
export const setStatus = mutation({
	args: {
		taskId: v.id("tasks"),
		status: taskStatus,
	},
	handler: async (ctx, args) => {
		const { task, userId } = await requireWorkableTask(ctx, args.taskId);
		if (args.status === "done") {
			throw new Error("Only a Founder can verify a Task, once it is in review");
		}
		if (args.status === "review" && proofLinksOf(task).length === 0) {
			throw new Error(NO_PROOF_MESSAGE);
		}

		await ctx.db.patch(task._id, { status: args.status });
		if (args.status === "review") {
			await notifyFounders(
				ctx,
				task.startupId,
				{
					kind: "task",
					title: `${task.title} is ready for review`,
					href: await taskHref(ctx, task),
				},
				{ except: userId },
			);
		}
	},
});

export const verify = mutation({
	args: { taskId: v.id("tasks") },
	handler: async (ctx, args) => {
		const task = await requireSubmittedTask(ctx, args.taskId);
		await resolveReview(ctx, task, { status: "done", reviewNote: undefined });
		await logActivity(ctx, {
			startupId: task.startupId,
			kind: "task_verified",
			cycleId: task.cycleId,
			taskId: task._id,
			summary: `Task "${task.title}" verified`,
		});
	},
});

export const reject = mutation({
	args: { taskId: v.id("tasks"), note: v.string() },
	handler: async (ctx, args) => {
		const task = await requireSubmittedTask(ctx, args.taskId);
		await resolveReview(ctx, task, {
			status: "in_progress",
			reviewNote: requireText(args.note, "Review note"),
		});
	},
});

export const assignToMe = mutation({
	args: { taskId: v.id("tasks") },
	handler: async (ctx, args) => {
		const task = await requireTask(ctx, args.taskId);
		const cycle = await ctx.db.get(task.cycleId);
		if (cycle?.kind === "hackathon") {
			throw new Error(FIXED_LANE_MESSAGE);
		}
		const { userId } = await requireWorkableTask(ctx, args.taskId);
		if (task.assigneeUserId && task.assigneeUserId !== userId) {
			throw new Error("Someone else has taken this Task");
		}
		await ctx.db.patch(task._id, {
			assigneeUserId: userId,
			status: task.status === "todo" ? "in_progress" : task.status,
		});
	},
});

export const addProofLink = mutation({
	args: { taskId: v.id("tasks"), kind: proofLinkKind, url: v.string() },
	handler: async (ctx, args) => {
		const { task } = await requireWorkableTask(ctx, args.taskId);
		const url = assertUrl(args.url, "Proof Link");
		if (!url) {
			throw new Error("Proof Link is required");
		}

		const links = proofLinksOf(task).filter((link) => link.url !== url);
		if (links.length >= MAX_PROOF_LINKS) {
			throw new Error(`A Task can have at most ${MAX_PROOF_LINKS} Proof Links`);
		}
		await ctx.db.patch(task._id, {
			proofLinks: [...links, { kind: args.kind, url }],
		});
	},
});

export const removeProofLink = mutation({
	args: { taskId: v.id("tasks"), url: v.string() },
	handler: async (ctx, args) => {
		const { task } = await requireWorkableTask(ctx, args.taskId);
		await ctx.db.patch(task._id, {
			proofLinks: proofLinksOf(task).filter((link) => link.url !== args.url),
		});
	},
});

/** Its creator or a Founder on a team Cycle; the lane's owner on a hackathon. */
export const remove = mutation({
	args: { taskId: v.id("tasks") },
	handler: async (ctx, args) => {
		const { task, cycle, role, userId } = await requireWorkableTask(
			ctx,
			args.taskId,
		);
		if (
			cycle.kind === "team" &&
			role !== "founder" &&
			task.createdByUserId !== userId
		) {
			throw new Error("You cannot delete this Task");
		}

		await ctx.db.delete(task._id);
	},
});
