import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { MAX_LISTED_TRIALS } from "../lib/limits";
import { loadPublicUser } from "../people/users.rules";
import { trialVerdict } from "../schema";
import { logActivity } from "../teams/activity.rules";
import {
	getMembership,
	requireFounderMembership,
	requireMembership,
} from "../teams/membership.rules";
import { listChallenges, replaceChallenges } from "./challenges.rules";
import { requireIpTerms } from "./ipTerms.rules";
import { loadTrialOffers } from "./offers.rules";
import { publishDraft, requirePublishable } from "./publish.rules";
import {
	buildDraftFields,
	cancelTrial,
	draftFields,
	getTrialApplication,
	isTrialLive,
	listTrialApplications,
	loadPublicTrial,
	requireOpenRoleOf,
	requireValidSchedule,
	startTrial,
} from "./trialCycles.rules";
import { closeWithVerdicts } from "./verdicts.rules";

export const list = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireMembership(ctx, args.startupId, userId);

		const trials = await ctx.db
			.query("trialCycles")
			.withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
			.order("desc")
			.take(MAX_LISTED_TRIALS);

		return await Promise.all(
			trials.map(async (trial) => {
				const role = await ctx.db.get(trial.roleId);
				return { ...trial, roleTitle: role?.title ?? "Role" };
			}),
		);
	},
});

export const listOpenByStartup = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const startup = await ctx.db.get(args.startupId);
		if (!startup?.isPublic) {
			return [];
		}
		return await ctx.db
			.query("trialCycles")
			.withIndex("by_startup_and_status", (q) =>
				q.eq("startupId", args.startupId).eq("status", "open"),
			)
			.take(MAX_LISTED_TRIALS);
	},
});

/**
 * The public hackathon page: readable signed out, and never private fields.
 * Takes the raw URL id, so a made-up address is "not found", not an error.
 */
export const getPublic = query({
	args: { trialCycleId: v.string() },
	handler: async (ctx, args) => {
		const trialCycleId = ctx.db.normalizeId("trialCycles", args.trialCycleId);
		const loaded = trialCycleId
			? await loadPublicTrial(ctx, trialCycleId)
			: null;
		if (!loaded) {
			return null;
		}
		const { trial, startup } = loaded;

		const userId = await getAuthUserId(ctx);
		const membership = userId
			? await getMembership(ctx, startup._id, userId)
			: null;
		const myEntry = userId
			? await getTrialApplication(ctx, trial._id, userId)
			: null;
		const role = await ctx.db.get(trial.roleId);
		const challenges = await listChallenges(ctx, trial._id);

		return {
			_id: trial._id,
			title: trial.title,
			description: trial.description,
			status: trial.status,
			startsAt: trial.startsAt,
			endsAt: trial.endsAt,
			deadline: trial.applicationDeadline ?? trial.startsAt,
			participantCount: trial.participantCount,
			maxContributors: trial.maxContributors,
			prize: trial.prize ?? null,
			expectedOutcome: trial.expectedOutcome ?? null,
			evaluationCriteria: trial.evaluationCriteria ?? null,
			compensation: trial.compensation ?? null,
			startup: { name: startup.name, slug: startup.slug },
			role: { title: role?.title ?? "Role", type: role?.type ?? null },
			challenges: challenges.map((challenge) => ({
				_id: challenge._id,
				title: challenge.title,
				description: challenge.description ?? null,
			})),
			isMember: membership !== null,
			myEntryStatus: myEntry?.status ?? null,
		};
	},
});

export const get = query({
	args: { trialCycleId: v.id("trialCycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			return null;
		}

		const membership = await getMembership(ctx, trial.startupId, userId);
		const isMember = membership !== null;
		if (trial.status === "draft" && !isMember) {
			return null;
		}
		const application = await getTrialApplication(ctx, trial._id, userId);
		const isParticipant = application?.status === "joined";
		const role = await ctx.db.get(trial.roleId);
		const startup = await ctx.db.get(trial.startupId);

		const offers = await loadTrialOffers(ctx, trial._id);
		const applicants = [];
		if (isMember) {
			for (const item of await listTrialApplications(ctx, trial._id)) {
				applicants.push({
					...item,
					user: await loadPublicUser(ctx, item.userId),
					offer: offers.get(item._id) ?? null,
				});
			}
		}

		return {
			...trial,
			roleTitle: role?.title ?? "Role",
			roleIsOpen: role?.status === "open",
			startupName: startup?.name ?? "Startup",
			startupSlug: startup?.slug ?? "",
			isMember,
			isFounder: membership?.role === "founder",
			isParticipant,
			myStatus: application?.status ?? null,
			myApplicationId: application?._id ?? null,
			myVerdict: application?.verdict ?? null,
			myEvaluation: application?.evaluation ?? null,
			myEvaluationPublic: application?.evaluationPublic ?? false,
			myOffer: application ? (offers.get(application._id) ?? null) : null,
			applicants,
		};
	},
});

