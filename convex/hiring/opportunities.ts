import { v } from "convex/values";
import type { QueryCtx } from "../_generated/server";
import { query } from "../_generated/server";
import { buildSearchText } from "../lib/text";

/** Without a search term, the newest open ones come first. */
const PAGE_SIZE = 30;

async function findRoles(ctx: QueryCtx, term: string) {
	if (!term) {
		return await ctx.db
			.query("roles")
			.withIndex("by_status", (q) => q.eq("status", "open"))
			.order("desc")
			.take(PAGE_SIZE);
	}

	return await ctx.db
		.query("roles")
		.withSearchIndex("search_roles", (q) =>
			q.search("searchText", term).eq("status", "open"),
		)
		.take(PAGE_SIZE);
}

async function findHackathons(ctx: QueryCtx, term: string) {
	const open = term
		? await ctx.db
				.query("hackathons")
				.withSearchIndex("search_hackathons", (q) =>
					q.search("searchText", term).eq("status", "open"),
				)
				.take(PAGE_SIZE)
		: await ctx.db
				.query("hackathons")
				.withIndex("by_status", (q) => q.eq("status", "open"))
				.order("desc")
				.take(PAGE_SIZE);

	return open;
}

export const search = query({
	args: { term: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const term = buildSearchText(args.term);
		const roles = await findRoles(ctx, term);
		const hackathons = await findHackathons(ctx, term);

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
				startupName: startup.name,
				startupSlug: startup.slug,
			});
		}

		const hackathonCards = [];
		for (const hackathon of hackathons) {
			const startup = await ctx.db.get(hackathon.startupId);
			if (!startup?.isPublic) {
				continue;
			}
			const role = await ctx.db.get(hackathon.roleId);
			hackathonCards.push({
				_id: hackathon._id,
				title: hackathon.title,
				description: hackathon.description,
				roleTitle: role?.title ?? "Role",
				participantCount: hackathon.participantCount,
				maxParticipants: hackathon.maxParticipants,
				deadline: hackathon.applicationDeadline ?? hackathon.startsAt,
				startsAt: hackathon.startsAt,
				endsAt: hackathon.endsAt,
				prize: hackathon.prize ?? null,
				startupName: startup.name,
				startupSlug: startup.slug,
			});
		}

		return { roles: roleCards, hackathons: hackathonCards };
	},
});
