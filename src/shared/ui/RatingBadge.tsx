import { cn } from "~/shared/lib/cn";
import { ratingChangeLabel } from "~/shared/lib/rating";
import { tierText } from "~/shared/lib/tierText";
import { Badge } from "./badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./tooltip";

/** "1184 ▲ 12": the Rating in its Tier colour, its last move, and Provisional while it settles. */
export function RatingBadge({
	rating,
	ratingChange,
	isProvisional,
	size = "lg",
	inLink = false,
}: {
	readonly rating: number;
	readonly ratingChange: number;
	readonly isProvisional: boolean;
	/** `sm` sits inside a card or a row; `lg` heads a page. */
	readonly size?: "sm" | "lg";
	/** Inside a link the Provisional badge must not take its own tab stop. */
	readonly inLink?: boolean;
}) {
	const change = ratingChangeLabel(ratingChange);

	return (
		<div className="flex items-center gap-2.5">
			<span
				className={cn(
					"font-semibold tabular-nums",
					tierText(rating),
					size === "lg" ? "text-3xl" : "text-lg",
				)}
			>
				{rating}
			</span>
			{change.text ? (
				<span
					className={cn(
						"text-sm font-medium tabular-nums",
						change.direction === "up"
							? "text-success"
							: "text-muted-foreground",
					)}
				>
					{change.text}
					<span className="sr-only"> this week</span>
				</span>
			) : null}
			{isProvisional ? (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Badge
								variant="outline"
								tabIndex={inLink ? undefined : 0}
								className="cursor-help text-muted-foreground"
							>
								Provisional
							</Badge>
						</TooltipTrigger>
						<TooltipContent className="max-w-56">
							Still settling. It firms up as more weeks are rated.
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			) : null}
		</div>
	);
}
