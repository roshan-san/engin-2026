import type { Infer } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type { trialVerdict } from "../../schema";
import { trialCycleHref } from "../links";
import { MAX_TRIAL_APPLICATIONS } from "../limits";
import { notify, notifyFounders } from "../notify";
import { seedBoards } from "./challenges";
import { getMembership } from "../teams/membership";

type TrialCtx = QueryCtx | MutationCtx;

export function isPassed(
	verdict: Infer<typeof trialVerdict> | undefined,
): boolean {
	return verdict === "passed" || verdict === "passed_with_offer";
}

export async function getTrialApplication(
	ctx: TrialCtx,
	trialCycleId: Id<"trialCycles">,
	userId: Id<"users">,
) {
	return await ctx.db
		.query("applications")
		.withIndex("by_trial_and_user", (q) =>
			q.eq("trialCycleId", trialCycleId).eq("userId", userId),
		)
		.unique();
}

export async function listTrialApplications(
	ctx: TrialCtx,
	trialCycleId: Id<"trialCycles">,
) {
	return await ctx.db
		.query("applications")
		.withIndex("by_trial", (q) => q.eq("trialCycleId", trialCycleId))
		.take(MAX_TRIAL_APPLICATIONS);
}

export function isTrialLive(trial: Doc<"trialCycles">): boolean {
	return trial.status === "open" || trial.status === "active";
}

/** Entry closes at the application deadline, or at the start when none is set. */
export function requireAcceptingEntries(trial: Doc<"trialCycles">) {
	if (trial.status === "draft") {
		throw new Error("This hackathon isn't published yet");
	}
	const entryClosesAt = trial.applicationDeadline ?? trial.startsAt;
	if (trial.status !== "open" || Date.now() > entryClosesAt) {
		throw new Error("This Trial Cycle is no longer accepting people");
	}
}

/** Ends a Trial Cycle without Verdicts; carries no Score consequence. */
export async function cancelTrial(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
	reason?: string,
): Promise<void> {
	await ctx.db.patch(trial._id, { status: "cancelled" });

	const href = await trialCycleHref(ctx, trial);
	for (const application of await listTrialApplications(ctx, trial._id)) {
		if (application.status !== "joined" && application.status !== "applied") {
			continue;
		}
		await notify(ctx, {
			userId: application.userId,
			kind: "trial_cycle",
			title: `${trial.title} was cancelled`,
			body: reason,
			href,
		});
	}
}

/**
 * Runs at the start time: pending applications are rejected, then the Trial
 * Cycle either becomes active or, with nobody in it, is cancelled.
 */
export async function startTrial(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
): Promise<void> {
	const applications = await listTrialApplications(ctx, trial._id);
	const href = await trialCycleHref(ctx, trial);

	for (const application of applications) {
		if (application.status !== "applied") {
			continue;
		}
		await ctx.db.patch(application._id, { status: "rejected" });
		await notify(ctx, {
			userId: application.userId,
			kind: "application",
			title: `${trial.title} started without your application being accepted`,
			href,
		});
	}

	if (trial.participantCount === 0) {
		await ctx.db.patch(trial._id, { status: "cancelled" });
		await notifyFounders(ctx, trial.startupId, {
			kind: "trial_cycle",
			title: `${trial.title} was cancelled: nobody joined`,
			href,
		});
		return;
	}

	await ctx.db.patch(trial._id, { status: "active" });
	const participants = applications.filter(
		(application) => application.status === "joined",
	);
	await seedBoards(
		ctx,
		trial._id,
		participants.map((application) => application.userId),
	);
	for (const application of participants) {
		await notify(ctx, {
			userId: application.userId,
			kind: "trial_cycle",
			title: `${trial.title} has started`,
			href,
		});
	}
}

export async function isTrialParticipant(
	ctx: TrialCtx,
	trialCycleId: Id<"trialCycles">,
	userId: Id<"users">,
): Promise<boolean> {
	const application = await getTrialApplication(ctx, trialCycleId, userId);
	return application?.status === "joined";
}

export async function requireTrialAccess(
	ctx: TrialCtx,
	trial: Doc<"trialCycles">,
	userId: Id<"users">,
): Promise<{ isMember: boolean; isParticipant: boolean }> {
	const membership = await getMembership(ctx, trial.startupId, userId);
	const isParticipant = await isTrialParticipant(ctx, trial._id, userId);

	if (!membership && !isParticipant) {
		throw new Error("You do not have access to this Trial Cycle");
	}

	return { isMember: membership !== null, isParticipant };
}
