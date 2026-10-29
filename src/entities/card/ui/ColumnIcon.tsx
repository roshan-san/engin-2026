import { cn } from "~/shared/lib/cn";
import type { Column } from "../model/dropRules";

/** How far along each column is, drawn as a filled slice of the circle. */
const PROGRESS: Record<Exclude<Column, "done">, number> = {
	todo: 0,
	in_progress: 0.5,
	review: 0.75,
};

const COLOR: Record<Column, string> = {
	todo: "text-muted-foreground",
	in_progress: "text-link",
	review: "text-chart-4",
	done: "text-success",
};

/** The column's glyph: an empty, half, three-quarter or ticked circle. */
export function ColumnIcon({
	column,
	className,
}: {
	readonly column: Column;
	readonly className?: string;
}) {
	const classes = cn("size-3.5 shrink-0", COLOR[column], className);

	if (column === "done") {
		return (
			<svg viewBox="0 0 14 14" aria-hidden className={classes}>
				<circle cx="7" cy="7" r="6.5" fill="currentColor" />
				<path
					d="M4.25 7.25 6.1 9l3.65-3.75"
					fill="none"
					stroke="var(--background)"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		);
	}

	// A circle of radius 2.5 stroked 5 wide fills a pie; the dash sets how much.
	const pie = 2 * Math.PI * 2.5;
	const progress = PROGRESS[column];

	return (
		<svg viewBox="0 0 14 14" aria-hidden className={classes}>
			<circle
				cx="7"
				cy="7"
				r="6"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			{progress > 0 ? (
				<circle
					cx="7"
					cy="7"
					r="2.5"
					fill="none"
					stroke="currentColor"
					strokeWidth="5"
					strokeDasharray={`${pie * progress} ${pie}`}
					transform="rotate(-90 7 7)"
				/>
			) : null}
		</svg>
	);
}
