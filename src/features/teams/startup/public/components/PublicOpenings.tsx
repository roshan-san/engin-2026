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
	const hackathons = useQuery(api.hiring.hackathons.listOpenByStartup, {
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
									Join through a Hackathon
								</p>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="space-y-3">
				<h2 className="text-lg font-semibold">Hackathons</h2>
				{hackathons === undefined ? (
					<p className="text-sm text-muted-foreground">Loading…</p>
				) : hackathons.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No Hackathons open right now.
					</p>
				) : (
					<ul className="space-y-2">
						{hackathons.map((hackathon) => (
							<li
								key={hackathon._id}
								className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
							>
								<div className="min-w-0 flex-1">
									<Link
										to="/hackathons/$hackathonId"
										params={{ hackathonId: hackathon._id }}
										className="font-medium hover:underline"
									>
										{hackathon.title}
									</Link>
									<p className="text-sm text-muted-foreground">
										{formatDate(hackathon.startsAt)} –{" "}
										{formatDate(hackathon.endsAt)}
									</p>
									<Badge variant="outline" className="mt-2">
										{hackathon.participantCount}/{hackathon.maxParticipants}
									</Badge>
								</div>
								<ApplyDialog
									hackathonId={hackathon._id}
									title={hackathon.title}
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
