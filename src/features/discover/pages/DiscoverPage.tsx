import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { PageLoading } from "~/components/globals/PageLoading";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { useContributors } from "~/features/discover/hooks/useContributors";
import { useDiscoverStartups } from "~/features/discover/hooks/useDiscoverStartups";
import { cn } from "~/lib/utils";
import { useRegisterSearch } from "~/shell/command/CommandProvider";

const TABS = [
	{ value: "startups", label: "Startups" },
	{ value: "contributors", label: "Contributors" },
] as const;

export function DiscoverPage() {
	const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("startups");
	const { term, setTerm, results } = useDiscoverStartups();
	const contributors = useContributors();
	const registerSearch = useRegisterSearch();

	return (
		<div className="mx-auto w-full max-w-6xl space-y-8 py-8">
			<div className="space-y-3">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Discover
				</h1>
				<p className="max-w-xl text-muted-foreground">
					Startups and proven contributors on Engin.
				</p>
			</div>

			<div className="flex gap-6 border-b border-border">
				{TABS.map((item) => (
					<button
						key={item.value}
						type="button"
						onClick={() => setTab(item.value)}
						className={cn(
							"-mb-px border-b-2 pb-3 text-sm font-medium",
							tab === item.value
								? "border-foreground text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground",
						)}
					>
						{item.label}
					</button>
				))}
			</div>

			{tab === "startups" ? (
				<div className="space-y-8">
					<div className="relative max-w-xl">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							ref={registerSearch}
							value={term}
							onChange={(event) => setTerm(event.target.value)}
							placeholder="Search startups"
							className="h-12 rounded-full pl-10"
						/>
					</div>

					{results === undefined ? (
						<PageLoading rows={4} />
					) : results.startups.length === 0 ? (
						<p className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
							{term
								? "No startups match that search."
								: "No public startups yet."}
						</p>
					) : (
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{results.startups.map((startup) => (
								<Link
									key={startup._id}
									to="/startup/$slug"
									params={{ slug: startup.slug }}
									className="group flex flex-col rounded-xl border border-border p-6 hover:bg-muted/20"
								>
									<h2 className="text-lg font-semibold tracking-tight group-hover:text-primary">
										{startup.name}
									</h2>
									{startup.tagline ? (
										<p className="mt-2 line-clamp-2 flex-1 text-muted-foreground">
											{startup.tagline}
										</p>
									) : (
										<span className="mt-2 flex-1" />
									)}
									<p className="mt-6 text-sm text-muted-foreground">
										{startup.followerCount === 0
											? "New on Engin"
											: `${startup.followerCount} followers`}
									</p>
								</Link>
							))}
						</div>
					)}
				</div>
			) : (
				<div className="space-y-8">
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
									{contributor.headline ? (
										<p className="text-sm text-muted-foreground">
											{contributor.headline}
										</p>
									) : null}
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
			)}
		</div>
	);
}
