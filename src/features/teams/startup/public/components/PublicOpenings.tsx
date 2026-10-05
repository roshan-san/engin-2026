import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Badge } from "~/components/ui/badge";
import { ApplyDialog } from "~/features/hiring/opportunities/components/ApplyDialog";
import { formatDate } from "~/lib/dates";

type PublicOpeningsProps = {
	readonly startupId: Id<"startups">;
};

export function PublicOpenings({ startupId }: PublicOpeningsProps) {
	const roles = useQuery(api.hiring.roles.listOpenByStartup, { startupId });
	const trials = useQuery(api.hiring.trialCycles.listOpenByStartup, {
		startupId,
	});

	return (
		<div className="space-y-8">
			<section className="space-y-3">
				<h2 className="text-lg font-semibold">Open Roles</h2>
				{roles === undefined ? (
					<p className="text-sm text-muted-foreground">Loading…</p>
				) : roles.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No open Roles right now.
					</p>
				) : (
					<ul className="space-y-2">
						{roles.map((role) => (
							<li
								key={role._id}
								className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
							>
								<div className="min-w-0 flex-1">
									<p className="font-medium">{role.title}</p>
									<p className="text-sm text-muted-foreground">{role.type}</p>
								</div>
								<p className="text-sm text-muted-foreground">
									Join through a hackathon
								</p>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="space-y-3">
				<h2 className="text-lg font-semibold">Hackathons</h2>
				{trials === undefined ? (
					<p className="text-sm text-muted-foreground">Loading…</p>
				) : trials.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No hackathons open right now.
					</p>
				) : (
					<ul className="space-y-2">
						{trials.map((trial) => (
							<li
								key={trial._id}
								className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
							>
								<div className="min-w-0 flex-1">
									<Link
										to="/hackathons/$trialCycleId"
										params={{ trialCycleId: trial._id }}
										className="font-medium hover:underline"
									>
										{trial.title}
									</Link>
									<p className="text-sm text-muted-foreground">
										{formatDate(trial.startsAt)} – {formatDate(trial.endsAt)}
									</p>
									<Badge variant="outline" className="mt-2">
										{trial.participantCount}/{trial.maxContributors}
									</Badge>
								</div>
								<ApplyDialog
									trialCycleId={trial._id}
									title={trial.title}
									size="sm"
								/>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
