import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { type StripCell, stripLevel, stripTooltip } from "./record";

const SHADES = [
	"bg-foreground/[.06]",
	"bg-foreground/20",
	"bg-foreground/40",
	"bg-foreground/65",
	"bg-foreground/90",
];

/** 12 weeks of verified work, oldest first; this week is outlined. */
export function RhythmStrip({ strip }: { readonly strip: StripCell[] }) {
	return (
		<TooltipProvider>
			<ol className="flex gap-1" aria-label="Last 12 weeks">
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
											"block size-4 rounded-[3px]",
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
