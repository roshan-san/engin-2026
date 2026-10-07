import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { PageHeader } from "~/components/shared/PageHeader";
import { Badge } from "~/components/ui/badge";
import { useExploreHackathons } from "~/features/explore/hooks/useExploreHackathons";
import { formatDate, formatDateRange } from "~/lib/dates";

export function ExploreHackathonsPage() {
	const hackathons = useExploreHackathons();

	return (
		<div className="mx-auto w-full max-w-6xl space-y-8 py-8">
			<PageHeader title="Hackathons" hidden />
			{hackathons === undefined ? (
				<PageLoading rows={4} />
			) : hackathons.length === 0 ? (
				<p className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
					No Hackathons are open right now.
				</p>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{hackathons.map((hackathon) => (
						<Link
							key={hackathon._id}
							to="/hackathons/$hackathonId"
							params={{ hackathonId: hackathon._id }}
							className="group flex flex-col gap-2 rounded-xl border border-border p-6 hover:bg-muted/20"
						>
							<h2 className="text-lg font-semibold tracking-tight break-words group-hover:text-primary">
								{hackathon.title}
							</h2>
							<p className="text-sm text-muted-foreground">
								{hackathon.startupName} · {hackathon.roleTitle}
							</p>
							<p className="mt-4 flex-1 text-sm">
								Apply by {formatDate(hackathon.deadline)}
							</p>
							<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
								<span>
									{formatDateRange(hackathon.startsAt, hackathon.endsAt)}
								</span>
								<Badge variant="outline">
									{hackathon.participantCount}/{hackathon.maxParticipants}
								</Badge>
								{hackathon.prize ? (
									<Badge variant="secondary">{hackathon.prize}</Badge>
								) : null}
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
