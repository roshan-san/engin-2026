import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { attempt } from "~/lib/errors";

/** ★ Shortlist, Walkthrough done, then Hired or Not this time. Failures are toasted and resolve `false`. */
export function useDecide(applicationId: Id<"applications">) {
	const shortlistParticipant = useMutation(api.hiring.applications.shortlist);
	const markWalkthroughDone = useMutation(
		api.hiring.applications.markWalkthrough,
	);
	const decideParticipant = useMutation(api.hiring.applications.decide);

	return {
		shortlist: (shortlisted: boolean) =>
			attempt(() => shortlistParticipant({ applicationId, shortlisted })),
		markWalkthrough: (notes: string) =>
			attempt(() =>
				markWalkthroughDone({
					applicationId,
					notes: notes.trim() || undefined,
				}),
			),
		decide: (decision: "hired" | "not_this_time", feedback: string) =>
			attempt(() =>
				decideParticipant({
					applicationId,
					decision,
					feedback: feedback.trim() || undefined,
				}),
			),
	};
}
