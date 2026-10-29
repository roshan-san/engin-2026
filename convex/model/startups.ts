import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { slugify } from "../lib/text";
import { RATING } from "../rating/model";
import { shiftWeek, weekStart } from "../shared/cycles";
import { MAX_LISTED_HACKATHONS, MAX_USER_STARTUPS } from "../shared/limits";
import { loadPublicUser } from "./users";

export async function getStartupBySlug(
	ctx: QueryCtx | MutationCtx,
	slug: string,
): Promise<Doc<"startups"> | null> {
	return await ctx.db
		.query("startups")
		.withIndex("by_slug", (q) => q.eq("slug", slug))
		.unique();
}

/** The Startups this person founded. Billing counts Hackathons across them, so `startups.create` holds the cap exactly. */
export async function loadFoundedStartups(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
): Promise<Doc<"startups">[]> {
	return await ctx.db
		.query("startups")
		.withIndex("by_founder", (q) => q.eq("founderId", userId))
		.take(MAX_USER_STARTUPS);
}

/** A Startup's Hackathons taking applications. */
export async function loadOpenHackathons(
	ctx: QueryCtx | MutationCtx,
	startupId: Id<"startups">,
): Promise<Doc<"hackathons">[]> {
	return await ctx.db
		.query("hackathons")
		.withIndex("by_startup_and_status", (q) =>
			q.eq("startupId", startupId).eq("status", "open"),
		)
		.take(MAX_LISTED_HACKATHONS);
}

export async function loadLogoUrl(
	ctx: QueryCtx | MutationCtx,
	startup: Doc<"startups">,
): Promise<string | null> {
	return startup.logo ? await ctx.storage.getUrl(startup.logo) : null;
}

/** `acme`, then `acme-2`, `acme-3`, … until no Startup has it. */
export async function buildUniqueSlug(
	ctx: QueryCtx | MutationCtx,
	name: string,
): Promise<string> {
	const base = slugify(name) || "startup";
	let slug = base;
	for (let n = 2; await getStartupBySlug(ctx, slug); n++) {
		slug = `${base}-${n}`;
	}
	return slug;
}

/** What anyone may see on a Startup's page. The Founder appears only as a public user. */
export async function toPublicStartup(
	ctx: QueryCtx | MutationCtx,
	startup: Doc<"startups">,
) {
	return {
		createdAt: startup._creationTime,
		name: startup.name,
		slug: startup.slug,
		oneLiner: startup.oneLiner ?? null,
		website: startup.website ?? null,
		logo: await loadLogoUrl(ctx, startup),
		stage: startup.stage,
		category: startup.category,
		city: startup.city,
		rating: startup.rating,
		ratingChange: startup.ratingChange,
		isProvisional: startup.provisional,
		founder: await loadPublicUser(ctx, startup.founderId),
	};
}

/**
 * The Explore strip: 12 weeks ending at `endWeek`, oldest first. `rhythm` is
 * the Startup's counts ending at `endWeek`; weeks before it are `null`.
 */
export function buildRhythmStrip(
	rhythm: number[],
	endWeek: string,
): { week: string; startsAt: number; count: number | null }[] {
	const firstCounted = RATING.weeks - rhythm.length;
	return Array.from({ length: RATING.weeks }, (_, i) => {
		const week = shiftWeek(endWeek, i + 1 - RATING.weeks);
		return {
			week,
			startsAt: weekStart(week),
			count: i >= firstCounted ? rhythm[i - firstCounted] : null,
		};
	});
}

/** Whether the Startup passes every chip that is set. */
export function matchesExploreStartup(
	startup: Doc<"startups">,
	chips: {
		stage?: Doc<"startups">["stage"];
		category?: Doc<"startups">["category"];
		city?: Doc<"startups">["city"];
	},
): boolean {
	return (
		(chips.stage === undefined || startup.stage === chips.stage) &&
		(chips.category === undefined || startup.category === chips.category) &&
		(chips.city === undefined || startup.city === chips.city)
	);
}

/** One Explore row. `endWeek` is the week the strip ends at, normally the last finished week. */
export async function toExploreStartup(
	ctx: QueryCtx | MutationCtx,
	startup: Doc<"startups">,
	endWeek: string,
) {
	return {
		slug: startup.slug,
		name: startup.name,
		oneLiner: startup.oneLiner ?? null,
		stage: startup.stage,
		category: startup.category,
		city: startup.city,
		rating: startup.rating,
		ratingChange: startup.ratingChange,
		isProvisional: startup.provisional,
		logoUrl: await loadLogoUrl(ctx, startup),
		strip: buildRhythmStrip(startup.rhythm, startup.ratedThrough ?? endWeek),
		isHiring: (await loadOpenHackathons(ctx, startup._id)).length > 0,
	};
}
