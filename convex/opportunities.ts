import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { buildSearchText } from "./lib/text";

const PAGE_SIZE = 30;

async function findRoles(ctx: QueryCtx, term: string) {
	if (!term) {
		return await ctx.db
			.query("roles")
			.withIndex("by_status", (q) => q.eq("status", "open"))
			.take(PAGE_SIZE);
	}

	return await ctx.db
		.query("roles")
		.withSearchIndex("search_roles", (q) =>
			q.search("searchText", term).eq("status", "open"),
		)
		.take(PAGE_SIZE);
}

async function findTrials(ctx: QueryCtx, term: string) {
	const open = term
		? await ctx.db
				.query("trialCycles")
				.withSearchIndex("search_trials", (q) =>
					q.search("searchText", term).eq("status", "open"),
				)
				.take(PAGE_SIZE)
		: await ctx.db
				.query("trialCycles")
				.withIndex("by_status", (q) => q.eq("status", "open"))
				.take(PAGE_SIZE);

	return open;
}

export const search = query({
	args: { term: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const term = buildSearchText(args.term);
		const roles = await findRoles(ctx, term);
		const trials = await findTrials(ctx, term);

		const roleCards = [];
		for (const role of roles) {
			const startup = await ctx.db.get(role.startupId);
			if (!startup?.isPublic) {
				continue;
			}
			roleCards.push({
				_id: role._id,
				title: role.title,
				type: role.type,
				skills: role.skills,
				description: role.description,
				location: role.location ?? null,
				remote: role.remote ?? null,
				compensation: role.compensation ?? null,
				startupName: startup.name,
				startupSlug: startup.slug,
			});
		}

		const trialCards = [];
		for (const trial of trials) {
			const startup = await ctx.db.get(trial.startupId);
			if (!startup?.isPublic) {
				continue;
			}
			trialCards.push({
				_id: trial._id,
				title: trial.title,
				description: trial.description,
				admission: trial.admission,
				participantCount: trial.participantCount,
				maxContributors: trial.maxContributors,
				startsAt: trial.startsAt,
				endsAt: trial.endsAt,
				startupName: startup.name,
				startupSlug: startup.slug,
			});
		}

		return { roles: roleCards, trials: trialCards };
	},
});
