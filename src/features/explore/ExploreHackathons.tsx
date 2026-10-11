import { getRouteApi } from "@tanstack/react-router";
import { EmptyState } from "~/components/shared/EmptyState";
import { RowList } from "~/components/shared/RowList";
import { Skeleton } from "~/components/ui/skeleton";
import { ROLES } from "~/features/hiring/jobChips";
import { ExploreLayout } from "./ExploreLayout";
import { FilterChips } from "./FilterChips";
import { HackathonExploreRow } from "./HackathonExploreRow";
import { useExploreHackathons } from "./hooks/useExploreHackathons";

const route = getRouteApi("/_shell/explore/hackathons");

const LENGTHS = [
	{ value: 1, label: "1 week" },
	{ value: 2, label: "2 weeks" },
] as const;

const PAID = [{ value: "paid", label: "Paid" }] as const;

/** Open and building Hackathons anyone can browse, filtered by the URL. */
export function ExploreHackathons() {
	const search = route.useSearch();
	const navigate = route.useNavigate();
	const hackathons = useExploreHackathons(search);

	return (
		<ExploreLayout
			filters={
				<>
					<FilterChips
						label="Job"
						options={ROLES}
						value={search.role}
						onChange={(role) =>
							void navigate({ search: (prev) => ({ ...prev, role }) })
						}
					/>
					<FilterChips
						label="Length"
						options={LENGTHS}
						value={search.weeks}
						onChange={(weeks) =>
							void navigate({ search: (prev) => ({ ...prev, weeks }) })
						}
					/>
					<FilterChips
						label="Pay"
						options={PAID}
						value={search.paid ? "paid" : undefined}
						onChange={(paid) =>
							void navigate({
								search: (prev) => ({ ...prev, paid: paid ? true : undefined }),
							})
						}
					/>
				</>
			}
		>
			{hackathons === undefined ? (
				<RowsSkeleton />
			) : hackathons.length === 0 ? (
				<EmptyState title="No open hackathons yet." />
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

function RowsSkeleton() {
	return (
		<div className="flex flex-col gap-3" aria-hidden>
			{[0, 1, 2, 3].map((n) => (
				<Skeleton key={n} className="h-20" />
			))}
		</div>
	);
}
