import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { MAX_CONTRIBUTORS } from "../contributors/rules";

type Ctx = QueryCtx | MutationCtx;

export type TeamRole = "founder" | "contributor";

/** The person's place on the Startup, or null when they are not on it. */
export async function getTeamRole(
	ctx: Ctx,
	startupId: Id<"startups">,
	userId: Id<"users">,
): Promise<TeamRole | null> {
	const startup = await ctx.db.get(startupId);
	return startup ? await roleOn(ctx, startup, userId) : null;
}

async function roleOn(
	ctx: Ctx,
	startup: Doc<"startups">,
	userId: Id<"users">,
): Promise<TeamRole | null> {
	if (startup.founderId === userId) {
		return "founder";
	}
	const contributor = await ctx.db
		.query("contributors")
		.withIndex("by_startup_and_user", (q) =>
			q.eq("startupId", startup._id).eq("userId", userId),
		)
		.unique();
	if (!contributor) {
		return null;
	}
	return contributor.isFounder ? "founder" : "contributor";
}

/** Everyone with the Founder's powers: the Founder, then Co-founders. */
export async function loadFounderIds(
	ctx: Ctx,
	startup: Doc<"startups">,
): Promise<Id<"users">[]> {
	const rows = await ctx.db
		.query("contributors")
		.withIndex("by_startup_and_user", (q) => q.eq("startupId", startup._id))
		.take(MAX_CONTRIBUTORS);
	return [
		startup.founderId,
		...rows.filter((row) => row.isFounder).map((row) => row.userId),
	];
}

export async function requireTeam(
	ctx: Ctx,
	startupId: Id<"startups">,
	userId: Id<"users">,
): Promise<{ startup: Doc<"startups">; role: TeamRole }> {
	const startup = await ctx.db.get(startupId);
	const role = startup ? await roleOn(ctx, startup, userId) : null;
	if (!startup || !role) {
		throw new ConvexError("You're not on this startup");
	}
	return { startup, role };
}

export async function requireFounder(
	ctx: Ctx,
	startupId: Id<"startups">,
	userId: Id<"users">,
): Promise<Doc<"startups">> {
	const { startup, role } = await requireTeam(ctx, startupId, userId);
	if (role !== "founder") {
		throw new ConvexError("Only the Founder can do this");
	}
	return startup;
}

/** The Founder who created the Startup, not a Co-founder: making Co-founders and billing are theirs. */
export async function requireOwner(
	ctx: Ctx,
	startupId: Id<"startups">,
	userId: Id<"users">,
): Promise<Doc<"startups">> {
	const startup = await ctx.db.get(startupId);
	if (!startup || startup.founderId !== userId) {
		throw new ConvexError("Only the Founder can do this");
	}
	return startup;
}
