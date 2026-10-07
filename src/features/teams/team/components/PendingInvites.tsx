import type { Id } from "@convex/_generated/dataModel";
import { Copy, Mail, X } from "lucide-react";
import { Row, RowList } from "~/components/shared/RowList";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Button } from "~/components/ui/button";
import type { InviteRole } from "~/features/teams/team/schemas/invite";

type PendingInvite = {
	_id: Id<"invites">;
	email: string;
	role: InviteRole;
	token: string;
	expiresAt: number;
};

type PendingInvitesProps = {
	readonly invites: PendingInvite[];
	readonly onRevoke: (inviteId: Id<"invites">) => void;
	readonly onCopyLink: (token: string) => void;
};

/** Invites sent and not yet accepted, one row each. */
export function PendingInvites({
	invites,
	onRevoke,
	onCopyLink,
}: PendingInvitesProps) {
	if (invites.length === 0) return null;

	return (
		<section className="space-y-1">
			<SectionLabel>Pending invites</SectionLabel>
			<RowList>
				{invites.map((invite) => (
					<Row
						key={invite._id}
						leading={
							<span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
								<Mail aria-hidden className="size-4" />
							</span>
						}
						title={invite.email}
						meta={`${invite.role === "founder" ? "Co-founder" : "Member"} · expires ${new Date(invite.expiresAt).toLocaleDateString()}`}
						trailing={
							<div className="flex items-center gap-1">
								<Button
									type="button"
									size="icon-sm"
									variant="ghost"
									aria-label="Copy link"
									title="Copy link"
									onClick={() => onCopyLink(invite.token)}
								>
									<Copy />
								</Button>
								<Button
									type="button"
									size="icon-sm"
									variant="ghost"
									aria-label="Revoke"
									title="Revoke"
									onClick={() => onRevoke(invite._id)}
								>
									<X />
								</Button>
							</div>
						}
					/>
				))}
			</RowList>
		</section>
	);
}
