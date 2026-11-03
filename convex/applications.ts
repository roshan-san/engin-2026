import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import {
	ensurePrivateThread,
	getApplication,
	getPrivateThread,
	loadApplicationsForFounder,
	loadOfferInvite,
	loadOfferView,
	loadParticipantProgress,
	markJoined,
	releaseIfUnconfirmed,
	requireApplicationAllowed,
	requireApplicationFounder,
	requireOpen,
	requireOwnApplication,
	sendOffer,
	toFounderApplicationView,
} from "./applications/model";
import {
	APPLICATION_TEXT,
	confirmByFor,
	decision,
	isUnconfirmed,
	MAX_ASKS,
	NO_SHOW_MS,
	noShowRefusal,
	OLD_OFFER_TERMS,
	offerState,
	resendRefusal,
	WALKTHROUGH_QUESTIONS,
	withdrawRefusal,
} from "./applications/rules";
import {
	acceptedEmail,
	emailDay,
	notThisTimeEmail,
	removedEmail,
} from "./email/copy";
import { emailNotSelected, emailUser, hackathonNames } from "./email/model";
import { siteUrl } from "./email/rules";
import { finishIfDecided } from "./hackathons/lifecycle";
import {
	loadHackathonCards,
	loadParticipants,
	requireHackathonFounder,
} from "./hackathons/model";
import { phaseOf } from "./hackathons/rules";
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
							offer:
								application.decision === "hired"
									? (await loadOfferView(ctx, application)).state
									: null,
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

		const confirmBy = confirmByFor(Date.now(), hackathon.startsAt);
		await ctx.db.patch(application._id, {
			status: "participating",
			confirmBy,
			confirmedAt: undefined,
		});
		await ctx.scheduler.runAt(
			confirmBy,
			internal.applications.releaseUnconfirmed,
			{
				applicationId: application._id,
			},
		);
		await ensurePrivateThread(ctx, hackathon, application.userId);
		const names = await hackathonNames(ctx, hackathon);
		await emailUser(ctx, application.userId, {
			kind: "accepted",
			...acceptedEmail({
				...names,
				startsAt: hackathon.startsAt,
				confirmBy,
				url: `${siteUrl()}/hackathons/${hackathon._id}`,
			}),
		});
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
		await emailNotSelected(ctx, hackathon, application.userId);
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
			await emailUser(ctx, application.userId, {
				kind: "not_this_time",
				...notThisTimeEmail({
					...(await hackathonNames(ctx, hackathon)),
					note: feedback ?? "",
					url: `${siteUrl()}/h/${hackathon._id}`,
				}),
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

/** An accepted Applicant keeps their place. */
export const confirm = mutation({
	args: { applicationId: v.id("applications") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const application = await requireOwnApplication(
			ctx,
			args.applicationId,
			userId,
		);
		if (
			application.status !== "participating" ||
			isUnconfirmed(application, Date.now())
		) {
			throw new ConvexError("Your place was released");
		}
		if (application.confirmedAt === undefined) {
			await ctx.db.patch(application._id, { confirmedAt: Date.now() });
		}
	},
});

/** At `confirmBy`: releases the place if it wasn't confirmed. */
export const releaseUnconfirmed = internalMutation({
	args: { applicationId: v.id("applications") },
	handler: async (ctx, args) => {
		const application = await ctx.db.get(args.applicationId);
		const hackathon =
			application && (await ctx.db.get(application.hackathonId));
		if (application && hackathon) {
			await releaseIfUnconfirmed(ctx, application, hackathon);
		}
	},
});

/** The Applicant or Builder leaves the Hackathon, until they're decided. */
export const withdraw = mutation({
	args: { applicationId: v.id("applications") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const application = await requireOwnApplication(
			ctx,
			args.applicationId,
			userId,
		);
		const hackathon = await ctx.db.get(application.hackathonId);
		if (!hackathon) {
			throw new ConvexError("Hackathon not found");
		}
		const refusal = withdrawRefusal(
			application,
			phaseOf(hackathon, Date.now()),
		);
		if (refusal) {
			throw new ConvexError(refusal);
		}
		await ctx.db.patch(application._id, {
			status: "declined",
			withdrawnAt: Date.now(),
		});
		await finishIfDecided(ctx, hackathon);
	},
});

/** The Founder removes a Builder whose Cards haven't moved 2 days in. */
export const removeNoShow = mutation({
	args: { applicationId: v.id("applications") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { application, hackathon } = await requireApplicationFounder(
			ctx,
			args.applicationId,
			userId,
		);
		const now = Date.now();
		const cards = await loadHackathonCards(
			ctx,
			hackathon._id,
			application.userId,
		);
		const refusal = noShowRefusal(
			application,
			{ phase: phaseOf(hackathon, now), startsAt: hackathon.startsAt },
			now,
			cards.some((card) => card.status !== "todo"),
		);
		if (refusal) {
			throw new ConvexError(
				refusal === "Give them until"
					? `Give them until ${emailDay(hackathon.startsAt + NO_SHOW_MS)}`
					: refusal,
			);
		}
		await ctx.db.patch(application._id, {
			status: "declined",
			removedAt: now,
		});
		await emailUser(ctx, application.userId, {
			kind: "removed",
			...removedEmail({
				...(await hackathonNames(ctx, hackathon)),
				url: `${siteUrl()}/explore/hackathons`,
			}),
		});
		await finishIfDecided(ctx, hackathon);
	},
});

/** The Participant says whether the Startup kept what it promised Participants. */
export const keepPromise = mutation({
	args: { applicationId: v.id("applications"), kept: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const application = await requireOwnApplication(
			ctx,
			args.applicationId,
			userId,
		);
		if (!application.decision) {
			throw new ConvexError("Wait for the decision");
		}
		if (application.promiseKept !== undefined) {
			throw new ConvexError("Already answered");
		}

		await ctx.db.patch(application._id, { promiseKept: args.kept });
	},
});
