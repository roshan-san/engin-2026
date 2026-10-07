import { Search } from "lucide-react";
import { PageLoading } from "~/components/globals/PageLoading";
import { compactCountdown } from "~/components/shared/countdownParts";
import { EmptyState } from "~/components/shared/EmptyState";
import { LiveBadge } from "~/components/shared/LiveBadge";
import { PageHeader } from "~/components/shared/PageHeader";
import { Row, RowList } from "~/components/shared/RowList";
import { Input } from "~/components/ui/input";
import { useExploreHackathons } from "~/features/explore/hooks/useExploreHackathons";
import { useRegisterSearch } from "~/shell/command/CommandProvider";

export function ExploreHackathonsPage() {
	const { term, setTerm, hackathons } = useExploreHackathons();
	const registerSearch = useRegisterSearch();
	const now = Date.now();

	return (
		<div className="mx-auto w-full max-w-5xl space-y-6">
			<PageHeader
				title="Hackathons"
				hidden
				actions={
					<div className="relative w-full sm:w-72">
						<Search
							aria-hidden
							className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							ref={registerSearch}
							value={term}
							onChange={(event) => setTerm(event.target.value)}
							placeholder="Search Hackathons"
							aria-label="Search Hackathons"
							className="pl-9"
						/>
					</div>
				}
			/>

			{hackathons === undefined ? (
				<PageLoading rows={4} />
			) : hackathons.length === 0 ? (
				<EmptyState
					title={
						term
							? "No Hackathons match that search."
							: "No Hackathons are open right now."
					}
				/>
			) : (
				<RowList>
					{hackathons.map((hackathon) => (
						<Row
							key={hackathon._id}
							to="/hackathons/$hackathonId"
							params={{ hackathonId: hackathon._id }}
							title={hackathon.title}
							meta={
								<span className="flex items-center gap-x-2">
									<LiveBadge status="open" />
									<span className="truncate">
										{[hackathon.startupName, hackathon.prize]
											.filter(Boolean)
											.join(" · ")}
									</span>
								</span>
							}
							trailing={
								hackathon.endsAt > now ? (
									<span className="tabular-nums">
										ends in {compactCountdown(hackathon.endsAt, now)}
									</span>
								) : null
							}
						/>
					))}
				</RowList>
			)}
		</div>
	);
}
