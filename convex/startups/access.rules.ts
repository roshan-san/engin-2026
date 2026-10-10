import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export type TeamRole = "founder" | "contributor";

/** The person's place on the Startup, or null when they are not on it. */
export async function getTeamRole(
	ctx: Ctx,
	startupId: Id<"startups">,
	userId: Id<"users">,
): Promise<TeamRole | null> {
	const startup = await ctx.db.get(startupId);
	if (!startup) {
		return null;
	}
	if (startup.founderId === userId) {
		return "founder";
	}
	const contributor = await ctx.db
		.query("contributors")
		.withIndex("by_startup_and_user", (q) =>
			q.eq("startupId", startupId).eq("userId", userId),
		)
		.unique();
	return contributor ? "contributor" : null;
}

export async function requireTeam(
	ctx: Ctx,
	startupId: Id<"startups">,
	userId: Id<"users">,
): Promise<{ startup: Doc<"startups">; role: TeamRole }> {
	const startup = await ctx.db.get(startupId);
	const role = startup ? await getTeamRole(ctx, startupId, userId) : null;
	if (!startup || !role) {
		throw new Error("You're not on this startup");
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
		throw new Error("Only the Founder can do this");
	}
	return startup;
}
