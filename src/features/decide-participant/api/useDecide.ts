import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { attempt } from "~/shared/lib/errors";

/** ★ Shortlist, request the Walkthrough, mark it done, then an Offer or Not this time. Failures are toasted and resolve `false`. */
export function useDecide(applicationId: Id<"applications">) {
	const shortlistParticipant = useMutation(api.applications.shortlist);
	const requestParticipantWalkthrough = useMutation(
		api.applications.requestWalkthrough,
	);
	const markWalkthroughDone = useMutation(api.applications.markWalkthrough);
	const decideParticipant = useMutation(api.applications.decide);
	const resendParticipantOffer = useMutation(api.applications.resendOffer);

	return {
		shortlist: (shortlisted: boolean) =>
			attempt(() => shortlistParticipant({ applicationId, shortlisted })),
		requestWalkthrough: () =>
			attempt(() => requestParticipantWalkthrough({ applicationId })),
		markWalkthrough: (notes: string) =>
			attempt(() =>
				markWalkthroughDone({
					applicationId,
					notes: notes.trim() || undefined,
				}),
			),
		decide: (
			decision: "hired" | "not_this_time",
			feedback: string,
			terms: string,
		) =>
			attempt(() =>
				decideParticipant({
					applicationId,
					decision,
					feedback: feedback.trim() || undefined,
					terms: decision === "hired" ? terms.trim() : undefined,
				}),
			),
		resendOffer: () => attempt(() => resendParticipantOffer({ applicationId })),
	};
}
