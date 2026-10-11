import { Button } from "~/components/ui/button";
import { cycleDates } from "../board/cycleDates";
import { ActivityEntry } from "./ActivityEntry";
import type { CycleView } from "./record";

/** Cycles newest first. `masked` shows only the count and milestones. */
export function ActivityFeed({
	cycles,
	hasMore,
	onShowEarlier,
	mode,
}: {
	readonly cycles: CycleView[];
	readonly hasMore: boolean;
	readonly onShowEarlier: () => void;
	readonly mode: "full" | "masked";
}) {
	return (
		<div className="flex flex-col gap-6">
			{cycles.map((cycle) => (
				<section key={cycle.week} className="flex flex-col gap-1">
					<header className="flex items-baseline gap-3 border-b border-border pb-2">
						<h3 className="min-w-0 flex-1 truncate text-sm">
							<span className="font-medium">Cycle {cycle.number}</span>
							{mode === "full" ? (
								<span className="text-muted-foreground">
									{" · "}
									{cycleDates(cycle.startsAt, cycle.endsAt)}
									{cycle.goal ? ` · ${cycle.goal}` : null}
								</span>
							) : null}
						</h3>
						<span className="shrink-0 text-sm text-muted-foreground tabular-nums">
							{cycle.shippedCount} shipped
						</span>
					</header>
					{cycle.entries.length > 0 ? (
						<ul className="-mx-2">
							{cycle.entries.map((entry) => (
								<ActivityEntry key={entry.id} entry={entry} />
							))}
						</ul>
					) : cycle.shippedCount === 0 ? (
						<p className="py-2 text-sm text-muted-foreground">
							Nothing verified
						</p>
					) : null}
				</section>
			))}
			{hasMore ? (
				<Button variant="ghost" className="self-start" onClick={onShowEarlier}>
					Show earlier
				</Button>
			) : null}
		</div>
	);
}
