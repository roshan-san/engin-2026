import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { query } from "../_generated/server";
import { buildSearchText } from "../lib/text";

const PAGE_SIZE = 30;
const CONTRIBUTOR_SCAN_LIMIT = 200;

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

/** A Verdict, a Verified Task, or a membership: the evidence Explore requires. */
async function hasEvidence(
	ctx: QueryCtx,
	userId: Id<"users">,
): Promise<boolean> {
	const membership = await ctx.db
		.query("memberships")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.first();
	if (membership) {
		return true;
	}

	const verifiedTask = await ctx.db
		.query("tasks")
		.withIndex("by_assignee", (q) => q.eq("assigneeUserId", userId))
		// Only a Founder's verify reaches done, on team Cycles and hackathons alike.
		.filter((q) => q.eq(q.field("status"), "done"))
		.first();
	if (verifiedTask) {
		return true;
	}

	const verdictApplication = await ctx.db
		.query("applications")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.filter((q) => q.neq(q.field("verdict"), undefined))
		.first();
	return verdictApplication !== null;
}

export const contributors = query({
	args: {
		skill: v.optional(v.string()),
		location: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const skill = args.skill?.trim().toLowerCase();
		const location = args.location?.trim().toLowerCase();

		const candidates = await ctx.db
			.query("users")
			.order("desc")
			.take(CONTRIBUTOR_SCAN_LIMIT);

		const results = [];
		for (const user of candidates) {
			if (!user.username || user.hideFromExplore) {
				continue;
			}
			if (
				skill &&
				!(user.skills ?? []).some((s) => s.toLowerCase().includes(skill))
			) {
				continue;
			}
			if (location && !(user.location ?? "").toLowerCase().includes(location)) {
				continue;
			}
			if (!(await hasEvidence(ctx, user._id))) {
				continue;
			}

			results.push({
				_id: user._id,
				name: user.name ?? null,
				username: user.username,
				location: user.location ?? null,
				skills: user.skills ?? [],
				score: user.score ?? 0,
			});
		}

		results.sort((a, b) => b.score - a.score);
		return results.slice(0, PAGE_SIZE);
	},
});

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
			})),
		};
	},
});
