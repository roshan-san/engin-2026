import { useNavigate } from "@tanstack/react-router";
import { Row, RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Button } from "~/components/ui/button";
import { useInvites } from "~/shell/invites/hooks/useInvites";

/** Your open Invites, Join or Decline. A stopgap until the ✉ tray (phase 5). */
export function InvitesSection() {
	const { invites, join, decline } = useInvites();
	const navigate = useNavigate();
	if (!invites || invites.length === 0) return null;

	return (
		<section className="flex flex-col gap-1">
			<SectionLabel>Invites</SectionLabel>
			<RowList>
				{invites.map((invite) => (
					<Row
						key={invite.inviteId}
						title={invite.startupName}
						meta={invite.fromHackathon ? "Hired" : undefined}
						trailing={
							<span className="flex items-center gap-2">
								<Button
									size="sm"
									variant="ghost"
									onClick={() => void decline(invite.inviteId)}
								>
									Decline
								</Button>
								<Button
									size="sm"
									onClick={async () => {
										if (await join(invite.inviteId)) {
											await navigate({
												to: "/s/$slug/board",
												params: { slug: invite.slug },
											});
										}
									}}
								>
									Join
								</Button>
							</span>
						}
					/>
				))}
			</RowList>
		</section>
	);
}
