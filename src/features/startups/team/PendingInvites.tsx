import { useState } from "react";
import { Row, RowList } from "~/components/RowList";
import { Section } from "~/components/Section";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
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
								<RevokeButton invite={invite} onRevoke={onRevoke} />
							</div>
						}
					/>
				))}
			</RowList>
		</Section>
	);
}

function RevokeButton({
	invite,
	onRevoke,
}: {
	readonly invite: StartupInvite;
	readonly onRevoke: (invite: StartupInvite) => Promise<boolean>;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [isRevoking, setIsRevoking] = useState(false);

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				<Button variant="ghost" size="sm" className="text-muted-foreground">
					Revoke
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Revoke the invite for {invite.email}?
					</AlertDialogTitle>
					<AlertDialogDescription>
						They won't be able to join with it.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={isRevoking}
						onClick={async (event) => {
							event.preventDefault();
							setIsRevoking(true);
							if (await onRevoke(invite)) setIsOpen(false);
							setIsRevoking(false);
						}}
					>
						Revoke invite
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
