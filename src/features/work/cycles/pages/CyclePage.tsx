import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { PageHeader } from "~/components/shared/PageHeader";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { TeamChip } from "~/features/teams/team/components/TeamChip";
import { TeamPicker } from "~/features/teams/team/components/TeamPicker";
import { useTeams } from "~/features/teams/team/hooks/useTeams";
import { CloseCycleDialog } from "~/features/work/cycles/components/CloseCycleDialog";
import { CycleBoard } from "~/features/work/cycles/components/CycleBoard";
import { CycleMembers } from "~/features/work/cycles/components/CycleMembers";
import { cycleStatusLabel } from "~/features/work/cycles/constants";
import { useCycle } from "~/features/work/cycles/hooks/useCycle";
import { formatDateRange } from "~/lib/dates";
import { useCrumb } from "~/shell/crumbs/CrumbProvider";

type CyclePageProps = {
	readonly slug: string;
	readonly cycleId: Id<"cycles">;
};

/** One Cycle: its lifecycle, its Members and its board. */
export function CyclePage({ slug, cycleId }: CyclePageProps) {
	const { view, pending, start, close, setMember, setTeam } = useCycle(cycleId);
	const { teams, teamNames } = useTeams(view?.cycle.startupId);
	useCrumb(view?.cycle.title, `/s/${slug}/cycles/${cycleId}`);

	const back = (
		<Link
			to="/s/$slug/cycles"
			params={{ slug }}
			className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft className="size-4" />
			Cycles
		</Link>
	);

	if (view === undefined) {
		return (
			<div className="w-full space-y-4">
				{back}
				<PageLoading rows={4} />
			</div>
		);
	}
	if (view === null) {
		return (
			<div className="mx-auto w-full max-w-3xl space-y-4">
				{back}
				<EmptyState
					title="You are not part of this Cycle"
					body="Ask a Founder to add you to it."
				/>
			</div>
		);
	}

	const { cycle, isFounder, members, plannedCycles } = view;
	const isClosed = cycle.status === "closed";

	return (
		<div className="w-full space-y-6">
			<div className="space-y-3">
				{back}
				<PageHeader
					title={cycle.title}
					meta={
						<div className="space-y-1">
							{cycle.goal ? (
								<p className="text-foreground break-words">{cycle.goal}</p>
							) : null}
							<p className="flex flex-wrap items-center gap-2">
								<Badge
									variant={cycle.status === "active" ? "default" : "outline"}
								>
									{cycleStatusLabel(cycle.status)}
								</Badge>
								<span>{formatDateRange(cycle.startAt, cycle.endAt)}</span>
								{isFounder && cycle.kind === "team" ? (
									<TeamPicker
										aria-label="Cycle Team"
										teams={teams}
										value={cycle.teamId ?? null}
										disabled={pending === "team"}
										onChange={(teamId) => void setTeam(teamId)}
										className="h-8 w-36"
									/>
								) : cycle.teamId && teamNames.get(cycle.teamId) ? (
									<TeamChip name={teamNames.get(cycle.teamId) ?? ""} />
								) : null}
							</p>
						</div>
					}
					actions={
						isFounder && cycle.status === "planned" ? (
							<Button
								size="sm"
								disabled={pending === "start"}
								onClick={() => void start()}
							>
								Start Cycle
							</Button>
						) : isFounder && cycle.status === "active" ? (
							<CloseCycleDialog
								title={cycle.title}
								plannedCycles={plannedCycles}
								isPending={pending === "close"}
								onClose={close}
							/>
						) : null
					}
				/>
				<CycleMembers
					startupId={cycle.startupId}
					members={members}
					canManage={isFounder && !isClosed}
					isPending={pending === "members"}
					onChange={(userId, isMember) => void setMember(userId, isMember)}
				/>
				{isClosed ? (
					<p className="text-sm text-muted-foreground">
						This Cycle is closed, so its board is read-only.
					</p>
				) : null}
			</div>

			<CycleBoard
				startupId={cycle.startupId}
				cycleId={cycle._id}
				isFounder={isFounder}
				isReadOnly={isClosed}
				lane={{ mode: "team" }}
			/>
		</div>
	);
}
