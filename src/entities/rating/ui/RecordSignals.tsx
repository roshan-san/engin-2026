import { cn } from "~/shared/lib/cn";
import { RatingBadge } from "~/shared/ui/RatingBadge";
import { RatingParts } from "~/shared/ui/RatingParts";
import { RhythmStrip, StripLegend } from "~/shared/ui/RhythmStrip";
import type { SignalsView } from "../api/useSignals";

const LABEL = "text-xs leading-5 font-semibold text-muted-foreground";

/**
 * The Rating and its parts, then the 12-week rhythm strip. `row` sets them
 * side by side; `stack` puts one above the other for a side panel.
 */
export function RecordSignals({
	signals,
	layout = "row",
}: {
	readonly signals: SignalsView;
	readonly layout?: "row" | "stack";
}) {
	const isStack = layout === "stack";

	return (
		<section
			className={cn(
				"grid gap-x-12 gap-y-8",
				!isStack && "sm:grid-cols-[minmax(0,auto)_minmax(0,1fr)]",
			)}
		>
			<div className="flex flex-col gap-2">
				<h2 className={LABEL}>Rating</h2>
				<RatingBadge
					rating={signals.rating}
					ratingChange={signals.ratingChange}
					isProvisional={signals.isProvisional}
				/>
				<RatingParts parts={signals.parts} />
			</div>
			<div className="flex flex-col gap-2">
				<div className="flex h-5 items-center justify-between gap-3">
					<h2 className={LABEL}>Rhythm</h2>
					<span className="text-sm text-muted-foreground tabular-nums">
						<span className="font-medium text-foreground">
							{signals.verifiedTotal12}
						</span>{" "}
						verified in 12 weeks
					</span>
				</div>
				<RhythmStrip strip={signals.strip} size="fluid" />
				<div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
					<span>12 weeks ago</span>
					{isStack ? null : <StripLegend />}
					<span>This week</span>
				</div>
				{isStack ? (
					<div className="text-xs text-muted-foreground">
						<StripLegend />
					</div>
				) : null}
			</div>
		</section>
	);
}
