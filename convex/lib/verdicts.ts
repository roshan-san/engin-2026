import type { Infer } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { trialVerdict } from "../schema";
import { MAX_TRIAL_PULSES } from "./limits";
import { notify } from "./notify";
import { resolveReview } from "./pulses";
import { refreshUserScore } from "./score";
import { optionalText, requireText } from "./text";
import { listTrialApplications } from "./trials";

type TrialVerdict = Infer<typeof trialVerdict>;

type CloseInput = {
	verdicts: {
		applicationId: Id<"applications">;
		verdict: TrialVerdict;
		evaluation?: string;
	}[];
	pulseReviews: {
		pulseId: Id<"pulses">;
		decision: "verify" | "reject";
		note?: string;
	}[];
};

/**
 * Closing is all-or-nothing: every Participant gets a Verdict and every
 * Submitted Pulse gets a decision, or nothing is written.
 */
export async function closeWithVerdicts(
	ctx: MutationCtx,
	trial: Doc<"trialCycles">,
	input: CloseInput,
): Promise<void> {
	if (trial.status !== "active") {
		throw new Error("Only an active Trial Cycle can be closed");
	}

	const participants = (await listTrialApplications(ctx, trial._id)).filter(
		(application) => application.status === "joined",
	);
	const verdictsByApplication = new Map(
		input.verdicts.map((entry) => [entry.applicationId, entry]),
	);
	if (
		verdictsByApplication.size !== participants.length ||
		participants.some(
			(participant) => !verdictsByApplication.has(participant._id),
		)
	) {
		throw new Error("Every Participant needs a Verdict");
	}

	const makesOffers = input.verdicts.some(
		(entry) => entry.verdict === "passed_with_offer",
	);
	const role = await ctx.db.get(trial.roleId);
	if (makesOffers && role?.status !== "open") {
		throw new Error("This Role is filled, so it can't make Offers");
	}

	const submittedPulses = await listSubmittedPulses(ctx, trial._id);
	const reviewsByPulse = new Map(
		input.pulseReviews.map((review) => [review.pulseId, review]),
	);
	if (submittedPulses.some((pulse) => !reviewsByPulse.has(pulse._id))) {
		throw new Error("Every Submitted Pulse needs a decision");
	}

	for (const pulse of submittedPulses) {
		const review = reviewsByPulse.get(pulse._id);
		await resolveReview(
			ctx,
			pulse,
			review?.decision === "verify"
				? { status: "done", reviewNote: undefined }
				: {
						status: "active",
						reviewNote: requireText(review?.note ?? "", "Review note"),
					},
		);
	}

	await ctx.db.patch(trial._id, { status: "closed" });

	for (const participant of participants) {
		const entry = verdictsByApplication.get(participant._id);
		if (!entry) {
			continue;
		}
		await ctx.db.patch(participant._id, {
			status: "completed",
			verdict: entry.verdict,
			evaluation: optionalText(entry.evaluation),
		});
		if (entry.verdict === "passed_with_offer") {
			await ctx.db.insert("offers", {
				applicationId: participant._id,
				trialCycleId: trial._id,
				roleId: trial.roleId,
				startupId: trial.startupId,
				userId: participant.userId,
				status: "pending",
			});
		}
		await refreshUserScore(ctx, participant.userId);
		await notify(ctx, {
			userId: participant.userId,
			kind: "trial_cycle",
			title: `Your Verdict for ${trial.title} is in`,
			href: `/app/trials/${trial._id}`,
		});
	}
}

async function listSubmittedPulses(
	ctx: MutationCtx,
	trialCycleId: Id<"trialCycles">,
) {
	return await ctx.db
		.query("pulses")
		.withIndex("by_trial_and_status", (q) =>
			q.eq("trialCycleId", trialCycleId).eq("status", "review"),
		)
		.take(MAX_TRIAL_PULSES);
}
