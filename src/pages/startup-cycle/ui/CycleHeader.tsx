import { useCycle } from "~/entities/cycle";
import { useWorkspace } from "~/entities/startup";
import { dateRange } from "~/shared/lib/dates";
import { Skeleton } from "~/shared/ui/skeleton";

/** "Cycle 3 · Oct 12 – 18". */
export function CycleHeader() {
	const { startup } = useWorkspace();
	const cycle = useCycle(startup._id);

	if (!cycle) {
		return (
			<div className="flex min-w-0 flex-1 items-center">
				<Skeleton className="h-4 w-16" />
			</div>
		);
	}

	return (
		<div className="flex min-w-0 flex-1 items-center gap-3">
			<span className="shrink-0 text-sm text-muted-foreground">
				Cycle {cycle.number}
				<span className="hidden sm:inline">
					{" · "}
					{dateRange(cycle.startsAt, cycle.endsAt)}
				</span>
			</span>
		</div>
	);
}
