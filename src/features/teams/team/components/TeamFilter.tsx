import type { Id } from "@convex/_generated/dataModel";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import type { TeamSummary } from "~/features/teams/team/hooks/useTeams";

export type TeamFilterValue = Id<"teams"> | "all";

/** Keeps rows whose Team matches; "all" keeps every row. */
export function matchesTeam(
	teamId: Id<"teams"> | undefined,
	filter: TeamFilterValue,
): boolean {
	return filter === "all" || teamId === filter;
}

type TeamFilterProps = {
	readonly teams: TeamSummary[] | undefined;
	readonly value: TeamFilterValue;
	readonly onChange: (value: TeamFilterValue) => void;
};

/** "All teams" or one Team. Hidden while the Startup has no Teams. */
export function TeamFilter({ teams, value, onChange }: TeamFilterProps) {
	if (!teams || teams.length === 0) {
		return null;
	}
	return (
		<Select
			value={value}
			onValueChange={(next) => onChange(next as TeamFilterValue)}
		>
			<SelectTrigger aria-label="Filter by Team" size="sm" className="w-40">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="all">All teams</SelectItem>
				{teams.map((team) => (
					<SelectItem key={team._id} value={team._id}>
						{team.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
