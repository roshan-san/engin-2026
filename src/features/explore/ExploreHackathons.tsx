import { getRouteApi } from "@tanstack/react-router";
import { EmptyState } from "~/components/EmptyState";
import { RowList } from "~/components/RowList";
import { Button } from "~/components/ui/button";
import { ROLES } from "~/features/hiring/jobChips";
import { ExploreLayout } from "./ExploreLayout";
import { hasFilters } from "./exploreSearch";
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
						onChange={(role) =>
							void navigate({
								search: (prev) => ({ ...prev, role }),
								replace: true,
							})
						}
					/>
					<FilterChips
						label="Length"
						options={LENGTHS}
						value={search.weeks}
						onChange={(weeks) =>
							void navigate({
								search: (prev) => ({ ...prev, weeks }),
								replace: true,
							})
						}
					/>
					<FilterChips
						label="Pay"
						options={PAID}
						value={search.paid ? "paid" : undefined}
						onChange={(paid) =>
							void navigate({
								search: (prev) => ({ ...prev, paid: paid ? true : undefined }),
								replace: true,
							})
						}
					/>
				</>
			}
		>
			{hackathons === undefined || (isLoading && hackathons.length === 0) ? (
				<RowsSkeleton rowClassName="h-20" />
			) : hackathons.length === 0 ? (
				hasFilters(search) ? (
					<EmptyState
						title="No hackathons match these filters"
						action={
							<Button
								variant="outline"
								onClick={() => void navigate({ search: {}, replace: true })}
							>
								Clear filters
							</Button>
						}
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
