import { cn } from "~/lib/utils";
import { ratingChangeLabel } from "./record";

/** "1184 ▲ 12": the Rating, its last move, and Provisional while it settles. */
export function RatingBadge({
	rating,
	ratingChange,
	isProvisional,
}: {
	readonly rating: number;
	readonly ratingChange: number;
	readonly isProvisional: boolean;
}) {
	const change = ratingChangeLabel(ratingChange);

	return (
		<div className="flex items-baseline gap-2">
			<span className="text-3xl font-semibold tracking-tight tabular-nums">
				{rating}
			</span>
			{change.text ? (
				<span
					className={cn(
						"text-sm tabular-nums",
						change.direction === "up"
							? "text-foreground/70"
							: "text-muted-foreground",
					)}
				>
					{change.text}
				</span>
			) : null}
			{isProvisional ? (
				<span className="text-xs text-muted-foreground">Provisional</span>
			) : null}
		</div>
	);
}
