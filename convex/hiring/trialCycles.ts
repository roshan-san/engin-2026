import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { MAX_LISTED_TRIALS, MAX_TRIAL_PARTICIPANTS } from "../lib/limits";
import { buildSearchText, optionalText, requireText } from "../lib/text";
import { loadPublicUser } from "../people/users.rules";
import { trialAdmission, trialVerdict } from "../schema";
import { logActivity } from "../teams/activity.rules";
import {
	getMembership,
	requireFounderMembership,
	requireMembership,
} from "../teams/membership.rules";
import { requireIpTerms } from "./ipTerms.rules";
import { publishDraft, requirePublishable } from "./publish.rules";
import {
	cancelTrial,
	getTrialApplication,
	isTrialLive,
	listTrialApplications,
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
		return await ctx.db
			.query("trialCycles")
			.withIndex("by_startup_and_status", (q) =>
				q.eq("startupId", args.startupId).eq("status", "open"),
			)
			.take(MAX_LISTED_TRIALS);
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

		const applicants = [];
		if (isMember) {
			for (const item of await listTrialApplications(ctx, trial._id)) {
				applicants.push({
					...item,
					user: await loadPublicUser(ctx, item.userId),
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
			applicants,
		};
	},
});

/** Creates a draft. Nothing is public or scheduled until `publish`. */
export const create = mutation({
	args: {
		startupId: v.id("startups"),
		roleId: v.id("roles"),
		title: v.string(),
		description: v.string(),
		admission: trialAdmission,
		maxContributors: v.number(),
		startsAt: v.number(),
		endsAt: v.number(),
		applicationDeadline: v.optional(v.number()),
		prize: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounderMembership(ctx, args.startupId, userId);

		const role = await ctx.db.get(args.roleId);
		if (!role || role.startupId !== args.startupId) {
			throw new Error("Role not found");
		}
		if (role.status !== "open") {
			throw new Error("This Role is closed");
		}
		if (args.endsAt <= args.startsAt) {
			throw new Error("Trial Cycle end must be after start");
		}

		const title = requireText(args.title, "Title");
		const description = requireText(args.description, "Description");
		const maxContributors = Math.min(
			MAX_TRIAL_PARTICIPANTS,
			Math.max(1, Math.floor(args.maxContributors)),
		);

		const trialCycleId = await ctx.db.insert("trialCycles", {
			startupId: args.startupId,
			roleId: args.roleId,
			title,
			description,
			admission: args.admission,
			maxContributors,
			applicationDeadline: args.applicationDeadline,
			startsAt: args.startsAt,
			endsAt: args.endsAt,
			prize: optionalText(args.prize),
			status: "draft",
			participantCount: 0,
			searchText: buildSearchText(title, description, role.title),
		});

		return trialCycleId;
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
		if (args.endsAt <= args.startsAt) {
			throw new Error("Trial Cycle end must be after start");
		}

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
