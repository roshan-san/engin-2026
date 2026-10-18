import type { ReactNode } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { dateRange } from "~/lib/dates";
import { ActivityEntry } from "./ActivityEntry";
import { buildFeed, type CycleView, quietLabel } from "./record";

/** Cycles newest first. `masked` shows only the count and milestones. */
export function ActivityFeed({
	cycles,
	hasMore,
	onShowEarlier,
	isLoadingEarlier = false,
	mode,
	emptyHint,
	selectedId,
	onSelect,
}: {
	readonly cycles: CycleView[];
	readonly hasMore: boolean;
	readonly onShowEarlier: () => void;
	readonly isLoadingEarlier?: boolean;
	readonly mode: "full" | "masked";
	/** Under this week's Cycle while nothing is in it. */
	readonly emptyHint?: ReactNode;
	/** Opens a verified Card's proof in a side panel instead of in place. */
	readonly onSelect?: (entryId: string) => void;
	readonly selectedId?: string;
}) {
	const items = buildFeed(cycles, Date.now());

	return (
		<div className="flex flex-col gap-8">
			{items.map((item) => {
				if (item.kind === "quiet") {
					const { name, dates } = quietLabel(item);
					return (
						<p
							key={item.newest.week}
							className="flex items-baseline gap-1.5 border-b border-dashed border-border pb-2 text-sm text-muted-foreground"
						>
							<span>{name}</span>
							{mode === "full" ? (
								<>
									<span aria-hidden>·</span>
									<span>{dates}</span>
								</>
							) : null}
							<span className="ml-auto">Nothing verified</span>
						</p>
					);
				}

				const { cycle, isCurrent } = item;
				const isEmpty = cycle.entries.length === 0 && cycle.shippedCount === 0;
				return (
					<section key={cycle.week} className="flex flex-col gap-2">
						<header className="flex flex-col gap-1 border-b border-border pb-2">
							<div className="flex items-center gap-2">
								<h3 className="text-sm font-medium">Cycle {cycle.number}</h3>
								{mode === "full" ? (
									<span className="text-sm text-muted-foreground">
										{dateRange(cycle.startsAt, cycle.endsAt)}
									</span>
								) : null}
								{isCurrent ? (
									<Badge variant="status" tone="success">
										This week
									</Badge>
								) : null}
								<span className="ml-auto shrink-0 text-sm text-muted-foreground tabular-nums">
									<span className="font-medium text-foreground">
										{cycle.shippedCount}
									</span>{" "}
									shipped
								</span>
							</div>
							{cycle.goal ? (
								<p className="text-sm break-words text-muted-foreground">
									Goal · <span className="text-foreground">{cycle.goal}</span>
								</p>
							) : null}
						</header>
						{cycle.entries.length > 0 ? (
							<ul className="-mx-2">
								{cycle.entries.map((entry) => (
									<ActivityEntry
										key={entry.id}
										entry={entry}
										isSelected={entry.id === selectedId}
										onSelect={onSelect}
									/>
								))}
							</ul>
						) : isEmpty ? (
							<div className="py-1 text-sm text-muted-foreground">
								<p>{isCurrent ? "Nothing verified yet" : "Nothing verified"}</p>
								{isCurrent && emptyHint ? (
									<div className="mt-1 text-xs">{emptyHint}</div>
								) : null}
							</div>
						) : null}
					</section>
				);
			})}
			{hasMore ? (
				<Button
					variant="ghost"
					className="self-start"
					disabled={isLoadingEarlier}
					onClick={onShowEarlier}
				>
					{isLoadingEarlier ? <Spinner /> : null}
					Show earlier
				</Button>
			) : null}
		</div>
	);
}
