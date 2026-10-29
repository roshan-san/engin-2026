import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";

/** Everyone who applied, Participants first, for the Founder. */
export function useApplicants(hackathonId: Id<"hackathons">) {
	return useQuery(api.applications.listForHackathon, { hackathonId });
}

/** One Applicant's answer, profile and Record. */
export function useApplicant(applicationId: Id<"applications"> | undefined) {
	return useQuery(
		api.applications.getApplicant,
		applicationId ? { applicationId } : "skip",
	);
}
