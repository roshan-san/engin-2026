import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { shiftWeek, weekOf } from "../cycles/rules";
import { requireUserId } from "../lib/auth";
import { assertUrl, limitText, requireLimitedText } from "../lib/text";
import { loadHiringRecord } from "../model/hiringRecord";
import {
	buildUniqueSlug,
	getStartupBySlug,
	loadFoundedStartups,
	loadOpenHackathons,
	matchesExploreStartup,
	toExploreStartup,
	toPublicStartup,
} from "../model/startups";
import { getTeamRole, requireFounder } from "../model/teamAccess";
import {
	EXPLORE_SCAN,
	MAX_EXPLORE_ROWS,
	MAX_USER_STARTUPS,
	STARTING_RATING,
	TEXT,
} from "../shared/limits";
import {
	startupCategory,
	startupCity,
	startupStage,
} from "../shared/validators";

export const getBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		const startup = userId ? await getStartupBySlug(ctx, args.slug) : null;
		if (!userId || !startup) {
			return null;
		}
		const role = await getTeamRole(ctx, startup._id, userId);
		return role ? { startup, role } : null;
	},
});

export const getPublic = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const startup = await getStartupBySlug(ctx, args.slug);
		if (!startup) {
			return null;
		}
		const open = await loadOpenHackathons(ctx, startup._id);
		return {
			...(await toPublicStartup(ctx, startup)),
			hiringRecord: await loadHiringRecord(ctx, startup._id),
			openHackathons: open.map((h) => ({
				hackathonId: h._id,
				job: h.job,
				weeks: h.weeks,
				startsAt: h.startsAt,
				participantsGet: h.participantsGet ?? null,
			})),
		};
	},
});

/** Startups for anyone, highest Rating first, narrowed by the chips. */
export const explore = query({
	args: {
		stage: v.optional(startupStage),
		category: v.optional(startupCategory),
		city: v.optional(startupCity),
	},
	handler: async (ctx, args) => {
		const startups = await ctx.db
			.query("startups")
			.withIndex("by_rating")
			.order("desc")
			.take(EXPLORE_SCAN);
		// A Startup not yet rated has its strip end at the last finished week.
		const lastWeek = shiftWeek(weekOf(Date.now()), -1);

		return await Promise.all(
			startups
				.filter((startup) => matchesExploreStartup(startup, args))
				.slice(0, MAX_EXPLORE_ROWS)
				.map((startup) => toExploreStartup(ctx, startup, lastWeek)),
		);
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		stage: startupStage,
		category: startupCategory,
		city: startupCity,
		oneLiner: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const founded = await loadFoundedStartups(ctx, userId);
		if (founded.length >= MAX_USER_STARTUPS) {
			throw new ConvexError(
				`You can found up to ${MAX_USER_STARTUPS} Startups`,
			);
		}
		const name = requireLimitedText(args.name, "Name", TEXT.startupName);
		const oneLiner = limitText(args.oneLiner, "One-liner", TEXT.oneLiner);
		const slug = await buildUniqueSlug(ctx, name);

		const startupId = await ctx.db.insert("startups", {
			name,
			slug,
			oneLiner,
			stage: args.stage,
			category: args.category,
			city: args.city,
			founderId: userId,
			rating: STARTING_RATING,
			ratingChange: 0,
			ratedWeeks: 0,
			provisional: true,
			rhythm: [],
		});
		await ctx.db.insert("threads", { startupId, kind: "team" });

		return { startupId, slug };
	},
});

type StartupPatch = Partial<
	Pick<
		Doc<"startups">,
		"name" | "oneLiner" | "website" | "logo" | "stage" | "category" | "city"
	>
>;

export const update = mutation({
	args: {
		startupId: v.id("startups"),
		name: v.optional(v.string()),
		oneLiner: v.optional(v.string()),
		website: v.optional(v.string()),
		logo: v.optional(v.id("_storage")),
		stage: v.optional(startupStage),
		category: v.optional(startupCategory),
		city: v.optional(startupCity),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounder(ctx, args.startupId, userId);
		const patch: StartupPatch = {};

		if (args.name !== undefined) {
			patch.name = requireLimitedText(args.name, "Name", TEXT.startupName);
		}
		if (args.oneLiner !== undefined) {
			patch.oneLiner = limitText(args.oneLiner, "One-liner", TEXT.oneLiner);
		}
		if (args.website !== undefined) {
			patch.website = assertUrl(args.website, "Website");
		}
		if (args.logo !== undefined) {
			patch.logo = args.logo;
		}
		if (args.stage !== undefined) {
			patch.stage = args.stage;
		}
		if (args.category !== undefined) {
			patch.category = args.category;
		}
		if (args.city !== undefined) {
			patch.city = args.city;
		}

		await ctx.db.patch(args.startupId, patch);
	},
});
