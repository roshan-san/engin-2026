import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation, mutation, query } from "../_generated/server";
import { logActivity } from "../lib/activity";
import { requireUserId } from "../lib/auth";
import { MAX_CYCLE_MEMBERS } from "../lib/limits";
import { loadPublicUser } from "../lib/people/users";
import {
	requireFounderMembership,
	requireMembership,
} from "../lib/teams/membership";
import { requireText } from "../lib/text";
import {
	addCycleMember,
	getCycleMember,
	requireCycleAccess,
} from "../lib/work/cycles";
import {
	moveUnfinishedPulses,
	unassignPulsesInCycle,
} from "../lib/work/pulses";

export const list = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const membership = await requireMembership(ctx, args.startupId, userId);

		const cycles = await ctx.db
			.query("cycles")
			.withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
			.order("desc")
			.take(30);

		if (membership.role === "founder") {
			return cycles;
		}

		const visible = [];
		for (const cycle of cycles) {
			if (await getCycleMember(ctx, cycle._id, userId)) {
				visible.push(cycle);
			}
		}
		return visible;
	},
});

export const create = mutation({
	args: {
		startupId: v.id("startups"),
		title: v.string(),
		startAt: v.number(),
		endAt: v.number(),
		memberUserIds: v.optional(v.array(v.id("users"))),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounderMembership(ctx, args.startupId, userId);

		if (args.endAt <= args.startAt) {
			throw new Error("Cycle end must be after start");
		}

		const cycleId = await ctx.db.insert("cycles", {
			startupId: args.startupId,
			title: requireText(args.title, "Cycle title"),
			startAt: args.startAt,
			endAt: args.endAt,
			status: "planned",
		});

		const cycle = await ctx.db.get(cycleId);
		if (cycle) {
			for (const memberUserId of args.memberUserIds ?? []) {
				await addCycleMember(ctx, cycle, memberUserId);
			}
		}

		await ctx.scheduler.runAt(args.startAt, internal.work.cycles.autoStart, {
			cycleId,
		});

		return cycleId;
	},
});

export const autoStart = internalMutation({
	args: { cycleId: v.id("cycles") },
	handler: async (ctx, args) => {
		const cycle = await ctx.db.get(args.cycleId);
		if (cycle?.status !== "planned") {
			return;
		}

		const active = await ctx.db
			.query("cycles")
			.withIndex("by_startup_and_status", (q) =>
				q.eq("startupId", cycle.startupId).eq("status", "active"),
			)
			.take(10);
		for (const open of active) {
			await ctx.db.patch(open._id, { status: "closed" });
		}

		await ctx.db.patch(args.cycleId, { status: "active" });
		await logActivity(ctx, {
			startupId: cycle.startupId,
			kind: "cycle_started",
			cycleId: cycle._id,
			summary: `Cycle "${cycle.title}" started`,
		});
	},
});

export const addMember = mutation({
	args: { cycleId: v.id("cycles"), userId: v.id("users") },
	handler: async (ctx, args) => {
		const founderId = await requireUserId(ctx);
		const cycle = await ctx.db.get(args.cycleId);
		if (!cycle) {
			throw new Error("Cycle not found");
		}
		await requireFounderMembership(ctx, cycle.startupId, founderId);

		await addCycleMember(ctx, cycle, args.userId);
	},
});

export const removeMember = mutation({
	args: { cycleId: v.id("cycles"), userId: v.id("users") },
	handler: async (ctx, args) => {
		const founderId = await requireUserId(ctx);
		const cycle = await ctx.db.get(args.cycleId);
		if (!cycle) {
			throw new Error("Cycle not found");
		}
		await requireFounderMembership(ctx, cycle.startupId, founderId);

		const cycleMember = await getCycleMember(ctx, args.cycleId, args.userId);
		if (cycleMember) {
			await ctx.db.delete(cycleMember._id);
			await unassignPulsesInCycle(ctx, args.cycleId, args.userId);
		}
	},
});

export const listMembers = query({
	args: { cycleId: v.id("cycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireCycleAccess(ctx, args.cycleId, userId);

		const members = await ctx.db
			.query("cycleMembers")
			.withIndex("by_cycle", (q) => q.eq("cycleId", args.cycleId))
			.take(MAX_CYCLE_MEMBERS);

		const users = [];
		for (const member of members) {
			const user = await loadPublicUser(ctx, member.userId);
			if (user) {
				users.push(user);
			}
		}
		return users;
	},
});

export const start = mutation({
	args: { cycleId: v.id("cycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const cycle = await ctx.db.get(args.cycleId);
		if (!cycle) {
			throw new Error("Cycle not found");
		}

		await requireFounderMembership(ctx, cycle.startupId, userId);

		const active = await ctx.db
			.query("cycles")
			.withIndex("by_startup_and_status", (q) =>
				q.eq("startupId", cycle.startupId).eq("status", "active"),
			)
			.take(10);

		for (const open of active) {
			await ctx.db.patch(open._id, { status: "closed" });
		}

		await ctx.db.patch(args.cycleId, { status: "active" });
		await logActivity(ctx, {
			startupId: cycle.startupId,
			kind: "cycle_started",
			actorUserId: userId,
			cycleId: cycle._id,
			summary: `Cycle "${cycle.title}" started`,
		});
	},
});

export const close = mutation({
	args: {
		cycleId: v.id("cycles"),
		carryOverToCycleId: v.optional(v.id("cycles")),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const cycle = await ctx.db.get(args.cycleId);
		if (!cycle) {
			throw new Error("Cycle not found");
		}

		await requireFounderMembership(ctx, cycle.startupId, userId);

		if (args.carryOverToCycleId) {
			const target = await ctx.db.get(args.carryOverToCycleId);
			if (
				!target ||
				target.startupId !== cycle.startupId ||
				target.status === "closed"
			) {
				throw new Error("Choose a planned or active Cycle to carry work into");
			}
			await moveUnfinishedPulses(ctx, cycle._id, target._id);
		}

		await ctx.db.patch(args.cycleId, { status: "closed" });
		await logActivity(ctx, {
			startupId: cycle.startupId,
			kind: "cycle_closed",
			actorUserId: userId,
			cycleId: cycle._id,
			summary: `Cycle "${cycle.title}" closed`,
		});
	},
});

export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const memberships = await ctx.db
			.query("memberships")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.take(20);

		const cycles = [];
		for (const membership of memberships) {
			const items = await ctx.db
				.query("cycles")
				.withIndex("by_startup", (q) => q.eq("startupId", membership.startupId))
				.take(20);
			const startup = await ctx.db.get(membership.startupId);
			for (const cycle of items) {
				if (
					membership.role !== "founder" &&
					!(await getCycleMember(ctx, cycle._id, userId))
				) {
					continue;
				}
				cycles.push({
					...cycle,
					startupName: startup?.name ?? "Startup",
				});
			}
		}
		return cycles;
	},
});
