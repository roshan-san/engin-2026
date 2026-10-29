import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { attempt } from "~/shared/lib/errors";

/** Accepting and declining before the start. Failures are toasted and resolve `false`. */
export function useScreening() {
	const acceptApplication = useMutation(api.applications.accept);
	const declineApplication = useMutation(api.applications.decline);

	return {
		accept: (applicationId: Id<"applications">) =>
			attempt(() => acceptApplication({ applicationId })),
		decline: (applicationId: Id<"applications">) =>
			attempt(() => declineApplication({ applicationId })),
	};
}
