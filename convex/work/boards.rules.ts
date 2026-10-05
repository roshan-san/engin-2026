import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	getTrialApplication,
	isTrialParticipant,
} from "../hiring/trialCycles.rules";
import { MAX_BOARD_PULSES } from "../lib/limits";
import { getMembership } from "../teams/membership.rules";

/**
 * Whose Board `viewerUserId` may read: a Participant only their own (still
 * after the close), a Founder anyone's. Members who aren't Founders see no
 * Boards (ADR 0003).
 */
export async function requireBoardAccess(
	ctx: QueryCtx,
	trial: Doc<"trialCycles">,
	viewerUserId: Id<"users">,
	requestedOwnerId?: Id<"users">,
): Promise<Id<"users">> {
	const ownerId = requestedOwnerId ?? viewerUserId;
	if (ownerId === viewerUserId) {
		const application = await getTrialApplication(ctx, trial._id, viewerUserId);
		if (
			application?.status === "joined" ||
			application?.status === "completed"
		) {
			return ownerId;
		}
	}

	const membership = await getMembership(ctx, trial.startupId, viewerUserId);
	if (membership?.role === "founder") {
		return ownerId;
	}
	throw new Error("You do not have access to this Board");
}

/** Board Pulses are worked only by their owner, and only while the Trial Cycle is active. */
export async function requireBoardOwner(
	ctx: QueryCtx,
	trial: Doc<"trialCycles">,
	pulse: Doc<"pulses">,
	userId: Id<"users">,
): Promise<void> {
	if (
		pulse.participantUserId !== userId ||
		!(await isTrialParticipant(ctx, trial._id, userId))
	) {
		throw new Error("This Pulse is not on your Board");
	}
	requireActiveTrial(trial);
}

function requireActiveTrial(trial: Doc<"trialCycles">): void {
	if (trial.status !== "active") {
		throw new Error("This Trial Cycle is not active");
	}
}

export async function createBoardPulse(
	ctx: MutationCtx,
	args: {
		trialCycleId: Id<"trialCycles">;
		startupId: Id<"startups">;
		userId: Id<"users">;
		title: string;
	},
): Promise<Id<"pulses">> {
	const trial = await ctx.db.get(args.trialCycleId);
	if (!trial || trial.startupId !== args.startupId) {
		throw new Error("Trial Cycle not found");
	}
	if (!(await isTrialParticipant(ctx, trial._id, args.userId))) {
		throw new Error("Only Participants have a Board");
	}
	requireActiveTrial(trial);

	const board = await ctx.db
		.query("pulses")
		.withIndex("by_trial_and_participant", (q) =>
			q.eq("trialCycleId", trial._id).eq("participantUserId", args.userId),
		)
		.take(MAX_BOARD_PULSES);
	if (board.length >= MAX_BOARD_PULSES) {
		throw new Error(`A Board can have at most ${MAX_BOARD_PULSES} Pulses`);
	}

	return await ctx.db.insert("pulses", {
		startupId: trial.startupId,
		trialCycleId: trial._id,
		participantUserId: args.userId,
		assigneeUserId: args.userId,
		title: args.title,
		status: "todo",
		createdByUserId: args.userId,
	});
}
