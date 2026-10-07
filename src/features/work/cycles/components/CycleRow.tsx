import type { Doc } from "@convex/_generated/dataModel";
import { Row } from "~/components/shared/RowList";
import { Badge } from "~/components/ui/badge";
import { TeamChip } from "~/features/teams/team/components/TeamChip";
import { cycleUrgency } from "~/features/work/cycles/constants";
import { useCycleProgress } from "~/features/work/cycles/hooks/useCycleTasks";
import { formatDateRange } from "~/lib/dates";
import { cn } from "~/lib/utils";

type CycleRowProps = {
	readonly slug: string;
	readonly cycle: Doc<"cycles">;
	readonly teamName?: string;
};

const RING_CLASS: Record<Doc<"cycles">["status"], string> = {
	active: "border-primary",
	planned: "border-dashed border-muted-foreground",
	closed: "border-muted-foreground",
};

const RING_LABEL: Record<Doc<"cycles">["status"], string> = {
	active: "Active",
	planned: "Not started",
	closed: "Closed",
};

/**
 * One Cycle in the list: status ring, title and dates. Only an active Cycle
 * shows Done/total and a progress bar, so the list opens one board
 * subscription per active Cycle rather than one per row.
 */
export function CycleRow({ slug, cycle, teamName }: CycleRowProps) {
	const urgency = cycleUrgency(cycle.endAt, cycle.status);
	const progress = useCycleProgress(cycle._id, cycle.status === "active");
	const percent =
		progress && progress.total > 0
			? Math.round((progress.done / progress.total) * 100)
			: 0;
	const showsProgress = cycle.status === "active";

	return (
		<Row
			to="/s/$slug/cycles/$cycleId"
			params={{ slug, cycleId: cycle._id }}
			leading={
				<span
					role="img"
					aria-label={RING_LABEL[cycle.status]}
					className={cn(
						"block size-4 rounded-full border-2",
						RING_CLASS[cycle.status],
					)}
				/>
			}
			title={cycle.title}
			meta={
				<>
					{formatDateRange(cycle.startAt, cycle.endAt)}
					{progress ? (
						<span className="tabular-nums">
							{" · "}
							{progress.done}/{progress.total} done
						</span>
					) : null}
				</>
			}
			trailing={
				<div className="flex items-center gap-3">
					{teamName ? <TeamChip name={teamName} /> : null}
					{urgency === "overdue" ? (
						<Badge variant="destructive">Overdue</Badge>
					) : urgency === "ending_soon" ? (
						<Badge variant="secondary">Ending soon</Badge>
					) : null}
					{showsProgress ? (
						<div aria-hidden className="h-1 w-16 rounded-full bg-muted sm:w-24">
							<div
								className="h-full rounded-full bg-primary"
								style={{ width: `${percent}%` }}
							/>
						</div>
					) : null}
				</div>
			}
		/>
	);
}
