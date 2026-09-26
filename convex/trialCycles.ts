import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { MAX_LISTED_TRIALS, MAX_TRIAL_PARTICIPANTS } from "./lib/limits";
import {
	getMembership,
	requireFounderMembership,
	requireMembership,
} from "./lib/membership";
import { buildSearchText, optionalText, requireText } from "./lib/text";
import {
	cancelTrial,
	getTrialApplication,
	listTrialApplications,
	startTrial,
} from "./lib/trials";
import { loadPublicUser } from "./lib/users";
import { closeWithVerdicts } from "./lib/verdicts";
import { trialAdmission, trialVerdict } from "./schema";

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
		const application = await getTrialApplication(ctx, trial._id, userId);
		const isMember = membership !== null;
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
		expectedOutcome: v.optional(v.string()),
		evaluationCriteria: v.optional(v.string()),
		compensation: v.optional(v.string()),
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
			expectedOutcome: optionalText(args.expectedOutcome),
			evaluationCriteria: optionalText(args.evaluationCriteria),
			compensation: optionalText(args.compensation),
			status: "open",
			participantCount: 0,
			searchText: buildSearchText(title, description, role.title),
		});

		await ctx.scheduler.runAt(args.startsAt, internal.trialCycles.start, {
			trialCycleId,
		});

		return trialCycleId;
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
		if (trial.status !== "open" && trial.status !== "active") {
			throw new Error("Only open or active Trial Cycles can be cancelled");
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
		pulseReviews: v.array(
			v.object({
				pulseId: v.id("pulses"),
				decision: v.union(v.literal("verify"), v.literal("reject")),
				note: v.optional(v.string()),
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
	},
});
