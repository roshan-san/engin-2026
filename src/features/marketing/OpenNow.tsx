import { Link } from "@tanstack/react-router";
import { HackathonExploreRow, useExploreHackathons } from "~/features/explore";
import { RowList } from "~/shared/ui/RowList";
import { Skeleton } from "~/shared/ui/skeleton";

const SKELETON_ROWS = ["a", "b", "c"] as const;

/** Holds the space of a Hackathon row while the list loads, so Pricing doesn't jump. */
function OpenNowSkeleton() {
	return SKELETON_ROWS.map((key) => (
		<li key={key} className="flex items-start gap-3 px-2 py-4" aria-hidden>
			<Skeleton className="size-10 shrink-0" />
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<Skeleton className="h-6 w-2/3" />
				<Skeleton className="h-[22px] w-1/3" />
				<Skeleton className="h-[22px] w-1/2" />
			</div>
		</li>
	));
}

/** Up to three live Hackathons; nothing at all once loaded and none are open. */
export function OpenNow() {
	const { hackathons } = useExploreHackathons({});
	const open = hackathons?.filter((h) => h.status === "open").slice(0, 3) ?? [];
	if (hackathons && open.length === 0) {
		return null;
	}

	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-baseline justify-between">
				<h2 className="text-2xl font-semibold">Open now</h2>
				<Link
					to="/explore/hackathons"
					className="rounded-sm text-sm text-muted-foreground hover:text-foreground focus-ring"
				>
					See all →
				</Link>
			</div>
			<RowList>
				{hackathons ? (
					open.map((h) => (
						<HackathonExploreRow key={h.hackathonId} hackathon={h} />
					))
				) : (
					<OpenNowSkeleton />
				)}
			</RowList>
		</section>
	);
}
