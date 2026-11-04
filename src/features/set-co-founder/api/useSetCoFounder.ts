import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import type { TeamPerson } from "~/entities/contributor";
import { displayName } from "~/shared/lib/displayName";
import { attempt } from "~/shared/lib/errors";

/** The Founder makes a Contributor a Co-founder, or back. Resolves `true` once done; failures are toasted. */
export function useSetCoFounder(startupId: Id<"startups">) {
	const setCoFounder = useMutation(api.contributors.setCoFounder);

	return async function set(person: TeamPerson, isFounder: boolean) {
		return attempt(async () => {
			await setCoFounder({ startupId, userId: person._id, isFounder });
			toast.success(
				`${displayName(person)} is ${isFounder ? "a Co-founder" : "a Contributor"}`,
			);
		});
	};
}
