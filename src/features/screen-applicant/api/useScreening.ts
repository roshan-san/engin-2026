import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { attempt } from "~/shared/lib/errors";

/** Accepting, declining and asking before the start. Failures are toasted and resolve `false`. */
export function useScreening() {
	const acceptApplication = useMutation(api.applications.accept);
	const declineApplication = useMutation(api.applications.decline);
	const askApplicant = useMutation(api.applications.ask);

	return {
		accept: (applicationId: Id<"applications">) =>
			attempt(() => acceptApplication({ applicationId })),
		decline: (applicationId: Id<"applications">) =>
			attempt(() => declineApplication({ applicationId })),
		ask: (applicationId: Id<"applications">) =>
			attempt(() => askApplicant({ applicationId })),
	};
}
