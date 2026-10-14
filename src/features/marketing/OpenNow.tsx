import { Link } from "@tanstack/react-router";
import { RowList } from "~/components/RowList";
import { HackathonExploreRow } from "~/features/explore/HackathonExploreRow";
import { useExploreHackathons } from "~/features/explore/useExploreHackathons";

/** Up to three live Hackathons; nothing at all when none are open. */
export function OpenNow() {
	const hackathons = useExploreHackathons({});
	const open = hackathons?.filter((h) => h.status === "open").slice(0, 3) ?? [];
	if (open.length === 0) {
		return null;
	}

	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-baseline justify-between">
				<h2 className="text-xl font-semibold tracking-tight">Open now</h2>
				<Link
					to="/explore/hackathons"
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					See all →
				</Link>
			</div>
			<RowList>
				{open.map((h) => (
					<HackathonExploreRow key={h.hackathonId} hackathon={h} />
				))}
			</RowList>
		</section>
	);
}
