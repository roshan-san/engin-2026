import { inviteTitle, useMyInvites } from "~/entities/invite";
import { Button } from "~/shared/ui/button";
import { PlaceLogo } from "~/shared/ui/PlaceLogo";
import { Row, RowList } from "~/shared/ui/RowList";
import { Section } from "~/shared/ui/Section";
import { useAnswerInvite } from "~/shell/useAnswerInvite";

/** Your open Invites at the top of Home: Join or Decline. Nothing when there are none. */
export function HomeInvites() {
	const invites = useMyInvites();
	const { answering, join, decline } = useAnswerInvite();

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
