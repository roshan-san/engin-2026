import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useMemo } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

export type TeamSummary = { _id: Id<"teams">; name: string };

/** The Startup's Teams by name, with lookups for chips and filters. */
export function useTeams(startupId: Id<"startups"> | undefined) {
	const teams = useQuery(
		api.teams.teams.list,
		startupId ? { startupId } : "skip",
	);

	return useMemo(() => {
		const teamNames = new Map<Id<"teams">, string>(
			(teams ?? []).map((team) => [team._id, team.name]),
		);
		function teamsOf(userId: Id<"users">): TeamSummary[] {
			return (teams ?? []).filter((team) =>
				team.members.some((member) => member._id === userId),
			);
		}
		return { teams, teamNames, teamsOf };
	}, [teams]);
}

/** Founder actions on Teams; each resolves true when it worked. */
export function useTeamMutations(startupId: Id<"startups"> | undefined) {
	const createTeam = useMutation(api.teams.teams.create);
	const updateTeam = useMutation(api.teams.teams.update);
	const removeTeam = useMutation(api.teams.teams.remove);
	const addTeamMember = useMutation(api.teams.teams.addMember);
	const removeTeamMember = useMutation(api.teams.teams.removeMember);

	async function attempt(run: () => Promise<unknown>, failure: string) {
		try {
			await run();
			return true;
		} catch (error) {
			toast.error(toErrorMessage(error, failure));
			return false;
		}
	}

	return {
		create: (input: { name: string; description?: string }) =>
			startupId
				? attempt(
						() => createTeam({ startupId, ...input }),
						"Could not create the Team",
					)
				: Promise.resolve(false),
		update: (
			teamId: Id<"teams">,
			input: { name: string; description?: string },
		) =>
			attempt(
				() => updateTeam({ teamId, ...input }),
				"Could not save the Team",
			),
		remove: (teamId: Id<"teams">) =>
			attempt(() => removeTeam({ teamId }), "Could not delete the Team"),
		setMember: (teamId: Id<"teams">, userId: Id<"users">, on: boolean) =>
			attempt(
				() =>
					on
						? addTeamMember({ teamId, userId })
						: removeTeamMember({ teamId, userId }),
				"Could not update the Team",
			),
	};
}
