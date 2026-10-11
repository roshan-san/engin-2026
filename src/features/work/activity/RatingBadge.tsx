import { Badge } from "~/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { ratingChangeLabel } from "./record";

/** "1184 ▲ 12": the Rating, its last move, and Provisional while it settles. */
export function RatingBadge({
	rating,
	ratingChange,
	isProvisional,
	size = "lg",
}: {
	readonly rating: number;
	readonly ratingChange: number;
	readonly isProvisional: boolean;
	/** `sm` sits inside a card or a row; `lg` heads a page. */
	readonly size?: "sm" | "lg";
}) {
	const change = ratingChangeLabel(ratingChange);

	return (
		<div className="flex items-center gap-2.5">
			<span
				className={cn(
					"font-semibold tracking-tight tabular-nums",
					size === "lg" ? "text-4xl" : "text-xl",
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
								tabIndex={0}
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
