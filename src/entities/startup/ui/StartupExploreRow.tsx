import type { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { Badge } from "~/shared/ui/badge";
import { PlaceLogo } from "~/shared/ui/PlaceLogo";
import { RatingBadge } from "~/shared/ui/RatingBadge";
import { RhythmStrip } from "~/shared/ui/RhythmStrip";
import { startupChipLabels } from "../config/startupChips";

export type StartupExploreRowData = FunctionReturnType<
	typeof api.startups.explore
>[number];

/** One Startup: who it is, its Rating and its last 12 weeks. */
export function StartupExploreRow({
	startup,
}: {
	readonly startup: StartupExploreRowData;
}) {
	// "Building · SaaS · Bengaluru"
	const chips = startupChipLabels(startup).join(" · ");

	return (
		<li>
			<Link
				to="/startups/$slug"
				params={{ slug: startup.slug }}
				className="flex flex-col gap-3 px-2 py-4 transition-colors hover:bg-accent sm:flex-row focus-ring sm:items-center sm:gap-6"
			>
				<div className="flex min-w-0 flex-1 items-center gap-3">
					<PlaceLogo name={startup.name} url={startup.logoUrl} size={40} />
					<div className="flex min-w-0 flex-col">
						<div className="flex min-w-0 items-center gap-2">
							<span className="truncate font-medium">{startup.name}</span>
							{startup.isHiring ? (
								<Badge variant="status" tone="link">
									Open Hackathon
								</Badge>
							) : null}
						</div>
						{startup.oneLiner ? (
							<span className="truncate text-sm text-muted-foreground">
								{startup.oneLiner}
							</span>
						) : null}
						{chips ? (
							<span className="truncate text-xs text-muted-foreground">
								{chips}
							</span>
						) : null}
					</div>
				</div>
				<div className="flex shrink-0 items-center justify-between gap-6 sm:justify-end">
					<RatingBadge
						size="sm"
						inLink
						rating={startup.rating}
						ratingChange={startup.ratingChange}
						isProvisional={startup.isProvisional}
					/>
					<RhythmStrip strip={startup.strip} size="fixed" />
				</div>
			</Link>
		</li>
	);
}
