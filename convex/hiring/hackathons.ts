import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { internalMutation, mutation, query } from "../_generated/server";
import { toMyApplicationView } from "../model/applications";
import { requireUserId } from "../model/auth";
import { canPublishHackathon } from "../model/billing";
import {
	copyTemplateCardsTo,
	countUndecidedParticipants,
	declineAppliedBatch,
	draftArgs,
	insertTemplateCards,
	loadTemplateCards,
	matchesExplore,
	replaceTemplateCards,
	requireHackathonFounder,
	requireValidDraft,
	sortExplore,
	toExploreHackathon,
} from "../model/hackathons";
import * as lifecycle from "../model/hackathonLifecycle";
import { type HiringRecord, loadHiringRecord } from "../model/hiringRecord";
import { toPublicStartup } from "../model/startups";
import { getTeamRole, requireFounder, requireTeam } from "../model/teamAccess";
import { phaseOf } from "../shared/hackathonPhase";
import {
	MAX_EXPLORE_ROWS,
	MAX_HACKATHON_CARDS,
	MAX_LISTED_HACKATHONS,
	MAX_PARTICIPANTS,
} from "../shared/limits";
import { publishBlockMessage } from "../shared/plans";
import { jobRole } from "../shared/validators";

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
				const participants = await ctx.db
					.query("applications")
					.withIndex("by_hackathon_and_status", (q) =>
						q.eq("hackathonId", hackathon._id).eq("status", "participating"),
					)
					.take(MAX_PARTICIPANTS);
				const inReview = await ctx.db
					.query("cards")
					.withIndex("by_hackathon_and_status", (q) =>
						q.eq("hackathonId", hackathon._id).eq("status", "review"),
					)
					.take(MAX_PARTICIPANTS * MAX_HACKATHON_CARDS);
				return {
					_id: hackathon._id,
					job: hackathon.job,
					status: hackathon.status,
					weeks: hackathon.weeks,
					startsAt: hackathon.startsAt,
					endsAt: hackathon.endsAt,
					decideBy: hackathon.decideBy,
					applicantCount: hackathon.applicantCount,
					participantCount: hackathon.participantCount,
					toReview: inReview.filter((card) => card.ownerId).length,
					toDecide:
						phaseOf(hackathon, Date.now()) === "deciding"
							? await countUndecidedParticipants(ctx, hackathon._id)
							: 0,
					hires: participants.filter((b) => b.decision === "hired").length,
					promisesKept: participants.filter((b) => b.promiseKept === true)
						.length,
					promisesAnswered: participants.filter(
						(b) => b.promiseKept !== undefined,
					).length,
					undecided:
						hackathon.status === "done"
							? participants.filter((b) => !b.decision).length
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

/** A published Hackathon for anyone, with your application; the Card titles only when signed in. The id comes from a link, so anything that isn't one reads as missing. */
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
			/** The Card titles, only for people who are signed in. */
			cards: userId
				? (await loadTemplateCards(ctx, hackathon._id)).map(
						(card) => card.title,
					)
				: null,
			weeks: hackathon.weeks,
			startsAt: hackathon.startsAt,
			endsAt: hackathon.endsAt,
			decideBy: hackathon.decideBy,
			participantsGet: hackathon.participantsGet ?? null,
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

/** Hackathons Participants can still join or that are live now, for anyone. */
export const explore = query({
	args: {
		role: v.optional(jobRole),
		weeks: v.optional(v.union(v.literal(1), v.literal(2))),
		paid: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// Read each status in the order Explore shows it, so the bound keeps the first rows.
		const [open, live] = await Promise.all(
			(
				[
					["open", "asc"],
					["live", "desc"],
				] as const
			).map(([status, order]) =>
				ctx.db
					.query("hackathons")
					.withIndex("by_status_and_startsAt", (q) => q.eq("status", status))
					.order(order)
					.take(MAX_LISTED_HACKATHONS),
			),
		);
		const shown = sortExplore(open, live)
			.filter((hackathon) => matchesExplore(hackathon, args))
			.slice(0, MAX_EXPLORE_ROWS);

		const startups = new Map<
			Id<"startups">,
			{
				startup: Doc<"startups">;
				hiringRecord: HiringRecord;
				logoUrl: string | null;
			} | null
		>();
		for (const { startupId } of shown) {
			if (startups.has(startupId)) {
				continue;
			}
			const startup = await ctx.db.get(startupId);
			startups.set(
				startupId,
				startup
					? {
							startup,
							hiringRecord: await loadHiringRecord(ctx, startupId),
							logoUrl: startup.logo
								? await ctx.storage.getUrl(startup.logo)
								: null,
						}
					: null,
			);
		}

		return shown.flatMap((hackathon) => {
			const loaded = startups.get(hackathon.startupId);
			return loaded
				? [
						toExploreHackathon(
							hackathon,
							loaded.startup,
							loaded.hiringRecord,
							loaded.logoUrl,
						),
					]
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
			participantCount: 0,
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

		const block = await canPublishHackathon(ctx, userId);
		if (block) {
			throw new ConvexError(publishBlockMessage(block));
		}

		await lifecycle.publish(ctx, hackathon);
	},
});

export const goLive = internalMutation({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		await lifecycle.goLive(ctx, args.hackathonId);
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
		await lifecycle.startDeciding(ctx, args.hackathonId);
	},
});

export const closeDeciding = internalMutation({
	args: { hackathonId: v.id("hackathons") },
	handler: async (ctx, args) => {
		await lifecycle.closeDeciding(ctx, args.hackathonId);
	},
});
