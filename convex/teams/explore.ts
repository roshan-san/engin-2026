import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { query } from "../_generated/server";
import { buildSearchText } from "../lib/text";

const PAGE_SIZE = 30;

async function findStartups(
	ctx: QueryCtx,
	term: string,
	category?: string,
	stage?: string,
) {
	let startups: Doc<"startups">[];

	if (!term) {
		startups = await ctx.db
			.query("startups")
			.withIndex("by_public", (q) => q.eq("isPublic", true))
			.order("desc")
			.take(PAGE_SIZE * 2);
	} else {
		startups = await ctx.db
			.query("startups")
			.withSearchIndex("search_startups", (q) =>
				q.search("searchText", term).eq("isPublic", true),
			)
			.take(PAGE_SIZE * 2);
	}

	return startups
		.filter((startup) => {
			if (category && startup.category !== category) {
				return false;
			}
			if (stage && startup.stage !== stage) {
				return false;
			}
			return true;
		})
		.slice(0, PAGE_SIZE);
}

export const search = query({
	args: {
		term: v.optional(v.string()),
		category: v.optional(v.string()),
		stage: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const term = buildSearchText(args.term);
		const startups = await findStartups(ctx, term, args.category, args.stage);

		return {
			startups: startups.map((startup) => ({
				_id: startup._id,
				name: startup.name,
				slug: startup.slug,
				tagline: startup.tagline ?? null,
				description: startup.description ?? null,
				category: startup.category ?? null,
				stage: startup.stage ?? null,
				followerCount: startup.followerCount,
			})),
		};
	},
});
