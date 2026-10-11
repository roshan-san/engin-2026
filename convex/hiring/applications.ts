import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import {
	MAX_BUILDERS,
	MAX_USER_APPLICATIONS,
	STARTING_RATING,
	TEXT,
} from "../lib/limits";
import { limitText, requireLimitedText } from "../lib/text";
import { isProvisional, toPublicUser } from "../people/users.rules";
import { decision } from "../schema";
import { getTeamRole } from "../startups/access.rules";
import { ensureHireInvite } from "../startups/invites.rules";
import { appendActivity } from "../work/activity.rules";
import {
	ensurePrivateThread,
	getApplication,
	loadApplicationsForFounder,
	requireApplicationFounder,
	requireBuilding,
	requireDecidable,
	requireOpen,
	requireRunning,
	toFounderApplicationView,
	toMyApplicationView,
} from "./applications.rules";
import { finishIfDecided, requireHackathonFounder } from "./hackathons.rules";

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
								rating: user.rating ?? STARTING_RATING,
								isProvisional: isProvisional(user),
							},
						}
					: null;
			}),
		);
		return rows.filter((row) => row !== null);
	},
});

/** The signed-in person's applications, for the switcher's Applied group and Builder places. */
export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);

		const applications = await ctx.db
			.query("applications")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.take(MAX_USER_APPLICATIONS);

		const rows = await Promise.all(
			applications.map(async (application) => {
				const hackathon = await ctx.db.get(application.hackathonId);
				const startup = hackathon && (await ctx.db.get(hackathon.startupId));
				return hackathon && startup
					? {
							hackathonId: hackathon._id,
							startupName: startup.name,
							job: hackathon.job,
							...toMyApplicationView(application),
							hackathonStatus: hackathon.status,
						}
					: null;
			}),
		);
		return rows.filter((row) => row !== null);
	},
});

export const apply = mutation({
	args: { hackathonId: v.id("hackathons"), answer: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await ctx.db.get(args.hackathonId);
		if (!hackathon || hackathon.status === "draft") {
			throw new Error("Hackathon not found");
		}
		requireOpen(hackathon);
		if (await getTeamRole(ctx, hackathon.startupId, userId)) {
			throw new Error("You're on this startup");
		}
		if (await getApplication(ctx, hackathon._id, userId)) {
			throw new Error("You've already applied");
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

/** Makes an applicant a Builder. They start building when the Hackathon starts. */
export const accept = mutation({
	args: { applicationId: v.id("applications") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { application, hackathon } = await requireApplicationFounder(
			ctx,
			args.applicationId,
			userId,
		);
		requireOpen(hackathon);
		if (application.status === "building") {
			return;
		}
		if (hackathon.builderCount >= MAX_BUILDERS) {
			throw new Error(`${MAX_BUILDERS} Builders is the limit`);
		}

		await ctx.db.patch(application._id, { status: "building" });
		await ctx.db.patch(hackathon._id, {
			builderCount: hackathon.builderCount + 1,
		});
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
		requireOpen(hackathon);

		await ctx.db.patch(application._id, { status: "declined" });
		if (application.status === "building") {
			await ctx.db.patch(hackathon._id, {
				builderCount: hackathon.builderCount - 1,
			});
		}
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
		requireRunning(hackathon);
		requireBuilding(application);

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
		requireRunning(hackathon);
		requireBuilding(application);
		if (!application.shortlisted) {
			throw new Error("Shortlist them first");
		}
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
		requireBuilding(application);
		if (application.decision) {
			throw new Error("Already decided");
		}
		if (hackathon.status === "done") {
			throw new Error("This Hackathon has ended");
		}
		const now = Date.now();
		requireDecidable(hackathon, now);
		const feedback = limitText(args.feedback, "Feedback", TEXT.feedback);
		if (args.decision === "hired" && application.walkthroughAt === undefined) {
			throw new Error("Do the Walkthrough first");
		}

		await ctx.db.patch(application._id, { decision: args.decision, feedback });
		if (args.decision === "hired") {
			const builder = await ctx.db.get(application.userId);
			if (!builder?.email) {
				throw new Error("This Builder has no email to invite");
			}
			await ensureHireInvite(ctx, {
				startupId: hackathon.startupId,
				userId: builder._id,
				email: builder.email,
				invitedBy: userId,
				hackathonId: hackathon._id,
			});
			await appendActivity(ctx, {
				startupId: hackathon.startupId,
				kind: "builder_hired",
				at: now,
				actorId: application.userId,
				hackathonId: hackathon._id,
			});
		}
		await finishIfDecided(ctx, hackathon);
	},
});

/** The Builder says whether the Startup kept what it promised Builders. */
export const keepPromise = mutation({
	args: { applicationId: v.id("applications"), kept: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const application = await ctx.db.get(args.applicationId);
		if (!application || application.userId !== userId) {
			throw new Error("This isn't your application");
		}
		if (!application.decision) {
			throw new Error("Wait for the decision");
		}
		if (application.promiseKept !== undefined) {
			throw new Error("Already answered");
		}

		await ctx.db.patch(application._id, { promiseKept: args.kept });
	},
});
