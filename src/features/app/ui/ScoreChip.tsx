import { Link } from "@tanstack/react-router";
import { cn } from "~/lib/utils";

type ScoreChipProps = {
	readonly score: number;
	readonly isPro: boolean;
};

export function ScoreChip({ score, isPro }: ScoreChipProps) {
	return (
		<Link
			to="/app/profile"
			aria-label={`Engin Score ${score}`}
			className={cn(
				"inline-flex h-8 items-center rounded-md px-2.5 text-sm font-medium tabular-nums",
				isPro
					? "pro-score-shine text-amber-100"
					: "border border-border bg-muted/40 text-foreground hover:bg-muted/70",
			)}
		>
			{score}
		</Link>
	);
}
