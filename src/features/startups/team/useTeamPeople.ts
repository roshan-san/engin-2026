import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { toast } from "sonner";
import { displayName } from "~/shared/lib/displayName";
import { attempt } from "~/shared/lib/errors";

export type TeamPeople = FunctionReturnType<
	typeof api.startups.contributors.list
>;
export type TeamPerson = TeamPeople["contributors"][number];

/** The Founder and Contributors of the Startup, and removing a Contributor (Founder only). */
export function useTeamPeople(startupId: Id<"startups">) {
	const people = useQuery(api.startups.contributors.list, { startupId });
	const removeContributor = useMutation(api.startups.contributors.remove);

	/** Resolves `true` once removed; failures are toasted. */
	async function remove(person: TeamPerson) {
		return attempt(async () => {
			await removeContributor({ startupId, userId: person._id });
			toast.success(`${displayName(person)} removed`);
		});
	}

	return { people, remove };
}
