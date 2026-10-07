import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { PageHeader } from "~/components/shared/PageHeader";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { useContributors } from "~/features/explore/hooks/useContributors";
import { useRegisterSearch } from "~/shell/command/CommandProvider";

export function ExplorePeoplePage() {
	const contributors = useContributors();
	const registerSearch = useRegisterSearch();

	return (
		<div className="mx-auto w-full max-w-6xl space-y-8 py-8">
			<PageHeader title="People" hidden />
			<div className="flex flex-col gap-3 sm:flex-row">
				<Input
					ref={registerSearch}
					value={contributors.skill}
					onChange={(event) => contributors.setSkill(event.target.value)}
					placeholder="Filter by skill"
					className="h-11 sm:max-w-xs"
				/>
				<Input
					value={contributors.location}
					onChange={(event) => contributors.setLocation(event.target.value)}
					placeholder="Filter by location"
					className="h-11 sm:max-w-xs"
				/>
			</div>

			{contributors.contributors === undefined ? (
				<PageLoading rows={4} />
			) : contributors.contributors.length === 0 ? (
				<p className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
					No contributors match yet.
				</p>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{contributors.contributors.map((contributor) => (
						<Link
							key={contributor._id}
							to="/u/$username"
							params={{ username: contributor.username }}
							className="group flex flex-col gap-2 rounded-xl border border-border p-6 hover:bg-muted/20"
						>
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold tracking-tight group-hover:text-primary">
									{contributor.name ?? `@${contributor.username}`}
								</h2>
								<Badge variant="secondary">{contributor.score}</Badge>
							</div>
							{contributor.location ? (
								<p className="text-xs text-muted-foreground">
									{contributor.location}
								</p>
							) : null}
							{contributor.skills.length > 0 ? (
								<div className="mt-1 flex flex-wrap gap-1.5">
									{contributor.skills.slice(0, 4).map((s) => (
										<Badge key={s} variant="outline">
											{s}
										</Badge>
									))}
								</div>
							) : null}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
