import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { getMembership } from "../teams/membership";
import { getTrialApplication, isTrialLive } from "./trialCycles";

type ThreadCtx = QueryCtx | MutationCtx;

/** Whose side of a Thread the caller is on. */
export type ThreadAccess =
	| { side: "founder"; participantUserId: Id<"users"> }
	| { side: "participant"; participantUserId: Id<"users"> };

/** Applicants have no Thread; Participants keep read access after the close. */
async function hasThread(
	ctx: ThreadCtx,
	trialCycleId: Id<"trialCycles">,
	userId: Id<"users">,
): Promise<boolean> {
	const application = await getTrialApplication(ctx, trialCycleId, userId);
	return (
		application?.status === "joined" || application?.status === "completed"
	);
}

export async function requireTrialFounder(
	ctx: ThreadCtx,
	trial: Doc<"trialCycles">,
	userId: Id<"users">,
): Promise<void> {
	const membership = await getMembership(ctx, trial.startupId, userId);
	if (membership?.role !== "founder") {
		throw new Error("Only founders can perform this action");
	}
}

/**
 * Resolves which Thread the caller may open. Founders name the Participant;
 * anyone else only ever gets their own, so a Member who is also a
 * Participant is treated as one.
 */
export async function requireThreadAccess(
	ctx: ThreadCtx,
	trial: Doc<"trialCycles">,
	userId: Id<"users">,
	requested: Id<"users"> | undefined,
): Promise<ThreadAccess> {
	const membership = await getMembership(ctx, trial.startupId, userId);
	if (membership?.role === "founder") {
		if (!requested) {
			throw new Error("Choose a Participant to open their Thread");
		}
		if (!(await hasThread(ctx, trial._id, requested))) {
			throw new Error("That person is not a Participant in this Trial Cycle");
		}
		return { side: "founder", participantUserId: requested };
	}

	if (!(await hasThread(ctx, trial._id, userId))) {
		throw new Error("You do not have access to this Trial Cycle");
	}
	if (requested && requested !== userId) {
		throw new Error("You can only open your own Thread");
	}
	return { side: "participant", participantUserId: userId };
}

/** Threads and Announcements are read-only once the Trial Cycle is over. */
export function requireThreadOpen(trial: Doc<"trialCycles">): void {
	if (!isTrialLive(trial)) {
		throw new Error("This Trial Cycle is closed, so it is read-only");
	}
}

export async function requireTrial(
	ctx: ThreadCtx,
	trialCycleId: Id<"trialCycles">,
): Promise<Doc<"trialCycles">> {
	const trial = await ctx.db.get(trialCycleId);
	if (!trial) {
		throw new Error("Trial Cycle not found");
	}
	return trial;
}

/** Newest first; an undefined `participantUserId` selects the Announcements. */
export async function latestMessages(
	ctx: ThreadCtx,
	trialCycleId: Id<"trialCycles">,
	participantUserId: Id<"users"> | undefined,
	limit: number,
): Promise<Doc<"trialMessages">[]> {
	return await ctx.db
		.query("trialMessages")
		.withIndex("by_trial_and_participant", (q) =>
			q
				.eq("trialCycleId", trialCycleId)
				.eq("participantUserId", participantUserId),
		)
		.order("desc")
		.take(limit);
}
