import { getRouteApi } from "@tanstack/react-router";
import { EmptyState } from "~/components/EmptyState";
import { RowList } from "~/components/RowList";
import { ROLES } from "~/features/hiring/jobChips";
import { ExploreLayout } from "./ExploreLayout";
import { hasFilters } from "./exploreSearch";
import { NoMatches } from "./NoMatches";
import { FilterChips } from "./FilterChips";
import { HackathonExploreRow } from "./HackathonExploreRow";
import { RowsSkeleton } from "./RowsSkeleton";
import { useExploreHackathons } from "./useExploreHackathons";

const route = getRouteApi("/_shell/explore/hackathons");

const LENGTHS = [
	{ value: 1, label: "1 week" },
	{ value: 2, label: "2 weeks" },
] as const;

const PAID = [{ value: "paid", label: "Paid" }] as const;

/** Open and live Hackathons anyone can browse, filtered by the URL. */
export function ExploreHackathons() {
	const search = route.useSearch();
	const navigate = route.useNavigate();
	const { hackathons, isLoading } = useExploreHackathons(search);

	function setFilter(patch: Partial<typeof search>) {
		void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
	}

	return (
		<ExploreLayout
			context={
				hackathons
					? `${hackathons.length} ${hackathons.length === 1 ? "hackathon" : "hackathons"}`
					: null
			}
			filters={
				<>
					<FilterChips
						label="Job"
						options={ROLES}
						value={search.role}
						onChange={(role) => setFilter({ role })}
					/>
					<FilterChips
						label="Length"
						options={LENGTHS}
						value={search.weeks}
						onChange={(weeks) => setFilter({ weeks })}
					/>
					<FilterChips
						label="Pay"
						options={PAID}
						value={search.paid ? "paid" : undefined}
						onChange={(paid) => setFilter({ paid: paid ? true : undefined })}
					/>
				</>
			}
		>
			{hackathons === undefined || (isLoading && hackathons.length === 0) ? (
				<RowsSkeleton rowClassName="h-20" />
			) : hackathons.length === 0 ? (
				hasFilters(search) ? (
					<NoMatches
						noun="hackathons"
						onClear={() => void navigate({ search: {}, replace: true })}
					/>
				) : (
					<EmptyState title="No open hackathons yet." />
				)
			) : (
				<RowList>
					{hackathons.map((hackathon) => (
						<HackathonExploreRow
							key={hackathon.hackathonId}
							hackathon={hackathon}
						/>
					))}
				</RowList>
			)}
		</ExploreLayout>
	);
}
