import { Link } from "@tanstack/react-router";
import { formatDateRange } from "~/lib/dates";
import { jobLine } from "../jobChips";
import { type HiringRow, promiseLine, rowNumber } from "./hiringGroups";

const ROW_CLASS =
	"flex w-full items-center gap-3 px-2 py-3 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60";

/** One Hackathon: the job, its dates and the number that matters now. */
export function HackathonRow({
	row,
	slug,
	isFounder,
}: {
	readonly row: HiringRow;
	readonly slug: string;
	readonly isFounder: boolean;
}) {
	const promises = row.status === "done" ? promiseLine(row) : null;
	const content = (
		<>
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-medium">{jobLine(row.job)}</div>
				<div className="mt-0.5 truncate text-xs text-muted-foreground">
					{formatDateRange(row.startsAt, row.endsAt - 1)}
				</div>
			</div>
			<div className="flex shrink-0 flex-col items-end text-sm">
				<span className="text-muted-foreground">{rowNumber(row)}</span>
				{promises ? (
					<span className="text-xs text-subtle-foreground">{promises}</span>
				) : null}
			</div>
		</>
	);

	return (
		<li>
			{isFounder ? (
				<Link
					to="/s/$slug/hiring/$id"
					params={{ slug, id: row._id }}
					className={ROW_CLASS}
				>
					{content}
				</Link>
			) : (
				<Link
					to="/hackathons/$id"
					params={{ id: row._id }}
					className={ROW_CLASS}
				>
					{content}
				</Link>
			)}
		</li>
	);
}
