import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/** Everyone who applied, Participants first, for the Founder. */
export function useApplicants(hackathonId: Id<"hackathons">) {
	return useQuery(api.hiring.applications.listForHackathon, { hackathonId });
}

/** One Applicant's answer, profile and Record. */
export function useApplicant(applicationId: Id<"applications"> | undefined) {
	return useQuery(
		api.hiring.applications.getApplicant,
		applicationId ? { applicationId } : "skip",
	);
}

/** Accepting and declining before the start. Failures are toasted and resolve `false`. */
export function useScreening() {
	const acceptApplication = useMutation(api.hiring.applications.accept);
	const declineApplication = useMutation(api.hiring.applications.decline);

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
		accept: (applicationId: Id<"applications">) =>
			run(() => acceptApplication({ applicationId })),
		decline: (applicationId: Id<"applications">) =>
			run(() => declineApplication({ applicationId })),
	};
}
