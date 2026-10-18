import { ConfirmButton } from "~/components/ConfirmButton";
import { Row, RowList } from "~/components/RowList";
import { Section } from "~/components/Section";
import { Badge } from "~/components/ui/badge";
import { dayLabel } from "~/lib/dates";
import type { StartupInvite } from "./useStartupInvites";

/** The Founder's pending Invites, each with Revoke. Nothing shows while there are none. */
export function PendingInvites({
	invites,
	onRevoke,
}: {
	readonly invites: StartupInvite[] | undefined;
	/** Resolves `true` once revoked (the error is shown already otherwise). */
	readonly onRevoke: (invite: StartupInvite) => Promise<boolean>;
}) {
	if (!invites || invites.length === 0) return null;

	return (
		<Section label="Invites">
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
								<ConfirmButton
									label="Revoke"
									title={`Revoke the invite for ${invite.email}?`}
									description="They won't be able to join with it."
									actionLabel="Revoke invite"
									onConfirm={() => onRevoke(invite)}
								/>
							</div>
						}
					/>
				))}
			</RowList>
		</Section>
	);
}
