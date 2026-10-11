import { getRouteApi } from "@tanstack/react-router";
import { EmptyState } from "~/components/shared/EmptyState";
import { RowList } from "~/components/shared/RowList";
import { Skeleton } from "~/components/ui/skeleton";
import { CITIES, KINDS, STAGES } from "~/features/startups/startupChips";
import { ExploreLayout } from "./ExploreLayout";
import { FilterChips } from "./FilterChips";
import { useExploreStartups } from "./hooks/useExploreStartups";
import { StartupExploreRow } from "./StartupExploreRow";

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
				<RowsSkeleton />
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

function RowsSkeleton() {
	return (
		<div className="flex flex-col gap-3" aria-hidden>
			{[0, 1, 2, 3].map((n) => (
				<Skeleton key={n} className="h-16" />
			))}
		</div>
	);
}
