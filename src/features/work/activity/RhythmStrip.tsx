import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/shared/lib/cn";
import { type StripCell, stripLevel, stripTooltip } from "~/shared/lib/rating";

const SHADES = [
	"bg-foreground/[.06]",
	"bg-foreground/20",
	"bg-foreground/40",
	"bg-foreground/65",
	"bg-foreground/90",
];

/** 12 weeks of verified work, oldest first; this week is outlined. `fluid` fills its row. */
export function RhythmStrip({
	strip,
	size = "fixed",
}: {
	readonly strip: StripCell[];
	readonly size?: "fixed" | "fluid";
}) {
	return (
		<TooltipProvider>
			<ol
				className={cn(
					size === "fluid" ? "grid grid-cols-12 gap-1.5" : "flex gap-1",
				)}
				aria-label="Last 12 weeks"
			>
				{strip.map((cell, i) => {
					const level = stripLevel(cell.count);
					const label = stripTooltip(cell);
					return (
						<li key={cell.week}>
							<Tooltip>
								<TooltipTrigger asChild>
									<span
										role="img"
										aria-label={label}
										className={cn(
											"block rounded-[3px] transition-opacity hover:opacity-80",
											size === "fluid" ? "h-7 w-full" : "size-4",
											level === null
												? "border border-dashed border-border"
												: SHADES[level],
											i === strip.length - 1 &&
												"ring-1 ring-foreground/50 ring-offset-1 ring-offset-background",
										)}
									/>
								</TooltipTrigger>
								<TooltipContent>{label}</TooltipContent>
							</Tooltip>
						</li>
					);
				})}
			</ol>
		</TooltipProvider>
	);
}

/** "Less ▢▢▢▢▢ More": what the shades mean. */
export function StripLegend() {
	return (
		<span className="flex items-center gap-1" aria-hidden>
			Less
			{SHADES.map((shade) => (
				<span key={shade} className={cn("size-2.5 rounded-[2px]", shade)} />
			))}
			More
		</span>
	);
}
