import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { requireMembership } from "./lib/membership";
import {
	requirePulse,
	requireSubmittedPulse,
	requireWorkablePulse,
	resolveReview,
	toPulse,
	withAssignees,
} from "./lib/pulses";
import { refreshUserScore } from "./lib/score";
import { assertUrl, requireText } from "./lib/text";
import { isTrialLive, requireTrialAccess } from "./lib/trials";
import { pulseStatus } from "./schema";

const PULSE_PAGE_SIZE = 80;
const MY_PULSES_PAGE_SIZE = 50;

export const listForStartup = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireMembership(ctx, args.startupId, userId);

		const pulses = await ctx.db
			.query("pulses")
			.withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
			.order("desc")
			.take(PULSE_PAGE_SIZE);

		return await withAssignees(
			ctx,
			pulses.filter((pulse) => !pulse.trialCycleId),
		);
	},
});

export const listForCycle = query({
	args: { cycleId: v.id("cycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const cycle = await ctx.db.get(args.cycleId);
		if (!cycle) {
			return [];
		}

		await requireMembership(ctx, cycle.startupId, userId);

		const assigned = await ctx.db
			.query("pulses")
			.withIndex("by_cycle", (q) => q.eq("cycleId", args.cycleId))
			.order("desc")
			.take(PULSE_PAGE_SIZE);

		const seen = new Set(assigned.map((pulse) => pulse._id));
		const pulses = [...assigned];

		if (cycle.status === "active") {
			const startupPulses = await ctx.db
				.query("pulses")
				.withIndex("by_startup", (q) => q.eq("startupId", cycle.startupId))
				.take(PULSE_PAGE_SIZE);

			for (const pulse of startupPulses) {
				if (pulse.trialCycleId || pulse.cycleId || seen.has(pulse._id)) {
					continue;
				}
				pulses.push(pulse);
			}
		}

		return await withAssignees(ctx, pulses);
	},
});

export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const pulses = await ctx.db
			.query("pulses")
			.withIndex("by_assignee", (q) => q.eq("assigneeUserId", userId))
			.order("desc")
			.take(MY_PULSES_PAGE_SIZE);

		const results = [];
		for (const pulse of pulses) {
			const startup = await ctx.db.get(pulse.startupId);
			results.push({
				...toPulse(pulse),
				startupName: startup?.name ?? "Startup",
			});
		}
		return results;
	},
});

export const listForTrial = query({
	args: { trialCycleId: v.id("trialCycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}
		await requireTrialAccess(ctx, trial, userId);

		const pulses = await ctx.db
			.query("pulses")
			.withIndex("by_trial", (q) => q.eq("trialCycleId", args.trialCycleId))
			.order("desc")
			.take(PULSE_PAGE_SIZE);

		return await withAssignees(ctx, pulses);
	},
});

export const create = mutation({
	args: {
		startupId: v.id("startups"),
		title: v.string(),
		cycleId: v.optional(v.id("cycles")),
		trialCycleId: v.optional(v.id("trialCycles")),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireMembership(ctx, args.startupId, userId);
		const title = requireText(args.title, "Pulse title");

		if (args.trialCycleId) {
			const trial = await ctx.db.get(args.trialCycleId);
			if (!trial || trial.startupId !== args.startupId) {
				throw new Error("Trial Cycle not found");
			}
			if (!isTrialLive(trial)) {
				throw new Error("This Trial Cycle has ended");
			}
		}

		return await ctx.db.insert("pulses", {
			startupId: args.startupId,
			cycleId: args.cycleId,
			trialCycleId: args.trialCycleId,
			title,
			status: "backlog",
			createdByUserId: userId,
		});
	},
});

export const setStatus = mutation({
	args: {
		pulseId: v.id("pulses"),
		status: pulseStatus,
	},
	handler: async (ctx, args) => {
		const pulse = await requireWorkablePulse(ctx, args.pulseId);
		if (args.status === "review") {
			throw new Error("Mark the Pulse done to submit it for review");
		}

		// Trial work only counts once a Member verifies it.
		const status =
			pulse.trialCycleId && args.status === "done" ? "review" : args.status;
		await ctx.db.patch(pulse._id, { status });
	},
});

export const verify = mutation({
	args: { pulseId: v.id("pulses") },
	handler: async (ctx, args) => {
		const pulse = await requireSubmittedPulse(ctx, args.pulseId);
		await resolveReview(ctx, pulse, { status: "done", reviewNote: undefined });
	},
});

export const reject = mutation({
	args: { pulseId: v.id("pulses"), note: v.string() },
	handler: async (ctx, args) => {
		const pulse = await requireSubmittedPulse(ctx, args.pulseId);
		await resolveReview(ctx, pulse, {
			status: "active",
			reviewNote: requireText(args.note, "Review note"),
		});
	},
});

export const assignToMe = mutation({
	args: { pulseId: v.id("pulses") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const pulse = await requireWorkablePulse(ctx, args.pulseId);
		await ctx.db.patch(pulse._id, {
			assigneeUserId: userId,
			status: pulse.status === "backlog" ? "active" : pulse.status,
		});
	},
});

export const setEvidence = mutation({
	args: {
		pulseId: v.id("pulses"),
		evidenceUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const pulse = await requireWorkablePulse(ctx, args.pulseId);
		await ctx.db.patch(pulse._id, {
			evidenceUrl: assertUrl(args.evidenceUrl, "Evidence"),
		});
	},
});

export const remove = mutation({
	args: { pulseId: v.id("pulses") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const pulse = await requirePulse(ctx, args.pulseId);

		const membership = await requireMembership(ctx, pulse.startupId, userId);
		if (membership.role !== "founder" && pulse.createdByUserId !== userId) {
			throw new Error("You cannot delete this Pulse");
		}

		await ctx.db.delete(pulse._id);
		if (pulse.trialCycleId && pulse.assigneeUserId) {
			await refreshUserScore(ctx, pulse.assigneeUserId);
		}
	},
});
