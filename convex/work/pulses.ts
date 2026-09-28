import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { logActivity } from "../lib/activity";
import { requireUserId } from "../lib/auth";
import { pulseHref } from "../lib/links";
import { MAX_BOARD_PULSES, MAX_PROOF_LINKS } from "../lib/limits";
import { notifyFounders } from "../lib/notify";
import { requireMembership } from "../lib/teams/membership";
import { assertUrl, optionalText, requireText } from "../lib/text";
import {
	createBoardPulse,
	requireBoardAccess,
	requireBoardOwner,
} from "../lib/work/boards";
import { requireCycleAccess } from "../lib/work/cycles";
import {
	currentStatus,
	loadPulseContext,
	proofLinksOf,
	requirePulse,
	requireSubmittedPulse,
	requireWorkablePulse,
	resolveReview,
	toPulse,
	withAssignees,
} from "../lib/work/pulses";
import { proofLinkKind, pulseStatus } from "../schema";

const PULSE_PAGE_SIZE = 80;
const MY_PULSES_PAGE_SIZE = 50;

export const listForCycle = query({
	args: { cycleId: v.id("cycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireCycleAccess(ctx, args.cycleId, userId);

		const pulses = await ctx.db
			.query("pulses")
			.withIndex("by_cycle", (q) => q.eq("cycleId", args.cycleId))
			.order("desc")
			.take(PULSE_PAGE_SIZE);

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

export const listBoard = query({
	args: {
		trialCycleId: v.id("trialCycles"),
		participantUserId: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}
		const ownerId = await requireBoardAccess(
			ctx,
			trial,
			userId,
			args.participantUserId,
		);

		const pulses = await ctx.db
			.query("pulses")
			.withIndex("by_trial_and_participant", (q) =>
				q.eq("trialCycleId", trial._id).eq("participantUserId", ownerId),
			)
			.take(MAX_BOARD_PULSES);

		return pulses.map(toPulse);
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
		const title = requireText(args.title, "Pulse title");

		if (args.trialCycleId) {
			return await createBoardPulse(ctx, {
				trialCycleId: args.trialCycleId,
				startupId: args.startupId,
				userId,
				title,
			});
		}

		await requireMembership(ctx, args.startupId, userId);
		if (!args.cycleId) {
			throw new Error("A Pulse must belong to a Cycle");
		}
		const { cycle } = await requireCycleAccess(ctx, args.cycleId, userId);
		if (cycle.startupId !== args.startupId) {
			throw new Error("Cycle not found");
		}

		return await ctx.db.insert("pulses", {
			startupId: args.startupId,
			cycleId: args.cycleId,
			title,
			status: "todo",
			createdByUserId: userId,
		});
	},
});

export const update = mutation({
	args: {
		pulseId: v.id("pulses"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { pulse } = await requireWorkablePulse(ctx, args.pulseId);
		await ctx.db.patch(pulse._id, {
			...(args.title !== undefined && {
				title: requireText(args.title, "Pulse title"),
			}),
			...(args.description !== undefined && {
				description: optionalText(args.description),
			}),
		});
	},
});

export const setStatus = mutation({
	args: {
		pulseId: v.id("pulses"),
		status: pulseStatus,
	},
	handler: async (ctx, args) => {
		const { pulse, context } = await requireWorkablePulse(ctx, args.pulseId);

		if (context.kind === "trial") {
			if (args.status === "review") {
				throw new Error("Pulses on a Board have no review step");
			}
			await ctx.db.patch(pulse._id, { status: args.status });
			return;
		}

		// "done" means a Founder verified it, so it is only reachable via review.
		if (args.status === "done") {
			throw new Error(
				"Only a Founder can verify a Pulse, once it is in review",
			);
		}
		await ctx.db.patch(pulse._id, { status: args.status });
		if (args.status === "review") {
			await notifyFounders(ctx, pulse.startupId, {
				kind: "pulse",
				title: `${pulse.title} is ready for review`,
				href: await pulseHref(ctx, pulse),
			});
		}
	},
});

export const verify = mutation({
	args: { pulseId: v.id("pulses") },
	handler: async (ctx, args) => {
		const pulse = await requireSubmittedPulse(ctx, args.pulseId);
		await resolveReview(ctx, pulse, { status: "done", reviewNote: undefined });
		await logActivity(ctx, {
			startupId: pulse.startupId,
			kind: "pulse_verified",
			actorUserId: await requireUserId(ctx),
			cycleId: pulse.cycleId,
			pulseId: pulse._id,
			summary: `Pulse "${pulse.title}" verified`,
		});
	},
});

export const reject = mutation({
	args: { pulseId: v.id("pulses"), note: v.string() },
	handler: async (ctx, args) => {
		const pulse = await requireSubmittedPulse(ctx, args.pulseId);
		await resolveReview(ctx, pulse, {
			status: "in_progress",
			reviewNote: requireText(args.note, "Review note"),
		});
	},
});

export const assignToMe = mutation({
	args: { pulseId: v.id("pulses") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { pulse } = await requireWorkablePulse(ctx, args.pulseId);
		await ctx.db.patch(pulse._id, {
			assigneeUserId: userId,
			status:
				currentStatus(pulse) === "todo" ? "in_progress" : currentStatus(pulse),
		});
	},
});

export const addProofLink = mutation({
	args: { pulseId: v.id("pulses"), kind: proofLinkKind, url: v.string() },
	handler: async (ctx, args) => {
		const { pulse } = await requireWorkablePulse(ctx, args.pulseId);
		const url = assertUrl(args.url, "Proof Link");
		if (!url) {
			throw new Error("Proof Link is required");
		}

		const links = proofLinksOf(pulse).filter((link) => link.url !== url);
		if (links.length >= MAX_PROOF_LINKS) {
			throw new Error(
				`A Pulse can have at most ${MAX_PROOF_LINKS} Proof Links`,
			);
		}
		await ctx.db.patch(pulse._id, {
			proofLinks: [...links, { kind: args.kind, url }],
			evidenceUrl: undefined,
		});
	},
});

export const removeProofLink = mutation({
	args: { pulseId: v.id("pulses"), url: v.string() },
	handler: async (ctx, args) => {
		const { pulse } = await requireWorkablePulse(ctx, args.pulseId);
		await ctx.db.patch(pulse._id, {
			proofLinks: proofLinksOf(pulse).filter((link) => link.url !== args.url),
			evidenceUrl: undefined,
		});
	},
});

export const remove = mutation({
	args: { pulseId: v.id("pulses") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const pulse = await requirePulse(ctx, args.pulseId);

		const context = await loadPulseContext(ctx, pulse);
		if (context.kind === "trial") {
			await requireBoardOwner(ctx, context.trial, pulse, userId);
			await ctx.db.delete(pulse._id);
			return;
		}

		const membership = await requireMembership(ctx, pulse.startupId, userId);
		if (membership.role !== "founder" && pulse.createdByUserId !== userId) {
			throw new Error("You cannot delete this Pulse");
		}

		await ctx.db.delete(pulse._id);
	},
});
