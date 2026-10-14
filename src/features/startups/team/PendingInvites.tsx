import { Row, RowList } from "~/components/RowList";
import { SectionLabel } from "~/components/SectionLabel";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { dayLabel } from "~/features/hiring/hackathonDates";
import type { StartupInvite } from "./useStartupInvites";

/** The Founder's pending Invites, each with Revoke. Nothing shows while there are none. */
export function PendingInvites({
	invites,
	onRevoke,
}: {
	readonly invites: StartupInvite[] | undefined;
	readonly onRevoke: (invite: StartupInvite) => Promise<void>;
}) {
	if (!invites || invites.length === 0) return null;

	return (
		<section className="flex flex-col gap-1">
			<SectionLabel>Invites</SectionLabel>
			<RowList>
				{invites.map((invite) => (
					<Row
						key={invite.inviteId}
						title={invite.email}
						meta={`expires ${dayLabel(invite.expiresAt)}`}
						trailing={
							<div className="flex items-center gap-3">
								{invite.fromHackathon ? (
									<Badge variant="outline">Hired</Badge>
								) : null}
								<Button
									variant="ghost"
									size="sm"
									className="text-muted-foreground"
									onClick={() => void onRevoke(invite)}
								>
									Revoke
								</Button>
							</div>
						}
					/>
				))}
			</RowList>
		</section>
	);
}
