import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { slugify } from "../lib/text";

export async function getStartupBySlug(
	ctx: QueryCtx | MutationCtx,
	slug: string,
): Promise<Doc<"startups"> | null> {
	return await ctx.db
		.query("startups")
		.withIndex("by_slug", (q) => q.eq("slug", slug))
		.unique();
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

/** What anyone may see on a Startup's page. Never includes the Founder. */
export async function toPublicStartup(
	ctx: QueryCtx | MutationCtx,
	startup: Doc<"startups">,
) {
	return {
		name: startup.name,
		slug: startup.slug,
		oneLiner: startup.oneLiner ?? null,
		website: startup.website ?? null,
		logo: startup.logo ? await ctx.storage.getUrl(startup.logo) : null,
		stage: startup.stage,
		category: startup.category,
		city: startup.city,
		rating: startup.rating,
		ratingChange: startup.ratingChange,
	};
}