/** Creates a draft with its Starting Pulses. Nothing is public or scheduled until `publish`. */
export const create = mutation({
	args: { startupId: v.id("startups"), ...draftFields },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounderMembership(ctx, args.startupId, userId);

		const role = await requireOpenRoleOf(ctx, args.startupId, args.roleId);
		requireValidSchedule(args, Date.now());
		const fields = buildDraftFields(args, role);

		const trialCycleId = await ctx.db.insert("trialCycles", {
			startupId: args.startupId,
			...fields,
			status: "draft",
			participantCount: 0,
		});
		await replaceChallenges(
			ctx,
			{ _id: trialCycleId, startupId: args.startupId },
			args.challenges,
			userId,
		);

		return trialCycleId;
	},
});

/** Replaces a whole draft, Starting Pulses included. Published hackathons don't change here. */
export const update = mutation({
	args: { trialCycleId: v.id("trialCycles"), ...draftFields },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}

		await requireFounderMembership(ctx, trial.startupId, userId);
		if (trial.status !== "draft") {
			throw new Error("Only an unpublished hackathon can be edited");
		}
		const role = await requireOpenRoleOf(ctx, trial.startupId, args.roleId);
		requireValidSchedule(args, Date.now());

		await ctx.db.patch(trial._id, buildDraftFields(args, role));
		await replaceChallenges(ctx, trial, args.challenges, userId);
	},
});

/**
 * The charge point (design: Pricing rules). One mutation, so a double click
 * or a second tab can't spend twice (eng review C4).
 */
export const publish = mutation({
	args: { trialCycleId: v.id("trialCycles"), acceptTerms: v.boolean() },
	handler: async (ctx, args): Promise<void> => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}

		const now = Date.now();
		await requirePublishable(ctx, trial, userId, now);
		requireIpTerms(args.acceptTerms);
		await ctx.db.patch(trial._id, { ipAcknowledgedAt: now });
		await publishDraft(ctx, trial, userId, now);
	},
});

/** "Pick new dates": only a draft moves, because a published one has its start scheduled. */
export const reschedule = mutation({
	args: {
		trialCycleId: v.id("trialCycles"),
		startsAt: v.number(),
		endsAt: v.number(),
		applicationDeadline: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}

		await requireFounderMembership(ctx, trial.startupId, userId);
		if (trial.status !== "draft") {
			throw new Error("Only a draft's dates can change");
		}
		requireValidSchedule(args, Date.now());

		await ctx.db.patch(trial._id, {
			startsAt: args.startsAt,
			endsAt: args.endsAt,
			applicationDeadline: args.applicationDeadline,
		});
	},
});

export const start = internalMutation({
	args: { trialCycleId: v.id("trialCycles") },
	handler: async (ctx, args) => {
		const trial = await ctx.db.get(args.trialCycleId);
		if (trial?.status !== "open") {
			return;
		}

		await startTrial(ctx, trial);
		await logActivity(ctx, {
			startupId: trial.startupId,
			kind: "trial_cycle_started",
			trialCycleId: trial._id,
			summary: `Trial Cycle "${trial.title}" started`,
		});
	},
});

export const cancel = mutation({
	args: { trialCycleId: v.id("trialCycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}

		await requireFounderMembership(ctx, trial.startupId, userId);
		if (trial.status !== "draft" && !isTrialLive(trial)) {
			throw new Error(
				"Only a draft, open or active Trial Cycle can be cancelled",
			);
		}

		await cancelTrial(ctx, trial);
	},
});

export const close = mutation({
	args: {
		trialCycleId: v.id("trialCycles"),
		verdicts: v.array(
			v.object({
				applicationId: v.id("applications"),
				verdict: trialVerdict,
				evaluation: v.optional(v.string()),
			}),
		),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}

		await requireFounderMembership(ctx, trial.startupId, userId);
		await closeWithVerdicts(ctx, trial, args);
		await logActivity(ctx, {
			startupId: trial.startupId,
			kind: "trial_cycle_closed",
			trialCycleId: trial._id,
			summary: `Trial Cycle "${trial.title}" closed`,
		});
	},
});
