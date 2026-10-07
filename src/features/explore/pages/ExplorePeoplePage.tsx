import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { Leaderboard } from "~/components/shared/Leaderboard";
import { PageHeader } from "~/components/shared/PageHeader";
import { ScoreBadge } from "~/components/shared/ScoreBadge";
import { Input } from "~/components/ui/input";
import { useContributors } from "~/features/explore/hooks/useContributors";
import { useRegisterSearch } from "~/shell/command/CommandProvider";

export function ExplorePeoplePage() {
	const contributors = useContributors();
	const registerSearch = useRegisterSearch();

	return (
		<div className="mx-auto w-full max-w-5xl space-y-6">
			<PageHeader
				title="People"
				hidden
				actions={
					<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
						<Input
							ref={registerSearch}
							value={contributors.skill}
							onChange={(event) => contributors.setSkill(event.target.value)}
							placeholder="Filter by skill"
							className="sm:w-48"
						/>
						<Input
							value={contributors.location}
							onChange={(event) => contributors.setLocation(event.target.value)}
							placeholder="Filter by location"
							className="sm:w-48"
						/>
					</div>
				}
			/>

			{contributors.contributors === undefined ? (
				<PageLoading rows={4} />
			) : contributors.contributors.length === 0 ? (
				<EmptyState title="No contributors match yet." />
			) : (
				<Leaderboard
					entries={contributors.contributors.map((contributor, index) => ({
						key: contributor._id,
						rank: index + 1,
						name: contributor.name ?? `@${contributor.username}`,
						value: <ScoreBadge score={contributor.score} />,
						to: `/u/${contributor.username}`,
					}))}
				/>
			)}
		</div>
	);
}
