import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { requireFounderMembership, requireMembership } from "./lib/membership";
import { requireText } from "./lib/text";

export const list = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireMembership(ctx, args.startupId, userId);

		return await ctx.db
			.query("cycles")
			.withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
			.order("desc")
			.take(30);
	},
});

export const create = mutation({
	args: {
		startupId: v.id("startups"),
		title: v.string(),
		startAt: v.number(),
		endAt: v.number(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounderMembership(ctx, args.startupId, userId);

		if (args.endAt <= args.startAt) {
			throw new Error("Cycle end must be after start");
		}

		return await ctx.db.insert("cycles", {
			startupId: args.startupId,
			title: requireText(args.title, "Cycle title"),
			startAt: args.startAt,
			endAt: args.endAt,
			status: "planned",
		});
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
	},
});

export const close = mutation({
	args: { cycleId: v.id("cycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const cycle = await ctx.db.get(args.cycleId);
		if (!cycle) {
			throw new Error("Cycle not found");
		}

		await requireFounderMembership(ctx, cycle.startupId, userId);
		await ctx.db.patch(args.cycleId, { status: "closed" });
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
				cycles.push({
					...cycle,
					startupName: startup?.name ?? "Startup",
				});
			}
		}
		return cycles;
	},
});
