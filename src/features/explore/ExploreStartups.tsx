import { getRouteApi } from "@tanstack/react-router";
import {
	CITIES,
	KINDS,
	STAGES,
	StartupExploreRow,
	useExploreStartups,
} from "~/entities/startup";
import { hasFilters } from "~/shared/lib/search";
import { EmptyState } from "~/shared/ui/EmptyState";
import { FilterChips } from "~/shared/ui/FilterChips";
import { NoMatches } from "~/shared/ui/NoMatches";
import { RowList } from "~/shared/ui/RowList";
import { RowsSkeleton } from "~/shared/ui/RowsSkeleton";
import { ExploreLayout } from "./ExploreLayout";

const route = getRouteApi("/_shell/explore/startups");

/** Startups anyone can browse, best Rating first, filtered by the URL. */
export function ExploreStartups() {
	const search = route.useSearch();
	const navigate = route.useNavigate();
	const { startups, isLoading } = useExploreStartups(search);

	function setFilter(patch: Partial<typeof search>) {
		void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
	}

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
						onChange={(stage) => setFilter({ stage })}
					/>
					<FilterChips
						label="Kind"
						options={KINDS}
						value={search.category}
						onChange={(category) => setFilter({ category })}
					/>
					<FilterChips
						label="City"
						options={CITIES}
						value={search.city}
						onChange={(city) => setFilter({ city })}
					/>
				</>
			}
		>
			{startups === undefined || (isLoading && startups.length === 0) ? (
				<RowsSkeleton rowClassName="h-16" />
			) : startups.length === 0 ? (
				hasFilters(search) ? (
					<NoMatches
						noun="startups"
						onClear={() => void navigate({ search: {}, replace: true })}
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
