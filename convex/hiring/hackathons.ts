import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { internalMutation, mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import {
	getApplication,
	loadParticipants,
	toMyApplicationView,
} from "../model/applications";
import { loadHackathonCardsInReview } from "../model/cards";
import * as lifecycle from "../model/hackathonLifecycle";
import {
	copyTemplateCardsTo,
	draftArgs,
	insertTemplateCards,
	loadHackathonCards,
	matchesExplore,
	replaceTemplateCards,
	requireHackathonFounder,
	requireValidDraft,
	sortExplore,
	toExploreHackathon,
} from "../model/hackathons";
import {
	type HiringRecord,
	loadHiringRecord,
	tallyParticipants,
} from "../model/hiringRecord";
import { loadLogoUrl, toPublicStartup } from "../model/startups";
import { getTeamRole, requireFounder, requireTeam } from "../model/teamAccess";
import { phaseOf } from "../shared/hackathonPhase";
import { MAX_EXPLORE_ROWS, MAX_LISTED_HACKATHONS } from "../shared/limits";
import { hackathonWeeks, jobRole } from "../shared/validators";

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
				const [participants, inReview] = await Promise.all([
					loadParticipants(ctx, hackathon._id),
					loadHackathonCardsInReview(ctx, hackathon._id),
				]);
				const tally = tallyParticipants(hackathon, participants);
				return {
					_id: hackathon._id,
					job: hackathon.job,
					status: hackathon.status,
					weeks: hackathon.weeks,
					startsAt: hackathon.startsAt,
					endsAt: hackathon.endsAt,
					decideBy: hackathon.decideBy,
					applicantCount: hackathon.applicantCount,
					participantCount: participants.length,
					toReview: inReview.length,
					toDecide:
						phaseOf(hackathon, Date.now()) === "deciding"
							? participants.filter((p) => !p.decision).length
							: 0,
					...tally,
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

		return { hackathon, cards: await loadHackathonCards(ctx, hackathon._id) };
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
			? await getApplication(ctx, hackathon._id, userId)
			: null;

		const publicStartup = await toPublicStartup(ctx, startup);

		return {
			_id: hackathon._id,
			job: hackathon.job,
			problem: hackathon.problem,
			/** The Card titles, only for people who are signed in. */
			cards: userId
				? (await loadHackathonCards(ctx, hackathon._id)).map(
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
		weeks: v.optional(hackathonWeeks),
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

		const startupIds = [
			...new Set(shown.map((hackathon) => hackathon.startupId)),
		];
		const startups = new Map<
			Id<"startups">,
			{
				startup: Doc<"startups">;
				hiringRecord: HiringRecord;
				logoUrl: string | null;
			} | null
		>(
			await Promise.all(
				startupIds.map(async (startupId) => {
					const startup = await ctx.db.get(startupId);
					if (!startup) {
						return [startupId, null] as const;
					}
					const [hiringRecord, logoUrl] = await Promise.all([
						loadHiringRecord(ctx, startupId),
						loadLogoUrl(ctx, startup),
					]);
					return [startupId, { startup, hiringRecord, logoUrl }] as const;
				}),
			),
		);

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
		await lifecycle.publish(ctx, hackathon, userId);
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
		await lifecycle.declineApplied(ctx, args.hackathonId);
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
