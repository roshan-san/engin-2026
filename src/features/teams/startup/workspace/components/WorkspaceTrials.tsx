import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { EmptyState } from "~/components/shared/EmptyState";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { formatDate } from "~/lib/dates";

type WorkspaceTrialsProps = {
	readonly startupId: Id<"startups">;
	readonly isFounder: boolean;
};

export function WorkspaceTrials({
	startupId,
	isFounder,
}: WorkspaceTrialsProps) {
	const trials = useQuery(api.trialCycles.list, { startupId });

	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-lg font-semibold">Trial Cycles</h2>
				{isFounder ? (
					<Button asChild size="sm">
						<Link to="/app/startup/trials/new">Launch Trial Cycle</Link>
					</Button>
				) : null}
			</div>
			{trials === undefined ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : trials.length === 0 ? (
				<EmptyState
					title="No Trial Cycles"
					description="Evaluate applicants on real Pulses before they join the team."
				/>
			) : (
				<ul className="space-y-2">
					{trials.map((trial) => (
						<li key={trial._id}>
							<Link
								to="/app/trials/$trialCycleId"
								params={{ trialCycleId: trial._id }}
								className="flex flex-col gap-2 rounded-xl border border-border p-4 hover:bg-muted/20 sm:flex-row sm:items-center"
							>
								<div className="min-w-0 flex-1">
									<p className="font-medium">{trial.title}</p>
									<p className="text-sm text-muted-foreground">
										{trial.roleTitle} · {formatDate(trial.startsAt)} –{" "}
										{formatDate(trial.endsAt)}
									</p>
								</div>
								<Badge variant="secondary">{trial.status}</Badge>
							</Link>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
