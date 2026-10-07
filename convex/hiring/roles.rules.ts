import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { MAX_ROLE_HACKATHONS, ROLE_TEXT_LIMITS } from "../lib/limits";
import { normalizeTags } from "../lib/text";

/** A Role stays open while any of its hackathons is unpublished, open or running. */
export async function requireNoLiveHackathons(
	ctx: MutationCtx,
	roleId: Id<"roles">,
): Promise<void> {
	const hackathons = await ctx.db
		.query("hackathons")
		.withIndex("by_role", (q) => q.eq("roleId", roleId))
		.take(MAX_ROLE_HACKATHONS);
	const hasLive = hackathons.some(
		(hackathon) =>
			hackathon.status === "draft" ||
			hackathon.status === "open" ||
			hackathon.status === "active",
	);
	if (hasLive) {
		throw new Error("Cancel this Role's hackathons first.");
	}
}

/** A draft hackathon's Cycle carries its Role's Team; published ones keep theirs. */
export async function syncRoleTeamToDrafts(
	ctx: MutationCtx,
	roleId: Id<"roles">,
	teamId: Id<"teams"> | undefined,
): Promise<void> {
	const hackathons = await ctx.db
		.query("hackathons")
		.withIndex("by_role", (q) => q.eq("roleId", roleId))
		.take(MAX_ROLE_HACKATHONS);
	for (const hackathon of hackathons) {
		if (hackathon.status === "draft") {
			await ctx.db.patch(hackathon.cycleId, { teamId });
		}
	}
}

export function parseSkills(skills: string[]): string[] {
	return normalizeTags(skills, ROLE_TEXT_LIMITS.skills) ?? [];
}
