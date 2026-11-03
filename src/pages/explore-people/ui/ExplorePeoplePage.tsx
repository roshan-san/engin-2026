import { getRouteApi } from "@tanstack/react-router";
import {
	PersonExploreRow,
	parsePeopleSearch,
	useExplorePeople,
} from "~/entities/person";
import { DISCIPLINES } from "~/shared/config/disciplines";
import { hasFilters } from "~/shared/lib/search";
import { EmptyState } from "~/shared/ui/EmptyState";
import { FilterChips } from "~/shared/ui/FilterChips";
import { NoMatches } from "~/shared/ui/NoMatches";
import { RowList } from "~/shared/ui/RowList";
import { RowsSkeleton } from "~/shared/ui/RowsSkeleton";
import { ExploreLayout } from "~/widgets/explore-layout";

const route = getRouteApi("/_shell/explore/people");

/** People whose work someone else approved, best Momentum first, filtered by the URL. */
export function ExplorePeoplePage() {
	const search = route.useSearch();
	const navigate = route.useNavigate();
	const { people, isLoading } = useExplorePeople(search);

	return (
		<ExploreLayout
			context={
				people
					? `${people.length} ${people.length === 1 ? "person" : "people"}`
					: null
			}
			filters={
				<FilterChips
					label="Discipline"
					options={DISCIPLINES}
					value={search.discipline}
					onChange={(discipline) =>
						void navigate({ search: { discipline }, replace: true })
					}
				/>
			}
		>
			{people === undefined || (isLoading && people.length === 0) ? (
				<RowsSkeleton rowClassName="h-16" />
			) : people.length === 0 ? (
				hasFilters(parsePeopleSearch(search)) ? (
					<NoMatches
						noun="people"
						onClear={() => void navigate({ search: {}, replace: true })}
					/>
				) : (
					<EmptyState
						title="Nobody here yet."
						body="People appear once someone else approves their work."
					/>
				)
			) : (
				<RowList>
					{people.map((person) => (
						<PersonExploreRow key={person._id} person={person} />
					))}
				</RowList>
			)}
		</ExploreLayout>
	);
}
