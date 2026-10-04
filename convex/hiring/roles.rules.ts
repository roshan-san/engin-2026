import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { MAX_ROLE_TRIALS, ROLE_TEXT_LIMITS } from "../lib/limits";
import { normalizeTags } from "../lib/text";

/** A Role stays open while any of its hackathons is unpublished, open or running. */
export async function requireNoLiveHackathons(
	ctx: MutationCtx,
	roleId: Id<"roles">,
): Promise<void> {
	const trials = await ctx.db
		.query("trialCycles")
		.withIndex("by_role", (q) => q.eq("roleId", roleId))
		.take(MAX_ROLE_TRIALS);
	const hasLive = trials.some(
		(trial) =>
			trial.status === "draft" ||
			trial.status === "open" ||
			trial.status === "active",
	);
	if (hasLive) {
		throw new Error("Cancel this Role's hackathons first.");
	}
}

export function parseSkills(skills: string[]): string[] {
	return normalizeTags(skills, ROLE_TEXT_LIMITS.skills) ?? [];
}
