import { getRouteApi } from "@tanstack/react-router";
import { EmptyState } from "~/components/EmptyState";
import { RowList } from "~/components/RowList";
import { CITIES, KINDS, STAGES } from "~/features/startups/startupChips";
import { ExploreLayout } from "./ExploreLayout";
import { FilterChips } from "./FilterChips";
import { useExploreStartups } from "./useExploreStartups";
import { StartupExploreRow } from "./StartupExploreRow";
import { RowsSkeleton } from "./RowsSkeleton";

const route = getRouteApi("/_shell/explore/startups");

/** Startups anyone can browse, best Rating first, filtered by the URL. */
export function ExploreStartups() {
	const search = route.useSearch();
	const navigate = route.useNavigate();
	const startups = useExploreStartups(search);

	return (
		<ExploreLayout
			filters={
				<>
					<FilterChips
						label="Stage"
						options={STAGES}
						value={search.stage}
						onChange={(stage) =>
							void navigate({ search: (prev) => ({ ...prev, stage }) })
						}
					/>
					<FilterChips
						label="Kind"
						options={KINDS}
						value={search.category}
						onChange={(category) =>
							void navigate({ search: (prev) => ({ ...prev, category }) })
						}
					/>
					<FilterChips
						label="City"
						options={CITIES}
						value={search.city}
						onChange={(city) =>
							void navigate({ search: (prev) => ({ ...prev, city }) })
						}
					/>
				</>
			}
		>
			{startups === undefined ? (
				<RowsSkeleton rowClassName="h-16" />
			) : startups.length === 0 ? (
				<EmptyState title="No startups match." />
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
