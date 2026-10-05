import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { MAX_LISTED_CYCLES } from "../lib/limits";
import { requireText } from "../lib/text";
import { loadPublicUser } from "../people/users.rules";
import { logActivity } from "../teams/activity.rules";
import {
	requireFounderMembership,
	requireMembership,
} from "../teams/membership.rules";
import {
	addCycleMember,
	carryOverPulses,
	getCycleAccess,
	getCycleMember,
	loadCycleMembers,
	notifyCycle,
	requireCarryOverTarget,
	requireFounderCycle,
	requireOpenCycle,
} from "./cycles.rules";

export const list = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const membership = await requireMembership(ctx, args.startupId, userId);

		const cycles = await ctx.db
			.query("cycles")
			.withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
			.order("desc")
			.take(MAX_LISTED_CYCLES);

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

/** One Cycle for its screen; `null` when it is missing or the viewer is outside it. */
export const get = query({
	args: { cycleId: v.id("cycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const access = await getCycleAccess(ctx, args.cycleId, userId);
		if (!access) {
			return null;
		}
		const { cycle, membership } = access;
		const isFounder = membership.role === "founder";

		const members = [];
		for (const member of await loadCycleMembers(ctx, cycle._id)) {
			const user = await loadPublicUser(ctx, member.userId);
			if (user) {
				members.push(user);
			}
		}

		const plannedCycles = isFounder
			? (
					await ctx.db
						.query("cycles")
						.withIndex("by_startup_and_status", (q) =>
							q.eq("startupId", cycle.startupId).eq("status", "planned"),
						)
						.take(MAX_LISTED_CYCLES)
				).map((item) => ({ _id: item._id, title: item.title }))
			: [];

		return { cycle, isFounder, members, plannedCycles };
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
		return cycleId;
	},
});

export const start = mutation({
	args: { cycleId: v.id("cycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const cycle = await requireFounderCycle(ctx, args.cycleId, userId);
		if (cycle.status !== "planned") {
			throw new Error("Only a planned Cycle can be started");
		}
		const active = await ctx.db
			.query("cycles")
			.withIndex("by_startup_and_status", (q) =>
				q.eq("startupId", cycle.startupId).eq("status", "active"),
			)
			.first();
		if (active) {
			throw new Error("Close the active Cycle before starting another");
		}

		await ctx.db.patch(cycle._id, { status: "active" });
		await notifyCycle(ctx, cycle, `Cycle ${cycle.title} started`, userId);
		await logActivity(ctx, {
			startupId: cycle.startupId,
			kind: "cycle_started",
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
		const cycle = await requireFounderCycle(ctx, args.cycleId, userId);
		if (cycle.status !== "active") {
			throw new Error("Only an active Cycle can be closed");
		}

		let carried = 0;
		if (args.carryOverToCycleId) {
			const target = await requireCarryOverTarget(
				ctx,
				cycle,
				args.carryOverToCycleId,
			);
			carried = await carryOverPulses(ctx, cycle, target);
		}

		await ctx.db.patch(cycle._id, { status: "closed" });
		await notifyCycle(ctx, cycle, `Cycle ${cycle.title} closed`, userId);
		await logActivity(ctx, {
			startupId: cycle.startupId,
			kind: "cycle_closed",
			cycleId: cycle._id,
			summary:
				carried > 0
					? `Cycle "${cycle.title}" closed, ${carried} unfinished Pulse${carried === 1 ? "" : "s"} carried over`
					: `Cycle "${cycle.title}" closed`,
		});
	},
});

export const addMember = mutation({
	args: { cycleId: v.id("cycles"), userId: v.id("users") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const cycle = await requireFounderCycle(ctx, args.cycleId, userId);
		requireOpenCycle(cycle);
		await addCycleMember(ctx, cycle, args.userId);
	},
});

export const removeMember = mutation({
	args: { cycleId: v.id("cycles"), userId: v.id("users") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const cycle = await requireFounderCycle(ctx, args.cycleId, userId);
		requireOpenCycle(cycle);
		const member = await getCycleMember(ctx, cycle._id, args.userId);
		if (member) {
			await ctx.db.delete(member._id);
		}
	},
});
