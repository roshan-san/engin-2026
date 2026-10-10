import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation, mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import {
	MAX_BUILDERS,
	MAX_HACKATHON_CARDS,
	MAX_LISTED_HACKATHONS,
} from "../lib/limits";
import { requireFounder, requireTeam } from "../startups/access.rules";
import { toMyApplicationView } from "./applications.rules";
import {
	copyTemplateCardsTo,
	countUndecidedBuilders,
	declineAppliedBatch,
	draftArgs,
	insertTemplateCards,
	loadTemplateCards,
	replaceTemplateCards,
	requireHackathonFounder,
	requireValidDraft,
} from "./hackathons.rules";

export const list = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { role } = await requireTeam(ctx, args.startupId, userId);

		const hackathons = await ctx.db
			.query("hackathons")
			.withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
			.order("desc")
			.take(MAX_LISTED_HACKATHONS);
		// Drafts are the Founder's until published.
		const visible =
			role === "founder"
				? hackathons
				: hackathons.filter((hackathon) => hackathon.status !== "draft");

		return await Promise.all(
			visible.map(async (hackathon) => {
				const inReview = await ctx.db
					.query("cards")
					.withIndex("by_hackathon_and_status", (q) =>
						q.eq("hackathonId", hackathon._id).eq("status", "review"),
					)
					.take(MAX_BUILDERS * MAX_HACKATHON_CARDS);
				return {
					_id: hackathon._id,
					job: hackathon.job,
					status: hackathon.status,
					startsAt: hackathon.startsAt,
					endsAt: hackathon.endsAt,
					decideBy: hackathon.decideBy,
					applicantCount: hackathon.applicantCount,
					builderCount: hackathon.builderCount,
					toReview: inReview.filter((card) => card.ownerId).length,
					toDecide:
						hackathon.status === "deciding"
							? await countUndecidedBuilders(ctx, hackathon._id)
							: 0,
				};
			}),
		);
	},
});

export const get = query({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await requireHackathonFounder(
			ctx,
			args.hackathonId,
			userId,
		);

		return { hackathon, cards: await loadTemplateCards(ctx, hackathon._id) };
	},
});

export const getPublic = query({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const hackathon = await ctx.db.get(args.hackathonId);
		if (!hackathon || hackathon.status === "draft") {
			return null;
		}
		const startup = await ctx.db.get(hackathon.startupId);
		if (!startup) {
			return null;
		}

		const userId = await getAuthUserId(ctx);
		const application = userId
			? await ctx.db
					.query("applications")
					.withIndex("by_hackathon_and_user", (q) =>
						q.eq("hackathonId", hackathon._id).eq("userId", userId),
					)
					.unique()
			: null;

		return {
			_id: hackathon._id,
			job: hackathon.job,
			problem: hackathon.problem,
			weeks: hackathon.weeks,
			startsAt: hackathon.startsAt,
			buildersGet: hackathon.buildersGet ?? null,
			status: hackathon.status,
			startup: {
				name: startup.name,
				slug: startup.slug,
				rating: startup.rating,
			},
			applicantCount: hackathon.applicantCount,
			myApplication: application ? toMyApplicationView(application) : null,
		};
	},
});

export const create = mutation({
	args: { startupId: v.id("startups"), ...draftArgs },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounder(ctx, args.startupId, userId);
		const { cards, ...draft } = requireValidDraft(args, Date.now());

		const hackathonId = await ctx.db.insert("hackathons", {
			startupId: args.startupId,
			status: "draft",
			builderCount: 0,
			applicantCount: 0,
			...draft,
		});
		await insertTemplateCards(
			ctx,
			{ _id: hackathonId, startupId: args.startupId },
			cards,
		);
		return hackathonId;
	},
});

export const update = mutation({
	args: { hackathonId: v.id("hackathons"), ...draftArgs },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await requireHackathonFounder(
			ctx,
			args.hackathonId,
			userId,
		);
		if (hackathon.status !== "draft") {
			throw new Error("Only drafts can be edited");
		}
		const { cards, ...draft } = requireValidDraft(args, Date.now());

		// A patch with `undefined` removes the field, so clearing it works.
		await ctx.db.patch(hackathon._id, draft);
		await replaceTemplateCards(ctx, hackathon, cards);
	},
});

export const publish = mutation({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathon = await requireHackathonFounder(
			ctx,
			args.hackathonId,
			userId,
		);
		if (hackathon.status !== "draft") {
			throw new Error("Already published");
		}
		if (hackathon.startsAt <= Date.now()) {
			throw new Error("Start on a coming Monday");
		}

		await ctx.db.patch(hackathon._id, { status: "open" });
		await ctx.db.insert("threads", {
			startupId: hackathon.startupId,
			hackathonId: hackathon._id,
			kind: "everyone",
		});
		await ctx.scheduler.runAt(
			hackathon.startsAt,
			internal.hiring.hackathons.startBuilding,
			{ hackathonId: hackathon._id },
		);
		await ctx.scheduler.runAt(
			hackathon.endsAt,
			internal.hiring.hackathons.startDeciding,
			{ hackathonId: hackathon._id },
		);
	},
});

export const startBuilding = internalMutation({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const hackathon = await ctx.db.get(args.hackathonId);
		if (hackathon?.status !== "open") {
			return;
		}

		if (await declineAppliedBatch(ctx, hackathon._id)) {
			await ctx.scheduler.runAfter(
				0,
				internal.hiring.hackathons.declineApplied,
				{
					hackathonId: hackathon._id,
				},
			);
		}

		const builders = await ctx.db
			.query("applications")
			.withIndex("by_hackathon_and_status", (q) =>
				q.eq("hackathonId", hackathon._id).eq("status", "building"),
			)
			.take(MAX_BUILDERS);
		// Nobody to build with: nothing was built, so there is nothing to log.
		await ctx.db.patch(hackathon._id, {
			status: builders.length === 0 ? "done" : "building",
		});
		for (const builder of builders) {
			await ctx.scheduler.runAfter(0, internal.hiring.hackathons.copyCardsFor, {
				hackathonId: hackathon._id,
				userId: builder.userId,
			});
		}
	},
});

/** Declines the rest of the applicants not picked, a batch at a time. */
export const declineApplied = internalMutation({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const hackathon = await ctx.db.get(args.hackathonId);
		if (
			!hackathon ||
			hackathon.status === "draft" ||
			hackathon.status === "open"
		) {
			return;
		}
		if (await declineAppliedBatch(ctx, hackathon._id)) {
			await ctx.scheduler.runAfter(
				0,
				internal.hiring.hackathons.declineApplied,
				{
					hackathonId: hackathon._id,
				},
			);
		}
	},
});

export const copyCardsFor = internalMutation({
	args: { hackathonId: v.id("hackathons"), userId: v.id("users") },
	handler: async (ctx, args) => {
		const hackathon = await ctx.db.get(args.hackathonId);
		if (!hackathon) {
			return;
		}
		await copyTemplateCardsTo(ctx, hackathon, args.userId);
	},
});

export const startDeciding = internalMutation({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const hackathon = await ctx.db.get(args.hackathonId);
		if (hackathon?.status !== "building") {
			return;
		}
		await ctx.db.patch(hackathon._id, { status: "deciding" });
	},
});
