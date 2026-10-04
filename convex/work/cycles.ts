import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation, mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { requireText } from "../lib/text";
import { logActivity } from "../teams/activity.rules";
import {
	requireFounderMembership,
	requireMembership,
} from "../teams/membership.rules";
import { addCycleMember, getCycleMember } from "./cycles.rules";

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
