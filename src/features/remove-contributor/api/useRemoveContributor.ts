import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import type { TeamPerson } from "~/entities/contributor";
import { displayName } from "~/shared/lib/displayName";
import { attempt } from "~/shared/lib/errors";

/** The Founder removes a Contributor. Resolves `true` once removed; failures are toasted. */
export function useRemoveContributor(startupId: Id<"startups">) {
	const removeContributor = useMutation(api.startups.contributors.remove);

	return async function remove(person: TeamPerson) {
		return attempt(async () => {
			await removeContributor({ startupId, userId: person._id });
			toast.success(`${displayName(person)} removed`);
		});
	};
}
