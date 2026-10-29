import type { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { hiringLine } from "~/entities/startup";
import { jobLine } from "~/shared/config/jobs";
import { dayLabel } from "~/shared/lib/dates";
import { PlaceLogo } from "~/shared/ui/PlaceLogo";
import { RatingBadge } from "~/shared/ui/RatingBadge";

export type HackathonExploreRowData = FunctionReturnType<
	typeof api.hackathons.explore
>[number];

/** One Hackathon: the job, who's hiring, what Participants get, and when. */
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
				className="flex flex-col gap-2 px-2 py-4 transition-colors hover:bg-accent sm:flex-row focus-ring sm:items-start sm:justify-between sm:gap-6"
			>
				<div className="flex min-w-0 items-start gap-3">
					<PlaceLogo
						name={hackathon.startup.name}
						url={hackathon.startup.logoUrl}
						size={40}
					/>
					<div className="flex min-w-0 flex-col gap-1">
						<p className="truncate font-medium">{jobLine(hackathon.job)}</p>
						<div className="flex min-w-0 items-center gap-2.5 text-sm">
							<span className="truncate">{hackathon.startup.name}</span>
							<RatingBadge
								size="sm"
								inLink
								rating={hackathon.startup.rating}
								ratingChange={hackathon.startup.ratingChange}
								isProvisional={hackathon.startup.isProvisional}
							/>
						</div>
						{hackathon.participantsGet ? (
							<p className="truncate text-sm text-muted-foreground">
								Participants get {hackathon.participantsGet}
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
						: "Live"}
				</span>
			</Link>
		</li>
	);
}
