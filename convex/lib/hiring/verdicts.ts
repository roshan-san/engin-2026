import type { Infer } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import type { trialVerdict } from "../../schema";
import { trialCycleHref } from "../links";
import { notify } from "../notify";
import { refreshUserScore } from "../reputation/score";
import { optionalText } from "../text";
import { listTrialApplications } from "./trialCycles";

type TrialVerdict = Infer<typeof trialVerdict>;

type CloseInput = {
	verdicts: {
		applicationId: Id<"applications">;
		verdict: TrialVerdict;
		evaluation?: string;
	}[];
};

/**
 * Closing is all-or-nothing: every Participant gets a Verdict, or nothing is
 * written. Pulses are not reviewed here; the Verdict judges the whole work.
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

	await ctx.db.patch(trial._id, { status: "closed" });

	const href = await trialCycleHref(ctx, trial);
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
			href,
		});
	}
}
