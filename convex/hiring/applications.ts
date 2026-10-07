import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import {
	MAX_HACKATHON_APPLICATIONS,
	MAX_USER_APPLICATIONS,
} from "../lib/limits";
import { hackathonHref } from "../lib/links";
import { optionalText } from "../lib/text";
import { notify, notifyFounders } from "../people/notifications.rules";
import { refreshUserScore } from "../people/score.rules";
import {
	requireFounderMembership,
	requireMembership,
} from "../teams/membership.rules";
import {
	holdsLiveEntry,
	releaseParticipantSpot,
	requireCanEnter,
	requireRoomToApply,
	takeParticipantSpot,
} from "./applications.rules";
import { requireIpTerms } from "./ipTerms.rules";
import {
	getHackathonApplication,
	isHackathonLive,
	requireAcceptingEntries,
} from "./hackathons.rules";

export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const applications = await ctx.db
			.query("applications")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.take(MAX_USER_APPLICATIONS);

		const results = [];
		for (const application of applications) {
			const startup = await ctx.db.get(application.startupId);
			const role = await ctx.db.get(application.roleId);
			const hackathon = await ctx.db.get(application.hackathonId);
			results.push({
				_id: application._id,
				status: application.status,
				message: application.message ?? null,
				verdict: application.verdict ?? null,
				evaluation: application.evaluation ?? null,
				evaluationPublic: application.evaluationPublic ?? false,
				startupName: startup?.name ?? "Startup",
				startupSlug: startup?.slug ?? "",
				roleTitle: role?.title ?? null,
				hackathonTitle: hackathon?.title ?? null,
				hackathonStatus: hackathon?.status ?? null,
				startsAt: hackathon?.startsAt ?? null,
				endsAt: hackathon?.endsAt ?? null,
				isLive: holdsLiveEntry(application, hackathon),
				hackathonId: application.hackathonId,
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
			.take(MAX_HACKATHON_APPLICATIONS);

		const results = [];
		for (const application of applications) {
			const user = await ctx.db.get(application.userId);
			const role = await ctx.db.get(application.roleId);
			const hackathon = await ctx.db.get(application.hackathonId);
			results.push({
				_id: application._id,
				status: application.status,
				message: application.message ?? null,
				userName: user?.name ?? user?.username ?? user?.email ?? "Applicant",
				userUsername: user?.username ?? null,
				roleTitle: role?.title ?? null,
				hackathonTitle: hackathon?.title ?? null,
				hackathonId: application.hackathonId,
			});
		}
		return results;
	},
});

export const applyToHackathon = mutation({
	args: {
		hackathonId: v.id("hackathons"),
		message: v.optional(v.string()),
		acceptTerms: v.boolean(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await ctx.db.get(args.hackathonId);
		if (!hackathon) {
			throw new Error("Hackathon not found");
		}
		requireAcceptingEntries(hackathon);
		await requireRoomToApply(ctx, hackathon);
		requireIpTerms(args.acceptTerms);
		await requireCanEnter(ctx, hackathon, userId);

		const applicationId = await ctx.db.insert("applications", {
			userId,
			startupId: hackathon.startupId,
			roleId: hackathon.roleId,
			hackathonId: hackathon._id,
			status: "applied",
			message: optionalText(args.message),
			ipAcknowledgedAt: Date.now(),
		});

		await notifyFounders(ctx, hackathon.startupId, {
			kind: "application",
			title: `New application for ${hackathon.title}`,
			href: await hackathonHref(ctx, hackathon),
		});

		return applicationId;
	},
});

export const decide = mutation({
	args: {
		applicationId: v.id("applications"),
		status: v.union(v.literal("accepted"), v.literal("rejected")),
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

		const hackathon = await ctx.db.get(application.hackathonId);
		if (hackathon?.status !== "open") {
			throw new Error("This Hackathon is no longer accepting people");
		}

		if (args.status === "rejected") {
			await ctx.db.patch(application._id, { status: "rejected" });
			await notify(ctx, {
				userId: application.userId,
				kind: "application",
				title: `Your application to ${hackathon.title} was not accepted`,
				href: await hackathonHref(ctx, hackathon),
			});
			return;
		}

		await takeParticipantSpot(ctx, hackathon);
		await ctx.db.patch(application._id, { status: "accepted" });
		await notify(ctx, {
			userId: application.userId,
			kind: "application",
			title: `You were accepted to ${hackathon.title}`,
			href: await hackathonHref(ctx, hackathon),
		});
	},
});

/**
 * Exiting before the Hackathon starts is a free withdrawal; exiting a
 * started one is Leaving, which is public and costs Score.
 */
export const leaveHackathon = mutation({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await ctx.db.get(args.hackathonId);
		const application = await getHackathonApplication(
			ctx,
			args.hackathonId,
			userId,
		);
		const isIn =
			application?.status === "applied" || application?.status === "accepted";
		if (!hackathon || !isHackathonLive(hackathon) || !application || !isIn) {
			throw new Error("You are not in this Hackathon");
		}

		const wasParticipant = application.status === "accepted";
		const isLeaving = wasParticipant && hackathon.status === "active";
		await ctx.db.patch(
			application._id,
			isLeaving ? { status: "left" } : { status: "withdrawn" },
		);

		if (wasParticipant) {
			await releaseParticipantSpot(ctx, hackathon);
		}
		if (isLeaving) {
			await refreshUserScore(ctx, userId);
		}

		await notifyFounders(ctx, hackathon.startupId, {
			kind: "application",
			title: isLeaving
				? `A Participant left ${hackathon.title}`
				: `An application to ${hackathon.title} was withdrawn`,
			href: await hackathonHref(ctx, hackathon),
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
