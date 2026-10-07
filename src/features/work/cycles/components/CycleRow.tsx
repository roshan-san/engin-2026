import type { Doc } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cycleUrgency } from "~/features/work/cycles/constants";
import { formatDateRange } from "~/lib/dates";

type CycleRowProps = {
	readonly slug: string;
	readonly cycle: Doc<"cycles">;
};

export function CycleRow({ slug, cycle }: CycleRowProps) {
	const urgency = cycleUrgency(cycle.endAt, cycle.status);

	return (
		<li>
			<Link
				to="/s/$slug/cycles/$cycleId"
				params={{ slug, cycleId: cycle._id }}
				className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
			>
				<div className="min-w-0 flex-1">
					<p className="truncate font-medium">{cycle.title}</p>
					{cycle.goal ? (
						<p className="text-sm break-words">{cycle.goal}</p>
					) : null}
					<p className="text-sm text-muted-foreground">
						{formatDateRange(cycle.startAt, cycle.endAt)}
					</p>
				</div>
				{urgency === "overdue" ? (
					<Badge variant="destructive">Overdue</Badge>
				) : urgency === "ending_soon" ? (
					<Badge variant="secondary">Ending soon</Badge>
				) : null}
				<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
			</Link>
		</li>
	);
}
