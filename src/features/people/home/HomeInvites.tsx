import { PlaceLogo } from "~/components/PlaceLogo";
import { Row, RowList } from "~/components/RowList";
import { Section } from "~/components/Section";
import { Button } from "~/components/ui/button";
import { inviteTitle, useInvites } from "~/shell/useInvites";

/** Your open Invites at the top of Home: Join or Decline. Nothing when there are none. */
export function HomeInvites() {
	const { invites, answering, join, decline } = useInvites();

	if (!invites || invites.length === 0) {
		return null;
	}

	return (
		<Section label="Invites">
			<RowList>
				{invites.map((invite) => (
					<Row
						key={invite.inviteId}
						leading={<PlaceLogo name={invite.startupName} url={null} />}
						title={inviteTitle(invite)}
						trailing={
							<div className="flex items-center gap-2">
								<Button
									size="sm"
									variant="ghost"
									disabled={answering === invite.inviteId}
									onClick={() => void decline(invite)}
								>
									Decline
								</Button>
								<Button
									size="sm"
									disabled={answering === invite.inviteId}
									onClick={() => void join(invite)}
								>
									Join
								</Button>
							</div>
						}
					/>
				))}
			</RowList>
		</Section>
	);
}
