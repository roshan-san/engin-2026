import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { appendActivity } from "../model/activity";
import {
	ensurePrivateThread,
	getApplication,
	loadApplicationsForFounder,
	loadParticipantProgress,
	loadParticipants,
	requireApplicationAllowed,
	requireApplicationFounder,
	requireOpen,
	toFounderApplicationView,
} from "../model/applications";
import { requireUserId } from "../model/auth";
import { finishIfDecided } from "../model/hackathonLifecycle";
import { requireHackathonFounder } from "../model/hackathons";
import { ensureHireInvite } from "../model/invites";
import { getTeamRole } from "../model/teamAccess";
import { limitText, requireLimitedText } from "../model/text";
import {
	isProvisional,
	loadProfileRecord,
	toPublicProfile,
	toPublicUser,
} from "../model/users";
import { TEXT } from "../shared/limits";
import { decision } from "../shared/validators";

/** Everyone who applied, for the Founder. Never includes email. */
export const listForHackathon = query({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireHackathonFounder(ctx, args.hackathonId, userId);

		const applications = await loadApplicationsForFounder(
			ctx,
			args.hackathonId,
		);

		const rows = await Promise.all(
			applications.map(async (application) => {
				const user = await ctx.db.get(application.userId);
				return user
					? {
							application: toFounderApplicationView(application),
							user: {
								...toPublicUser(user),
								isProvisional: isProvisional(user),
							},
							progress:
								application.status === "participating"
									? await loadParticipantProgress(
											ctx,
											application.hackathonId,
											application.userId,
										)
									: null,
						}
					: null;
			}),
		);
		return rows.filter((row) => row !== null);
	},
});

/** One Applicant for the Founder's screening: their answer, profile and Record. Works without a username. */
export const getApplicant = query({
	args: { applicationId: v.id("applications") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { application } = await requireApplicationFounder(
			ctx,
			args.applicationId,
			userId,
		);
		const user = await ctx.db.get(application.userId);
		if (!user) {
			throw new ConvexError("Application not found");
		}

		return {
			application: toFounderApplicationView(application),
			user: toPublicProfile(user),
			record: await loadProfileRecord(ctx, user, Date.now()),
		};
	},
});

export const apply = mutation({
	args: { hackathonId: v.id("hackathons"), answer: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await ctx.db.get(args.hackathonId);
		if (!hackathon || hackathon.status === "draft") {
			throw new ConvexError("Hackathon not found");
		}
		requireOpen(hackathon);
		if (await getTeamRole(ctx, hackathon.startupId, userId)) {
			throw new ConvexError("You're on this startup");
		}
		if (await getApplication(ctx, hackathon._id, userId)) {
			throw new ConvexError("You've already applied");
		}
		const answer = requireLimitedText(args.answer, "Answer", TEXT.answer);

		const applicationId = await ctx.db.insert("applications", {
			hackathonId: hackathon._id,
			userId,
			answer,
			status: "applied",
			shortlisted: false,
		});
		await ctx.db.patch(hackathon._id, {
			applicantCount: hackathon.applicantCount + 1,
		});
		return applicationId;
	},
});

/** Makes an applicant a Participant. They take part once the Hackathon starts. */
export const accept = mutation({
	args: { applicationId: v.id("applications") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { application, hackathon } = await requireApplicationFounder(
			ctx,
			args.applicationId,
			userId,
		);
		const participants = await loadParticipants(ctx, hackathon._id);
		requireApplicationAllowed(application, hackathon, {
			kind: "accept",
			participants: participants.length,
		});

		await ctx.db.patch(application._id, { status: "participating" });
		await ensurePrivateThread(ctx, hackathon, application.userId);
	},
});

export const decline = mutation({
	args: { applicationId: v.id("applications") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { application, hackathon } = await requireApplicationFounder(
			ctx,
			args.applicationId,
			userId,
		);
		requireApplicationAllowed(application, hackathon, { kind: "decline" });

		await ctx.db.patch(application._id, { status: "declined" });
	},
});

export const shortlist = mutation({
	args: { applicationId: v.id("applications"), shortlisted: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { application, hackathon } = await requireApplicationFounder(
			ctx,
			args.applicationId,
			userId,
		);
		requireApplicationAllowed(application, hackathon, {
			kind: "shortlist",
			on: args.shortlisted,
		});

		await ctx.db.patch(application._id, { shortlisted: args.shortlisted });
	},
});

export const markWalkthrough = mutation({
	args: { applicationId: v.id("applications"), notes: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { application, hackathon } = await requireApplicationFounder(
			ctx,
			args.applicationId,
			userId,
		);
		requireApplicationAllowed(application, hackathon, { kind: "walkthrough" });
		const notes = limitText(args.notes, "Notes", TEXT.walkthroughNotes);

		await ctx.db.patch(application._id, {
			walkthroughAt: Date.now(),
			walkthroughNotes: notes,
		});
	},
});

export const decide = mutation({
	args: {
		applicationId: v.id("applications"),
		decision,
		feedback: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { application, hackathon } = await requireApplicationFounder(
			ctx,
			args.applicationId,
			userId,
		);
		requireApplicationAllowed(application, hackathon, {
			kind: "decide",
			decision: args.decision,
		});
		const now = Date.now();
		const feedback = limitText(args.feedback, "Feedback", TEXT.feedback);

		await ctx.db.patch(application._id, { decision: args.decision, feedback });
		if (args.decision === "hired") {
			const participant = await ctx.db.get(application.userId);
			if (!participant?.email) {
				throw new ConvexError("This Participant has no email to invite");
			}
			await ensureHireInvite(ctx, {
				startupId: hackathon.startupId,
				userId: participant._id,
				email: participant.email,
				invitedBy: userId,
				hackathonId: hackathon._id,
			});
			await appendActivity(ctx, {
				startupId: hackathon.startupId,
				kind: "participant_hired",
				at: now,
				actorId: application.userId,
				hackathonId: hackathon._id,
			});
		}
		await finishIfDecided(ctx, hackathon);
	},
});

/** The Participant says whether the Startup kept what it promised Participants. */
export const keepPromise = mutation({
	args: { applicationId: v.id("applications"), kept: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const application = await ctx.db.get(args.applicationId);
		if (!application || application.userId !== userId) {
			throw new ConvexError("This isn't your application");
		}
		if (!application.decision) {
			throw new ConvexError("Wait for the decision");
		}
		if (application.promiseKept !== undefined) {
			throw new ConvexError("Already answered");
		}

		await ctx.db.patch(application._id, { promiseKept: args.kept });
	},
});
