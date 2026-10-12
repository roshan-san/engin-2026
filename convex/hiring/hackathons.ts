import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { internalMutation, mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import {
	MAX_BUILDERS,
	MAX_EXPLORE_ROWS,
	MAX_HACKATHON_CARDS,
	MAX_LISTED_HACKATHONS,
} from "../lib/limits";
import {
	getTeamRole,
	requireFounder,
	requireTeam,
} from "../startups/access.rules";
import { toPublicStartup } from "../startups/startups.rules";
import { toMyApplicationView } from "./applications.rules";
import {
	copyTemplateCardsTo,
	countUndecidedBuilders,
	declineAppliedBatch,
	draftArgs,
	finishHackathon,
	insertTemplateCards,
	loadTemplateCards,
	matchesExplore,
	replaceTemplateCards,
	requireHackathonFounder,
	requireValidDraft,
	sortExplore,
	toExploreHackathon,
} from "./hackathons.rules";
import { jobRole } from "./hiring.schema";
import { type HiringRecord, loadHiringRecord } from "./record.rules";

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
				const builders = await ctx.db
					.query("applications")
					.withIndex("by_hackathon_and_status", (q) =>
						q.eq("hackathonId", hackathon._id).eq("status", "building"),
					)
					.take(MAX_BUILDERS);
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
					weeks: hackathon.weeks,
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
					hires: builders.filter((b) => b.decision === "hired").length,
					promisesKept: builders.filter((b) => b.promiseKept === true).length,
					promisesAnswered: builders.filter((b) => b.promiseKept !== undefined)
						.length,
					undecided:
						hackathon.status === "done"
							? builders.filter((b) => !b.decision).length
							: 0,
				};
			}),
		);
	},
});

/** The Founder's Hackathon space; `null` for anyone else, or when the id (from a link) isn't a Hackathon. */
export const get = query({
	args: { hackathonId: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const hackathonId = ctx.db.normalizeId("hackathons", args.hackathonId);
		const hackathon = hackathonId ? await ctx.db.get(hackathonId) : null;
		if (
			!hackathon ||
			(await getTeamRole(ctx, hackathon.startupId, userId)) !== "founder"
		) {
			return null;
		}

		return { hackathon, cards: await loadTemplateCards(ctx, hackathon._id) };
	},
});

/** A published Hackathon for anyone, with your application. The id comes from a link, so anything that isn't one reads as missing. */
export const getPublic = query({
	args: { hackathonId: v.string() },
	handler: async (ctx, args) => {
		const hackathonId = ctx.db.normalizeId("hackathons", args.hackathonId);
		const hackathon = hackathonId ? await ctx.db.get(hackathonId) : null;
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

		const publicStartup = await toPublicStartup(ctx, startup);

		return {
			_id: hackathon._id,
			job: hackathon.job,
			problem: hackathon.problem,
			cards: (await loadTemplateCards(ctx, hackathon._id)).map(
				(card) => card.title,
			),
			weeks: hackathon.weeks,
			startsAt: hackathon.startsAt,
			endsAt: hackathon.endsAt,
			decideBy: hackathon.decideBy,
			buildersGet: hackathon.buildersGet ?? null,
			status: hackathon.status,
			startup: {
				name: publicStartup.name,
				slug: publicStartup.slug,
				oneLiner: publicStartup.oneLiner,
				logo: publicStartup.logo,
				rating: publicStartup.rating,
				ratingChange: publicStartup.ratingChange,
				isProvisional: publicStartup.isProvisional,
			},
			hiringRecord: await loadHiringRecord(ctx, startup._id),
			applicantCount: hackathon.applicantCount,
			isTeam: userId
				? (await getTeamRole(ctx, startup._id, userId)) !== null
				: false,
			myApplication: application ? toMyApplicationView(application) : null,
		};
	},
});

/** Hackathons Builders can still join or are building now, for anyone. */
export const explore = query({
	args: {
		role: v.optional(jobRole),
		weeks: v.optional(v.union(v.literal(1), v.literal(2))),
		paid: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// Read each status in the order Explore shows it, so the bound keeps the first rows.
		const [open, building] = await Promise.all(
			(
				[
					["open", "asc"],
					["building", "desc"],
				] as const
			).map(([status, order]) =>
				ctx.db
					.query("hackathons")
					.withIndex("by_status_and_startsAt", (q) => q.eq("status", status))
					.order(order)
					.take(MAX_LISTED_HACKATHONS),
			),
		);
		const shown = sortExplore(open, building)
			.filter((hackathon) => matchesExplore(hackathon, args))
			.slice(0, MAX_EXPLORE_ROWS);

		const startups = new Map<
			Id<"startups">,
			{ startup: Doc<"startups">; hiringRecord: HiringRecord } | null
		>();
		for (const { startupId } of shown) {
			if (startups.has(startupId)) {
				continue;
			}
			const startup = await ctx.db.get(startupId);
			startups.set(
				startupId,
				startup
					? { startup, hiringRecord: await loadHiringRecord(ctx, startupId) }
					: null,
			);
		}

		return shown.flatMap((hackathon) => {
			const loaded = startups.get(hackathon.startupId);
			return loaded
				? [toExploreHackathon(hackathon, loaded.startup, loaded.hiringRecord)]
				: [];
		});
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
			throw new ConvexError("Only drafts can be edited");
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
			throw new ConvexError("Already published");
		}
		if (hackathon.startsAt <= Date.now()) {
			throw new ConvexError("Start on a coming Monday");
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
		await ctx.scheduler.runAt(
			hackathon.decideBy,
			internal.hiring.hackathons.closeDeciding,
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

/** At `decideBy` the Hackathon closes; Builders still undecided stay that way. */
export const closeDeciding = internalMutation({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		const hackathon = await ctx.db.get(args.hackathonId);
		if (hackathon?.status !== "building" && hackathon?.status !== "deciding") {
			return;
		}
		await finishHackathon(ctx, hackathon);
	},
});
