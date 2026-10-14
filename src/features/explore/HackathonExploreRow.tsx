import type { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { PlaceLogo } from "~/components/PlaceLogo";
import { dayLabel } from "~/features/hiring/hackathonDates";
import { jobLine } from "~/features/hiring/jobChips";
import { hiringLine } from "~/features/startups/public/hiringLine";
import { RatingBadge } from "~/features/work/activity/RatingBadge";

export type HackathonExploreRowData = FunctionReturnType<
	typeof api.hiring.hackathons.explore
>[number];

/** One Hackathon: the job, who's hiring, what Builders get, and when. */
export function HackathonExploreRow({
	hackathon,
}: {
	readonly hackathon: HackathonExploreRowData;
}) {
	const record = hiringLine(hackathon.hiringRecord);

	return (
		<li>
			<Link
				to="/hackathons/$id"
				params={{ id: hackathon.hackathonId }}
				className="flex flex-col gap-2 px-2 py-4 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
			>
				<div className="flex min-w-0 items-start gap-3">
					<PlaceLogo
						name={hackathon.startup.name}
						url={hackathon.startup.logoUrl}
						size="lg"
					/>
					<div className="flex min-w-0 flex-col gap-1">
						<p className="truncate font-medium">{jobLine(hackathon.job)}</p>
						<div className="flex min-w-0 items-center gap-2.5 text-sm">
							<span className="truncate">{hackathon.startup.name}</span>
							<RatingBadge
								size="sm"
								rating={hackathon.startup.rating}
								ratingChange={hackathon.startup.ratingChange}
								isProvisional={hackathon.startup.isProvisional}
							/>
						</div>
						{hackathon.buildersGet ? (
							<p className="truncate text-sm text-muted-foreground">
								Builders get {hackathon.buildersGet}
							</p>
						) : null}
						{record ? (
							<p className="truncate text-xs text-muted-foreground">{record}</p>
						) : null}
					</div>
				</div>
				<span className="shrink-0 text-sm text-muted-foreground">
					{hackathon.status === "open"
						? `Starts ${dayLabel(hackathon.startsAt)}`
						: "Building"}
				</span>
			</Link>
		</li>
	);
}
