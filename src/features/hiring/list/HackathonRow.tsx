import { phaseOf } from "@convex/shared/hackathonPhase";
import { Link } from "@tanstack/react-router";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { roleLabel, termsLine } from "~/shared/config/jobs";
import { STAGE, stageDate } from "../stage";
import {
	type HiringRow,
	needsYou,
	promiseLine,
	rowNumber,
} from "./hiringGroups";

const ROW_CLASS =
	"grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 px-2 py-4 text-left transition-colors hover:bg-accent md:grid-cols-[minmax(0,1fr)_14rem_9rem] focus-ring";

/** One Hackathon: the job, its stage and date, and the number that matters now. */
export function HackathonRow({
	row,
	slug,
	isFounder,
}: {
	readonly row: HiringRow;
	readonly slug: string;
	readonly isFounder: boolean;
}) {
	const current = { ...row, status: phaseOf(row, Date.now()) };
	const stage = STAGE[current.status];
	const promises = row.status === "done" ? promiseLine(row) : null;
	const isWaiting = needsYou(current);
	const content = (
		<>
			<div className="min-w-0">
				<div className="truncate text-sm font-medium">
					{roleLabel(row.job.role)}
				</div>
				<div className="mt-0.5 truncate text-xs text-muted-foreground">
					{termsLine(row.job)} · {row.weeks === 1 ? "1 week" : "2 weeks"}
				</div>
			</div>
			<div className="col-span-2 row-start-2 flex min-w-0 items-center gap-2 md:col-span-1 md:row-start-auto">
				<Badge variant="status" tone={stage.tone}>
					{stage.label}
				</Badge>
				<span className="truncate text-xs text-muted-foreground">
					{stageDate(current)}
				</span>
			</div>
			<div className="col-start-2 row-start-1 flex flex-col items-end text-sm md:col-start-auto md:row-start-auto">
				<span
					className={cn(
						"flex items-center gap-1.5 tabular-nums",
						isWaiting ? "font-medium text-foreground" : "text-muted-foreground",
					)}
				>
					{isWaiting ? (
						<span aria-hidden className="size-1.5 rounded-full bg-warning" />
					) : null}
					{rowNumber(current)}
				</span>
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
