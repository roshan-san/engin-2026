import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { newStartingPulse } from "~/features/hiring/trialCycles/components/StartingPulsesField";
import type { HackathonFormValues } from "~/features/hiring/trialCycles/hooks/useHackathonForm";
import { toDateTimeInput } from "~/lib/dates";

export type HackathonDraftState =
	| { readonly kind: "loading" }
	| { readonly kind: "missing" }
	| { readonly kind: "notDraft" }
	| { readonly kind: "ready"; readonly initialValues: HackathonFormValues };

/**
 * Loads an unpublished hackathon into form values, once both the trial and
 * its Starting Pulses arrive. Skipped until the viewer is known to be a founder.
 */
export function useHackathonDraft(
	startupId: Id<"startups"> | undefined,
	trialCycleId: Id<"trialCycles">,
	isFounder: boolean,
): HackathonDraftState {
	const trial = useQuery(
		api.hiring.trialCycles.get,
		isFounder ? { trialCycleId } : "skip",
	);
	const isOwnDraft =
		trial?.status === "draft" &&
		trial.isFounder &&
		trial.startupId === startupId;
	// `challenges.list` throws for non-founders, so it waits for the trial.
	const challenges = useQuery(
		api.hiring.challenges.list,
		isOwnDraft ? { trialCycleId } : "skip",
	);

	if (trial === undefined) {
		return { kind: "loading" };
	}
	if (trial === null || trial.startupId !== startupId || !trial.isFounder) {
		return { kind: "missing" };
	}
	if (trial.status !== "draft") {
		return { kind: "notDraft" };
	}
	if (challenges === undefined) {
		return { kind: "loading" };
	}

	return {
		kind: "ready",
		initialValues: {
			roleId: trial.roleId,
			title: trial.title,
			description: trial.description,
			maxContributors: String(trial.maxContributors),
			schedule: {
				startsAt: toDateTimeInput(trial.startsAt),
				endsAt: toDateTimeInput(trial.endsAt),
				applicationDeadline:
					trial.applicationDeadline === undefined
						? ""
						: toDateTimeInput(trial.applicationDeadline),
			},
			prize: trial.prize ?? "",
			expectedOutcome: trial.expectedOutcome ?? "",
			evaluationCriteria: trial.evaluationCriteria ?? "",
			compensation: trial.compensation ?? "",
			challenges: challenges.map((challenge) =>
				newStartingPulse(challenge.title, challenge.description ?? ""),
			),
		},
	};
}
