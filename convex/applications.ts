import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
	ensurePrivateThread,
	getApplication,
	getPrivateThread,
	loadApplicationsForFounder,
	loadOfferInvite,
	loadParticipantProgress,
	markJoined,
	requireApplicationAllowed,
	requireApplicationFounder,
	requireOpen,
	sendOffer,
	toFounderApplicationView,
} from "./applications/model";
import {
	APPLICATION_TEXT,
	decision,
	MAX_ASKS,
	OLD_OFFER_TERMS,
	offerState,
	resendRefusal,
	WALKTHROUGH_QUESTIONS,
} from "./applications/rules";
import { finishIfDecided } from "./hackathons/lifecycle";
import { loadParticipants, requireHackathonFounder } from "./hackathons/model";
import { requireUserId } from "./lib/auth";
import { limitText, requireLimitedText } from "./lib/text";
import { postMessage } from "./messages/model";
import { getTeamRole } from "./startups/team";
import {
	isProvisional,
	loadProfileRecord,
	toPublicProfile,
	toPublicUser,
} from "./users/model";

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
			record: await loadProfileRecord(ctx, user),
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
		const answer = requireLimitedText(
			args.answer,
			"Answer",
			APPLICATION_TEXT.answer,
		);

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

/** Opens the Founder's private thread with an Applicant or Builder, to ask them something. */
export const ask = mutation({
	args: { applicationId: v.id("applications") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { application, hackathon } = await requireApplicationFounder(
			ctx,
			args.applicationId,
			userId,
		);
		const existing = await getPrivateThread(
			ctx,
			hackathon._id,
			application.userId,
		);
		const privateThreads = existing
			? 0
			: (
					await ctx.db
						.query("threads")
						.withIndex("by_hackathon_and_kind", (q) =>
							q.eq("hackathonId", hackathon._id).eq("kind", "private"),
						)
						.take(MAX_ASKS)
				).length;
		requireApplicationAllowed(application, hackathon, {
			kind: "ask",
			privateThreads,
		});

		return (
			existing?._id ??
			(await ensurePrivateThread(ctx, hackathon, application.userId))
		);
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

/** Posts the Walkthrough questions in the private thread. The Builder replies there; the call happens outside engin. */
export const requestWalkthrough = mutation({
	args: { applicationId: v.id("applications") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { application, hackathon } = await requireApplicationFounder(
			ctx,
			args.applicationId,
			userId,
		);
		requireApplicationAllowed(application, hackathon, {
			kind: "requestWalkthrough",
		});

		const threadId = await ensurePrivateThread(
			ctx,
			hackathon,
			application.userId,
		);
		await postMessage(ctx, threadId, userId, {
			body: WALKTHROUGH_QUESTIONS,
			images: [],
		});
		await ctx.db.patch(application._id, { walkthroughRequestedAt: Date.now() });
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
		const notes = limitText(
			args.notes,
			"Notes",
			APPLICATION_TEXT.walkthroughNotes,
		);

		await ctx.db.patch(application._id, {
			walkthroughAt: Date.now(),
			walkthroughNotes: notes,
		});
	},
});

/** An Offer (`hired`, with terms) or Not this time (with a note). Joined comes later, when they accept. */
export const decide = mutation({
	args: {
		applicationId: v.id("applications"),
		decision,
		feedback: v.optional(v.string()),
		terms: v.optional(v.string()),
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
		const feedback = limitText(
			args.feedback,
			"Feedback",
			APPLICATION_TEXT.feedback,
		);
		if (args.decision === "not_this_time" && !feedback) {
			throw new ConvexError("Add a note for them");
		}

		if (args.decision === "not_this_time") {
			await ctx.db.patch(application._id, {
				decision: args.decision,
				feedback,
			});
		} else {
			const terms = limitText(
				args.terms,
				"Offer terms",
				APPLICATION_TEXT.offerTerms,
			);
			if (!terms) {
				throw new ConvexError("Add the Offer terms");
			}
			await ctx.db.patch(application._id, {
				decision: args.decision,
				feedback,
				offerTerms: terms,
			});
			const sent = await sendOffer(ctx, hackathon, application, userId, terms);
			if (sent === "on_team") {
				await markJoined(ctx, application, hackathon);
			}
		}
		await finishIfDecided(ctx, hackathon);
	},
});

/** Sends a fresh Offer, with the same terms, once the last one expired. */
export const resendOffer = mutation({
	args: { applicationId: v.id("applications") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { application, hackathon } = await requireApplicationFounder(
			ctx,
			args.applicationId,
			userId,
		);
		const invite = await loadOfferInvite(ctx, application);
		const refusal = resendRefusal(offerState(application, invite !== null));
		if (refusal) {
			throw new ConvexError(refusal);
		}
		const sent = await sendOffer(
			ctx,
			hackathon,
			application,
			userId,
			application.offerTerms ?? OLD_OFFER_TERMS,
		);
		if (sent === "on_team") {
			await markJoined(ctx, application, hackathon);
		}
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
