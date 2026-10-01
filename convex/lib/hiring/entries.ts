import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import {
	LIVE_ENTRY_STATUSES,
	MAX_LIVE_ENTRIES,
	MAX_USER_APPLICATIONS,
} from "../limits";
import { getMembership } from "../teams/membership";
import { getTrialApplication, isTrialLive } from "./trialCycles";

function holdsEntrySlot(status: Doc<"applications">["status"]): boolean {
	return (LIVE_ENTRY_STATUSES as readonly string[]).includes(status);
}

async function countLiveEntries(ctx: MutationCtx, userId: Id<"users">) {
	const applications = await ctx.db
		.query("applications")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.take(MAX_USER_APPLICATIONS);

	let count = 0;
	for (const application of applications) {
		if (!holdsEntrySlot(application.status)) {
			continue;
		}
		const trial = await ctx.db.get(application.trialCycleId);
		if (trial && isTrialLive(trial)) {
			count += 1;
		}
	}
	return count;
}

/**
 * Nobody enters their own startup's hackathon (Score integrity, eng review
 * R3), everyone gets one attempt per Trial Cycle, and nobody holds more than
 * 5 live entries.
 */
export async function requireCanEnter(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
	userId: Id<"users">,
): Promise<void> {
	if (await getMembership(ctx, trial.startupId, userId)) {
		throw new Error(
			"You're on this startup's team, so you can't enter its hackathon",
		);
	}
	if (await getTrialApplication(ctx, trial._id, userId)) {
		throw new Error(
			"You get one attempt per Trial Cycle. Look for a later one for this Role.",
		);
	}
	if ((await countLiveEntries(ctx, userId)) >= MAX_LIVE_ENTRIES) {
		throw new Error(
			`You're in ${MAX_LIVE_ENTRIES} hackathons already. Finish or withdraw from one to join another.`,
		);
	}
}

/** Takes a Participant spot; the counter changes in the same mutation as the status. */
export async function takeParticipantSpot(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
): Promise<void> {
	if (trial.participantCount >= trial.maxContributors) {
		throw new Error("This Trial Cycle is full");
	}
	await ctx.db.patch(trial._id, {
		participantCount: trial.participantCount + 1,
	});
}

export async function releaseParticipantSpot(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
): Promise<void> {
	await ctx.db.patch(trial._id, {
		participantCount: Math.max(0, trial.participantCount - 1),
	});
}
