import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { attempt } from "~/lib/errors";

/** Applying with an answer. Resolves `false` after toasting a failure. */
export function useApply(hackathonId: Id<"hackathons">) {
	const applyTo = useMutation(api.hiring.applications.apply);

	return async (answer: string) => {
		return attempt(() => applyTo({ hackathonId, answer }));
	};
}
