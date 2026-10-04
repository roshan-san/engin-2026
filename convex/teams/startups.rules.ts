import type { MutationCtx } from "../_generated/server";
import { buildSearchText, slugify } from "../lib/text";

export async function uniqueSlug(
	ctx: MutationCtx,
	name: string,
): Promise<string> {
	const base = slugify(name) || "startup";
	let slug = base;
	let suffix = 1;

	while (
		await ctx.db
			.query("startups")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique()
	) {
		slug = `${base}-${suffix}`;
		suffix += 1;
	}

	return slug;
}

export function toSearchText(input: {
	name: string;
	tagline?: string;
	description?: string;
	category?: string;
	stage?: string;
}) {
	return buildSearchText(
		input.name,
		input.tagline,
		input.description,
		input.category,
		input.stage,
	);
}
