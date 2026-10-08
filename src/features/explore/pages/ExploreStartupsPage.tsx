import { Page } from "~/components/shared/Page";
import { Search } from "lucide-react";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { PageHeader } from "~/components/shared/PageHeader";
import { Row, RowList } from "~/components/shared/RowList";
import { Input } from "~/components/ui/input";
import { useExploreStartups } from "~/features/explore/hooks/useExploreStartups";
import { categoryLabel, stageLabel } from "~/features/teams/startup/constants";
import { useRegisterSearch } from "~/shell/command/CommandProvider";
import { StartupAvatar } from "~/shell/topbar/StartupAvatar";

export function ExploreStartupsPage() {
	const { term, setTerm, results } = useExploreStartups();
	const registerSearch = useRegisterSearch();

	return (
		<>
			<PageHeader
				width="wide"
				title="Startups"
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
							placeholder="Search Startups"
							aria-label="Search Startups"
							className="pl-9"
						/>
					</div>
				}
			/>
			<Page className="space-y-6">
				{results === undefined ? (
					<PageLoading rows={4} />
				) : results.startups.length === 0 ? (
					<EmptyState
						title={
							term
								? "No startups match that search."
								: "No public startups yet."
						}
					/>
				) : (
					<RowList>
						{results.startups.map((startup) => {
							const meta = [
								stageLabel(startup.stage),
								categoryLabel(startup.category),
							]
								.filter(Boolean)
								.join(" · ");
							return (
								<Row
									key={startup._id}
									to="/startup/$slug"
									params={{ slug: startup.slug }}
									leading={
										<StartupAvatar name={startup.name} className="size-8" />
									}
									title={startup.name}
									meta={
										<>
											{startup.tagline ? (
												<span className="block truncate">
													{startup.tagline}
												</span>
											) : null}
											{meta ? (
												<span className="block truncate">{meta}</span>
											) : null}
										</>
									}
								/>
							);
						})}
					</RowList>
				)}
			</Page>
		</>
	);
}
