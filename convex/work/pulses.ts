import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import {
	MAX_BOARD_PULSES,
	MAX_CYCLE_PULSES,
	MAX_PROOF_LINKS,
	MAX_USER_PULSES,
} from "../lib/limits";
import { pulseHref } from "../lib/links";
import { assertUrl, optionalText, requireText } from "../lib/text";
import { notifyFounders } from "../people/notifications.rules";
import { proofLinkKind, pulseStatus } from "../schema";
import { logActivity } from "../teams/activity.rules";
import { loadPublicUser } from "../people/users.rules";
import {
	loadMembershipsOf,
	requireMembership,
} from "../teams/membership.rules";
import { createBoardPulse, requireBoardAccess } from "./boards.rules";
import {
	loadCyclePulses,
	requireCycleAccess,
	requireOpenCycle,
} from "./cycles.rules";
import {
	loadPulsePlace,
	type PulsePlace,
	proofLinksOf,
	requireSubmittedPulse,
	requireWorkablePulse,
	resolveReview,
	toPulse,
	withAssignees,
} from "./pulses.rules";

export const listForCycle = query({
	args: { cycleId: v.id("cycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { membership } = await requireCycleAccess(ctx, args.cycleId, userId);

		const pulses = await ctx.db
			.query("pulses")
			.withIndex("by_cycle", (q) => q.eq("cycleId", args.cycleId))
			.order("desc")
			.take(MAX_CYCLE_PULSES);

		const isFounder = membership.role === "founder";
		return (await withAssignees(ctx, pulses)).map((pulse, index) => ({
			...pulse,
			/** Its creator or a Founder; the status lock still applies. */
			canDelete: isFounder || pulses[index]?.createdByUserId === userId,
		}));
	},
});

/** The viewer's own Pulses, newest first, on Cycles and Boards they can still open. */
export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const pulses = await ctx.db
			.query("pulses")
			.withIndex("by_assignee", (q) => q.eq("assigneeUserId", userId))
			.order("desc")
			.take(MAX_USER_PULSES);

		const places = new Map<string, PulsePlace | null>();
		const startups = new Map<Id<"startups">, Doc<"startups"> | null>();
		const results = [];
		for (const pulse of pulses) {
			const place = await loadPulsePlace(ctx, pulse, userId, places);
			if (!place) {
				continue;
			}
			if (!startups.has(pulse.startupId)) {
				startups.set(pulse.startupId, await ctx.db.get(pulse.startupId));
			}
			const startup = startups.get(pulse.startupId);
			if (!startup) {
				continue;
			}
			results.push({
				...toPulse(pulse),
				startupName: startup.name,
				startupSlug: startup.slug,
				place,
			});
		}
		return results;
	},
});

/** Cycle Pulses awaiting review across every Startup the viewer founds. */
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
			const pulses = await ctx.db
				.query("pulses")
				.withIndex("by_startup_and_status", (q) =>
					q.eq("startupId", startup._id).eq("status", "review"),
				)
				.take(MAX_CYCLE_PULSES);
			const cycles = new Map<Id<"cycles">, Doc<"cycles"> | null>();
			for (const pulse of pulses) {
				if (!pulse.cycleId) {
					continue;
				}
				if (!cycles.has(pulse.cycleId)) {
					cycles.set(pulse.cycleId, await ctx.db.get(pulse.cycleId));
				}
				const cycle = cycles.get(pulse.cycleId);
				if (!cycle || cycle.status === "closed") {
					continue;
				}
				results.push({
					...toPulse(pulse),
					assignee: await loadPublicUser(ctx, pulse.assigneeUserId),
					startupName: startup.name,
					startupSlug: startup.slug,
					cycleId: cycle._id,
					cycleTitle: cycle.title,
				});
			}
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
		requireOpenCycle(cycle);
		if ((await loadCyclePulses(ctx, cycle._id)).length >= MAX_CYCLE_PULSES) {
			throw new Error(`A Cycle can have at most ${MAX_CYCLE_PULSES} Pulses`);
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
		const userId = await requireUserId(ctx);
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
			await notifyFounders(
				ctx,
				pulse.startupId,
				{
					kind: "pulse",
					title: `${pulse.title} is ready for review`,
					href: await pulseHref(ctx, pulse),
				},
				{ except: userId },
			);
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
		if (pulse.assigneeUserId && pulse.assigneeUserId !== userId) {
			throw new Error("Someone else has taken this Pulse");
		}
		await ctx.db.patch(pulse._id, {
			assigneeUserId: userId,
			status: pulse.status === "todo" ? "in_progress" : pulse.status,
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
		});
	},
});

export const removeProofLink = mutation({
	args: { pulseId: v.id("pulses"), url: v.string() },
	handler: async (ctx, args) => {
		const { pulse } = await requireWorkablePulse(ctx, args.pulseId);
		await ctx.db.patch(pulse._id, {
			proofLinks: proofLinksOf(pulse).filter((link) => link.url !== args.url),
		});
	},
});

export const remove = mutation({
	args: { pulseId: v.id("pulses") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { pulse, context } = await requireWorkablePulse(ctx, args.pulseId);
		if (context.kind === "cycle") {
			const membership = await requireMembership(ctx, pulse.startupId, userId);
			if (membership.role !== "founder" && pulse.createdByUserId !== userId) {
				throw new Error("You cannot delete this Pulse");
			}
		}

		await ctx.db.delete(pulse._id);
	},
});
