import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/** ★ Shortlist, Walkthrough done, then Hired or Not this time. Failures are toasted and resolve `false`. */
export function useDecide(applicationId: Id<"applications">) {
	const shortlistBuilder = useMutation(api.hiring.applications.shortlist);
	const markWalkthroughDone = useMutation(
		api.hiring.applications.markWalkthrough,
	);
	const decideBuilder = useMutation(api.hiring.applications.decide);

	async function run(action: () => Promise<unknown>) {
		try {
			await action();
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	}

	return {
		shortlist: (shortlisted: boolean) =>
			run(() => shortlistBuilder({ applicationId, shortlisted })),
		markWalkthrough: (notes: string) =>
			run(() =>
				markWalkthroughDone({
					applicationId,
					notes: notes.trim() || undefined,
				}),
			),
		decide: (decision: "hired" | "not_this_time", feedback: string) =>
			run(() =>
				decideBuilder({
					applicationId,
					decision,
					feedback: feedback.trim() || undefined,
				}),
			),
	};
}
