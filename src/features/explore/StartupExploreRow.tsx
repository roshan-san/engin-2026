import type { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import type { FunctionReturnType } from "convex/server";
import { PlaceLogo } from "~/components/PlaceLogo";
import { Badge } from "~/components/ui/badge";
import { CITIES, KINDS, STAGES } from "~/features/startups/startupChips";
import { RatingBadge } from "~/features/work/activity/RatingBadge";
import { RhythmStrip } from "~/features/work/activity/RhythmStrip";

export type StartupExploreRowData = FunctionReturnType<
	typeof api.startups.startups.explore
>[number];

function labelOf(
	chips: readonly { readonly value: string; readonly label: string }[],
	value: string,
) {
	return chips.find((chip) => chip.value === value)?.label ?? value;
}

/** "Building · SaaS · Bengaluru" */
function chipsLine(startup: StartupExploreRowData): string {
	return [
		labelOf(STAGES, startup.stage),
		labelOf(KINDS, startup.category),
		labelOf(CITIES, startup.city),
	].join(" · ");
}

/** One Startup: who it is, its Rating and its last 12 weeks. */
export function StartupExploreRow({
	startup,
}: {
	readonly startup: StartupExploreRowData;
}) {
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
									Hiring
								</Badge>
							) : null}
						</div>
						{startup.oneLiner ? (
							<span className="truncate text-sm text-muted-foreground">
								{startup.oneLiner}
							</span>
						) : null}
						<span className="truncate text-xs text-muted-foreground">
							{chipsLine(startup)}
						</span>
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
