import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { newStarterTask } from "~/features/hiring/hackathons/components/StarterTasksField";
import type { HackathonFormValues } from "~/features/hiring/hackathons/hooks/useHackathonForm";
import { toDateTimeInput } from "~/lib/dates";

export type HackathonDraftState =
	| { readonly kind: "loading" }
	| { readonly kind: "missing" }
	| { readonly kind: "notDraft" }
	| { readonly kind: "ready"; readonly initialValues: HackathonFormValues };

/**
 * Loads an unpublished hackathon into form values, once both the hackathon and
 * its Starter Tasks arrive. Skipped until the viewer is known to be a founder.
 */
export function useHackathonDraft(
	startupId: Id<"startups"> | undefined,
	hackathonId: Id<"hackathons">,
	isFounder: boolean,
): HackathonDraftState {
	const hackathon = useQuery(
		api.hiring.hackathons.get,
		isFounder ? { hackathonId } : "skip",
	);
	const isOwnDraft =
		hackathon?.status === "draft" &&
		hackathon.isFounder &&
		hackathon.startupId === startupId;
	// `listStarterTasks` throws for non-founders, so it waits for the hackathon.
	const starterTasks = useQuery(
		api.hiring.hackathons.listStarterTasks,
		isOwnDraft ? { hackathonId } : "skip",
	);

	if (hackathon === undefined) {
		return { kind: "loading" };
	}
	if (
		hackathon === null ||
		hackathon.startupId !== startupId ||
		!hackathon.isFounder
	) {
		return { kind: "missing" };
	}
	if (hackathon.status !== "draft") {
		return { kind: "notDraft" };
	}
	if (starterTasks === undefined) {
		return { kind: "loading" };
	}

	return {
		kind: "ready",
		initialValues: {
			roleId: hackathon.roleId,
			title: hackathon.title,
			description: hackathon.description,
			maxParticipants: String(hackathon.maxParticipants),
			schedule: {
				startsAt: toDateTimeInput(hackathon.startsAt),
				endsAt: toDateTimeInput(hackathon.endsAt),
				applicationDeadline:
					hackathon.applicationDeadline === undefined
						? ""
						: toDateTimeInput(hackathon.applicationDeadline),
			},
			prize: hackathon.prize ?? "",
			expectedOutcome: hackathon.expectedOutcome ?? "",
			evaluationCriteria: hackathon.evaluationCriteria ?? "",
			compensation: hackathon.compensation ?? "",
			starterTasks: starterTasks.map((starterTask) =>
				newStarterTask(starterTask.title, starterTask.description ?? ""),
			),
		},
	};
}
