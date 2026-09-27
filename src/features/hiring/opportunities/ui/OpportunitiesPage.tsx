import { api } from "@convex/_generated/api";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import { useState } from "react";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ApplyButtons } from "~/features/hiring/opportunities/components/ApplyButtons";
import { formatDateRange } from "~/lib/dates";

export function OpportunitiesPage() {
	const [term, setTerm] = useState("");
	const results = useQuery(api.hiring.opportunities.search, {
		term: term || undefined,
	});

	return (
		<div className="mx-auto w-full max-w-5xl space-y-10 py-8">
			<div className="space-y-3">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Opportunities
				</h1>
				<p className="max-w-xl text-muted-foreground">
					Open Roles and Trial Cycles. Prove work, then join the team.
				</p>
			</div>
			<div className="relative max-w-xl">
				<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={term}
					onChange={(event) => setTerm(event.target.value)}
					placeholder="Search Roles and Trial Cycles"
					className="h-12 rounded-full pl-10"
				/>
			</div>
			{results === undefined ? (
				<PageLoading rows={4} />
			) : (
				<>
					<section className="space-y-4">
						<h2 className="text-sm font-medium text-muted-foreground">Roles</h2>
						{results.roles.length === 0 ? (
							<EmptyState
								title="No open Roles"
								description="Founders post Roles from their startup workspace."
							/>
						) : (
							<ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
								{results.roles.map((role) => (
									<li
										key={role._id}
										className="flex flex-col gap-4 rounded-xl border border-border p-5"
									>
										<div className="min-w-0 flex-1">
											<p className="text-lg font-semibold">{role.title}</p>
											<p className="mt-1 text-sm text-muted-foreground">
												<Link
													to="/startup/$slug"
													params={{ slug: role.startupSlug }}
													className="hover:text-foreground"
												>
													{role.startupName}
												</Link>
												{" · "}
												{role.type}
											</p>
											<p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
												{role.description}
											</p>
											{role.skills.length > 0 ? (
												<p className="mt-3 text-sm text-muted-foreground">
													{role.skills.join(" · ")}
												</p>
											) : null}
										</div>
										<div>
											<Button asChild size="sm" variant="outline">
												<Link
													to="/startup/$slug"
													params={{ slug: role.startupSlug }}
												>
													See Trial Cycles
												</Link>
											</Button>
										</div>
									</li>
								))}
							</ul>
						)}
					</section>
					<section className="space-y-4">
						<h2 className="text-sm font-medium text-muted-foreground">
							Trial Cycles
						</h2>
						{results.trials.length === 0 ? (
							<EmptyState
								title="No open Trial Cycles"
								description="Trial Cycles let you prove work before joining a team."
							/>
						) : (
							<ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
								{results.trials.map((trial) => (
									<li
										key={trial._id}
										className="flex flex-col gap-4 rounded-xl border border-border p-5"
									>
										<div className="min-w-0 flex-1">
											<Link
												to="/app/trials/$trialCycleId"
												params={{ trialCycleId: trial._id }}
												className="text-lg font-semibold hover:text-primary"
											>
												{trial.title}
											</Link>
											<p className="mt-1 text-sm text-muted-foreground">
												<Link
													to="/startup/$slug"
													params={{ slug: trial.startupSlug }}
													className="hover:text-foreground"
												>
													{trial.startupName}
												</Link>
												{" · "}
												{formatDateRange(trial.startsAt, trial.endsAt)}
											</p>
											<p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
												{trial.description}
											</p>
											<p className="mt-3 text-sm text-muted-foreground">
												{trial.participantCount}/{trial.maxContributors}{" "}
												contributors
											</p>
										</div>
										<div>
											<ApplyButtons
												trialCycleId={trial._id}
												admission={trial.admission}
											/>
										</div>
									</li>
								))}
							</ul>
						)}
					</section>
				</>
			)}
		</div>
	);
}
