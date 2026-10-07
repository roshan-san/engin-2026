import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Row, RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
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
		<>
			<section className="space-y-1">
				<SectionLabel>Open Roles</SectionLabel>
				{roles === undefined ? (
					<p className="text-sm text-muted-foreground">Loading…</p>
				) : roles.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No open Roles right now.
					</p>
				) : (
					<RowList>
						{roles.map((role) => (
							<Row
								key={role._id}
								title={role.title}
								meta={role.type}
								trailing="Join through a Hackathon"
							/>
						))}
					</RowList>
				)}
			</section>

			<section className="space-y-1">
				<SectionLabel>Hackathons</SectionLabel>
				{hackathons === undefined ? (
					<p className="text-sm text-muted-foreground">Loading…</p>
				) : hackathons.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No Hackathons open right now.
					</p>
				) : (
					<RowList>
						{hackathons.map((hackathon) => (
							<Row
								key={hackathon._id}
								title={
									<Link
										to="/hackathons/$hackathonId"
										params={{ hackathonId: hackathon._id }}
										className="hover:underline"
									>
										{hackathon.title}
									</Link>
								}
								meta={`${formatDate(hackathon.startsAt)} – ${formatDate(
									hackathon.endsAt,
								)} · ${hackathon.participantCount}/${hackathon.maxParticipants} seats`}
								trailing={
									<ApplyDialog
										hackathonId={hackathon._id}
										title={hackathon.title}
										size="sm"
									/>
								}
							/>
						))}
					</RowList>
				)}
			</section>
		</>
	);
}
