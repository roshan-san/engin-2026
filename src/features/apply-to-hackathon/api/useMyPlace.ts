import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { attempt } from "~/shared/lib/errors";

/** Confirm your place, or withdraw. Failures are toasted and resolve `false`. */
export function useMyPlace(applicationId: Id<"applications">) {
	const confirmPlace = useMutation(api.applications.confirm);
	const withdrawApplication = useMutation(api.applications.withdraw);
	return {
		confirm: () => attempt(() => confirmPlace({ applicationId })),
		withdraw: () => attempt(() => withdrawApplication({ applicationId })),
	};
}
