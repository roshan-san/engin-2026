import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { MAX_TRIAL_APPLICATIONS } from "../lib/limits";
import { trialCycleHref } from "../lib/links";
import { optionalText } from "../lib/text";
import { notify, notifyFounders } from "../people/notifications.rules";
import { refreshUserScore } from "../people/score.rules";
import {
	requireFounderMembership,
	requireMembership,
} from "../teams/membership.rules";
import {
	releaseParticipantSpot,
	requireCanEnter,
	takeParticipantSpot,
} from "./applications.rules";
import { requireIpTerms } from "./ipTerms.rules";
import {
	getTrialApplication,
	isTrialLive,
	requireAcceptingEntries,
} from "./trialCycles.rules";

export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const applications = await ctx.db
			.query("applications")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.take(MAX_TRIAL_APPLICATIONS);

		const results = [];
		for (const application of applications) {
			const startup = await ctx.db.get(application.startupId);
			const role = await ctx.db.get(application.roleId);
			const trial = await ctx.db.get(application.trialCycleId);
			results.push({
				_id: application._id,
				status: application.status,
				message: application.message ?? null,
				startupName: startup?.name ?? "Startup",
				startupSlug: startup?.slug ?? "",
				roleTitle: role?.title ?? null,
				trialTitle: trial?.title ?? null,
				trialCycleId: application.trialCycleId,
				roleId: application.roleId,
			});
		}
		return results;
	},
});

export const listForStartup = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireMembership(ctx, args.startupId, userId);

		const applications = await ctx.db
			.query("applications")
			.withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
			.order("desc")
			.take(MAX_TRIAL_APPLICATIONS);

		const results = [];
		for (const application of applications) {
			const user = await ctx.db.get(application.userId);
			const role = await ctx.db.get(application.roleId);
			const trial = await ctx.db.get(application.trialCycleId);
			results.push({
				_id: application._id,
				status: application.status,
				message: application.message ?? null,
				userName: user?.name ?? user?.username ?? user?.email ?? "Applicant",
				userUsername: user?.username ?? null,
				roleTitle: role?.title ?? null,
				trialTitle: trial?.title ?? null,
				trialCycleId: application.trialCycleId,
			});
		}
		return results;
	},
});

export const applyToTrial = mutation({
	args: {
		trialCycleId: v.id("trialCycles"),
		message: v.optional(v.string()),
		acceptTerms: v.boolean(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}
		requireAcceptingEntries(trial);
		if (trial.admission !== "application") {
			throw new Error("This Trial Cycle is open to join directly");
		}
		requireIpTerms(args.acceptTerms);
		await requireCanEnter(ctx, trial, userId);

		const applicationId = await ctx.db.insert("applications", {
			userId,
			startupId: trial.startupId,
			roleId: trial.roleId,
			trialCycleId: trial._id,
			status: "applied",
			message: optionalText(args.message),
			ipAcknowledgedAt: Date.now(),
		});

		await notifyFounders(ctx, trial.startupId, {
			kind: "application",
			title: `New application for ${trial.title}`,
			href: await trialCycleHref(ctx, trial),
		});

		return applicationId;
	},
});

export const joinTrial = mutation({
	args: { trialCycleId: v.id("trialCycles"), acceptTerms: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		if (!trial) {
			throw new Error("Trial Cycle not found");
		}
		requireAcceptingEntries(trial);
		if (trial.admission !== "open") {
			throw new Error("You need to apply to this Trial Cycle");
		}
		requireIpTerms(args.acceptTerms);
		await requireCanEnter(ctx, trial, userId);
		await takeParticipantSpot(ctx, trial);

		await ctx.db.insert("applications", {
			userId,
			startupId: trial.startupId,
			roleId: trial.roleId,
			trialCycleId: trial._id,
			status: "joined",
			ipAcknowledgedAt: Date.now(),
		});

		await notifyFounders(ctx, trial.startupId, {
			kind: "application",
			title: `Someone joined ${trial.title}`,
			href: await trialCycleHref(ctx, trial),
		});
	},
});

export const decide = mutation({
	args: {
		applicationId: v.id("applications"),
		status: v.union(v.literal("joined"), v.literal("rejected")),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const application = await ctx.db.get(args.applicationId);
		if (!application) {
			throw new Error("Application not found");
		}

		await requireFounderMembership(ctx, application.startupId, userId);
		if (application.status !== "applied") {
			throw new Error("This application has already been decided");
		}

		const trial = await ctx.db.get(application.trialCycleId);
		if (trial?.status !== "open") {
			throw new Error("This Trial Cycle is no longer accepting people");
		}

		if (args.status === "rejected") {
			await ctx.db.patch(application._id, { status: "rejected" });
			await notify(ctx, {
				userId: application.userId,
				kind: "application",
				title: `Your application to ${trial.title} was not accepted`,
				href: await trialCycleHref(ctx, trial),
			});
			return;
		}

		await takeParticipantSpot(ctx, trial);
		await ctx.db.patch(application._id, { status: "joined" });
		await notify(ctx, {
			userId: application.userId,
			kind: "application",
			title: `You were accepted to ${trial.title}`,
			href: await trialCycleHref(ctx, trial),
		});
	},
});

/**
 * Exiting before the Trial Cycle starts is a free withdrawal; exiting a
 * started one is Leaving, which is public and costs Score.
 */
export const leaveTrial = mutation({
	args: { trialCycleId: v.id("trialCycles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const trial = await ctx.db.get(args.trialCycleId);
		const application = await getTrialApplication(
			ctx,
			args.trialCycleId,
			userId,
		);
		const isIn =
			application?.status === "applied" || application?.status === "joined";
		if (!trial || !isTrialLive(trial) || !application || !isIn) {
			throw new Error("You are not in this Trial Cycle");
		}

		const wasParticipant = application.status === "joined";
		const isLeaving = wasParticipant && trial.status === "active";
		await ctx.db.patch(
			application._id,
			isLeaving ? { status: "left" } : { status: "withdrawn" },
		);

		if (wasParticipant) {
			await releaseParticipantSpot(ctx, trial);
		}
		if (isLeaving) {
			await refreshUserScore(ctx, userId);
		}

		await notifyFounders(ctx, trial.startupId, {
			kind: "application",
			title: isLeaving
				? `A Participant left ${trial.title}`
				: `An application to ${trial.title} was withdrawn`,
			href: await trialCycleHref(ctx, trial),
		});
	},
});

export const setEvaluationVisibility = mutation({
	args: { applicationId: v.id("applications"), isPublic: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const application = await ctx.db.get(args.applicationId);
		if (application?.userId !== userId || !application.evaluation) {
			throw new Error("Evaluation not found");
		}

		await ctx.db.patch(application._id, { evaluationPublic: args.isPublic });
	},
});
