import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

export type TeamPeople = FunctionReturnType<
	typeof api.startups.contributors.list
>;
export type TeamPerson = TeamPeople["contributors"][number];

/** The Founder and Contributors of the Startup, and removing a Contributor (Founder only). */
export function useTeamPeople(startupId: Id<"startups">) {
	const people = useQuery(api.startups.contributors.list, { startupId });
	const removeContributor = useMutation(api.startups.contributors.remove);

	/** Resolves `true` once removed; failures are toasted. */
	async function remove(userId: Id<"users">, name: string) {
		try {
			await removeContributor({ startupId, userId });
			toast.success(`${name} removed`);
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	}

	return { people, remove };
}
