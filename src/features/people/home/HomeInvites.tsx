import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PlaceLogo } from "~/components/PlaceLogo";
import { Row, RowList } from "~/components/RowList";
import { Section } from "~/components/Section";
import { Button } from "~/components/ui/button";
import { useInvites } from "~/shell/useInvites";

/** Your open Invites at the top of Home: Join or Decline. Nothing when there are none. */
export function HomeInvites() {
	const { invites, join, decline } = useInvites();
	const navigate = useNavigate();
	const [answering, setAnswering] = useState<Id<"invites"> | null>(null);

	if (!invites || invites.length === 0) {
		return null;
	}

	/** Disables the row's buttons while its answer is in flight. */
	async function answer(
		inviteId: Id<"invites">,
		action: () => Promise<boolean>,
	) {
		setAnswering(inviteId);
		try {
			return await action();
		} finally {
			setAnswering(null);
		}
	}

	return (
		<Section label="Invites">
			<RowList>
				{invites.map((invite) => (
					<Row
						key={invite.inviteId}
						leading={<PlaceLogo name={invite.startupName} url={null} />}
						title={
							invite.fromHackathon
								? `Hired at ${invite.startupName}`
								: `${invite.startupName} invited you`
						}
						trailing={
							<div className="flex items-center gap-2">
								<Button
									size="sm"
									variant="ghost"
									disabled={answering === invite.inviteId}
									onClick={() =>
										void answer(invite.inviteId, () => decline(invite.inviteId))
									}
								>
									Decline
								</Button>
								<Button
									size="sm"
									disabled={answering === invite.inviteId}
									onClick={async () => {
										if (
											await answer(invite.inviteId, () => join(invite.inviteId))
										) {
											await navigate({
												to: "/s/$slug/board",
												params: { slug: invite.slug },
											});
										}
									}}
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
