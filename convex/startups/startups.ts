import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { MAX_USER_STARTUPS, STARTING_RATING, TEXT } from "../lib/limits";
import { assertUrl, limitText, requireLimitedText } from "../lib/text";
import { startupCategory, startupCity, startupStage } from "../schema";
import { getTeamRole, requireFounder } from "./access.rules";
import {
	buildUniqueSlug,
	getStartupBySlug,
	toPublicStartup,
} from "./startups.rules";

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
		return startup ? await toPublicStartup(ctx, startup) : null;
	},
});

/** Every Startup the person founded or contributes to, for the place switcher. */
export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);

		const founded = await ctx.db
			.query("startups")
			.withIndex("by_founder", (q) => q.eq("founderId", userId))
			.take(MAX_USER_STARTUPS);
		const contributions = await ctx.db
			.query("contributors")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.take(MAX_USER_STARTUPS);

		const contributed = (
			await Promise.all(
				contributions.map((contribution) => ctx.db.get(contribution.startupId)),
			)
		).filter((startup) => startup !== null);

		return [
			...founded.map((startup) => ({ startup, role: "founder" as const })),
			...contributed.map((startup) => ({
				startup,
				role: "contributor" as const,
			})),
		].map(({ startup, role }) => ({
			startupId: startup._id,
			slug: startup.slug,
			name: startup.name,
			role,
		}));
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
