import { PanelBody } from "~/shared/ui/PanelBody";
import { PanelHeader } from "~/shared/ui/PanelHeader";
import { Section } from "~/shared/ui/Section";
import { Skeleton } from "~/shared/ui/skeleton";
import { RecordSignals } from "./RecordSignals";
import type { SignalsView } from "./useSignals";

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
			<PanelBody>
				{signals ? (
					<RecordSignals signals={signals} layout="stack" />
				) : (
					<div className="flex flex-col gap-3">
						<Skeleton className="h-10 w-28" />
						<Skeleton className="h-4 w-44" />
						<Skeleton className="mt-6 h-7 w-full" />
					</div>
				)}
				<Section label="Who sees what">
					<p className="text-xs leading-5 text-muted-foreground">
						Anyone sees the Rating, rhythm, how many shipped each Cycle,
						Hackathons and Hires. Card titles, What shipped, links and images
						stay with the team and Investor Pro.
					</p>
				</Section>
			</PanelBody>
		</div>
	);
}
