import { PanelHeader } from "~/components/shared/PanelHeader";
import { Skeleton } from "~/components/ui/skeleton";
import { RecordSignals } from "./RecordSignals";
import type { SignalsView } from "./record";

/** The side panel while no entry is open: the Rating, the rhythm and who sees what. */
export function RecordPanel({
	signals,
}: {
	readonly signals: SignalsView | null | undefined;
}) {
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<PanelHeader>
				<h2 className="text-sm font-medium">Record</h2>
			</PanelHeader>
			<div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-4">
				{signals ? (
					<RecordSignals signals={signals} layout="stack" />
				) : (
					<div className="flex flex-col gap-3">
						<Skeleton className="h-10 w-28" />
						<Skeleton className="h-4 w-44" />
						<Skeleton className="mt-6 h-7 w-full" />
					</div>
				)}
				<section className="flex flex-col gap-2 border-t border-border pt-6">
					<h2 className="text-xs leading-5 font-semibold text-muted-foreground">
						Who sees what
					</h2>
					<p className="text-xs leading-5 text-muted-foreground">
						Anyone sees the Rating, rhythm, how many shipped each Cycle,
						Hackathons and Hires. Card titles, what shipped and proof stay with
						the team and Investor Pro.
					</p>
				</section>
			</div>
		</div>
	);
}
