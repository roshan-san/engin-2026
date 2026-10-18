import { getRouteApi } from "@tanstack/react-router";
import { EmptyState } from "~/components/EmptyState";
import { RowList } from "~/components/RowList";
import { Button } from "~/components/ui/button";
import { CITIES, KINDS, STAGES } from "~/features/startups/startupChips";
import { ExploreLayout } from "./ExploreLayout";
import { hasFilters } from "./exploreSearch";
import { FilterChips } from "./FilterChips";
import { RowsSkeleton } from "./RowsSkeleton";
import { StartupExploreRow } from "./StartupExploreRow";
import { useExploreStartups } from "./useExploreStartups";

const route = getRouteApi("/_shell/explore/startups");

/** Startups anyone can browse, best Rating first, filtered by the URL. */
export function ExploreStartups() {
	const search = route.useSearch();
	const navigate = route.useNavigate();
	const { startups, isLoading } = useExploreStartups(search);

	return (
		<ExploreLayout
			context={
				startups
					? `${startups.length} ${startups.length === 1 ? "startup" : "startups"}`
					: null
			}
			filters={
				<>
					<FilterChips
						label="Stage"
						options={STAGES}
						value={search.stage}
						onChange={(stage) =>
							void navigate({
								search: (prev) => ({ ...prev, stage }),
								replace: true,
							})
						}
					/>
					<FilterChips
						label="Kind"
						options={KINDS}
						value={search.category}
						onChange={(category) =>
							void navigate({
								search: (prev) => ({ ...prev, category }),
								replace: true,
							})
						}
					/>
					<FilterChips
						label="City"
						options={CITIES}
						value={search.city}
						onChange={(city) =>
							void navigate({
								search: (prev) => ({ ...prev, city }),
								replace: true,
							})
						}
					/>
				</>
			}
		>
			{startups === undefined || (isLoading && startups.length === 0) ? (
				<RowsSkeleton rowClassName="h-16" />
			) : startups.length === 0 ? (
				hasFilters(search) ? (
					<EmptyState
						title="No startups match these filters"
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
					<EmptyState title="No startups yet." />
				)
			) : (
				<RowList>
					{startups.map((startup) => (
						<StartupExploreRow key={startup.slug} startup={startup} />
					))}
				</RowList>
			)}
		</ExploreLayout>
	);
}
