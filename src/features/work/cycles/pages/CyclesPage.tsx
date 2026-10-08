import { Page } from "~/components/shared/Page";
import { useState } from "react";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { PageHeader } from "~/components/shared/PageHeader";
import { RowList } from "~/components/shared/RowList";
import {
	matchesTeam,
	TeamFilter,
	type TeamFilterValue,
} from "~/features/teams/team/components/TeamFilter";
import { useTeams } from "~/features/teams/team/hooks/useTeams";
import { CreateCycleDialog } from "~/features/work/cycles/components/CreateCycleDialog";
import { CycleRow } from "~/features/work/cycles/components/CycleRow";
import { CYCLE_STATUS_GROUPS } from "~/features/work/cycles/constants";
import { useCycles } from "~/features/work/cycles/hooks/useCycles";
import { useStartupRoute } from "~/shell/startup/StartupRoute";

/** The Startup's Cycles the viewer belongs to: Active first, then Planned, then Closed. */
export function CyclesPage() {
	const { slug, member } = useStartupRoute();
	const startupId = member?.startup._id;
	const isFounder = member?.role === "founder";
	const { cycles } = useCycles(startupId);
	const { teams, teamNames } = useTeams(startupId);
	const [teamFilter, setTeamFilter] = useState<TeamFilterValue>("all");
	const ordered = cycles
		? CYCLE_STATUS_GROUPS.flatMap((group) =>
				cycles.filter(
					(cycle) =>
						cycle.status === group.status &&
						matchesTeam(cycle.teamId, teamFilter),
				),
			)
		: undefined;

	return (
		<>
			<PageHeader
				width="wide"
				title="Cycles"
				actions={
					<>
						<TeamFilter
							teams={teams}
							value={teamFilter}
							onChange={setTeamFilter}
						/>
						{isFounder ? (
							<CreateCycleDialog slug={slug} startupId={startupId} />
						) : null}
					</>
				}
			/>
			<Page className="space-y-4">
				{ordered === undefined ? (
					<PageLoading rows={3} />
				) : ordered.length === 0 ? (
					<EmptyState
						title="No Cycles yet"
						body={
							isFounder
								? "Plan a Cycle to give the team a board to work on."
								: "You'll see Cycles here once a Founder adds you to one."
						}
					/>
				) : (
					<RowList>
						{ordered.map((cycle) => (
							<CycleRow
								key={cycle._id}
								slug={slug}
								cycle={cycle}
								teamName={
									cycle.teamId ? teamNames.get(cycle.teamId) : undefined
								}
							/>
						))}
					</RowList>
				)}
			</Page>
		</>
	);
}
