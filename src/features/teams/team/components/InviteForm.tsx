import type { Id } from "@convex/_generated/dataModel";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	INVITE_ROLES,
	type InviteRole,
} from "~/features/teams/team/schemas/invite";

type PendingInvite = {
	_id: Id<"invites">;
	email: string;
	role: InviteRole;
	token: string;
	expiresAt: number;
};

type InviteFormProps = {
	readonly invitee: string;
	readonly onInviteeChange: (value: string) => void;
	readonly role: InviteRole;
	readonly onRoleChange: (value: InviteRole) => void;
	readonly isPending: boolean;
	readonly onSubmit: (event: React.FormEvent) => void;
	readonly pendingInvites: PendingInvite[];
	readonly onRevoke: (inviteId: Id<"invites">) => void;
	readonly onCopyLink: (token: string) => void;
};

export function InviteForm({
	invitee,
	onInviteeChange,
	role,
	onRoleChange,
	isPending,
	onSubmit,
	pendingInvites,
	onRevoke,
	onCopyLink,
}: InviteFormProps) {
	return (
		<section className="space-y-4">
			<div>
				<h2 className="text-sm font-medium text-muted-foreground">Invite</h2>
				<p className="text-sm text-muted-foreground">
					By username or email. People without an account see the invite when
					they sign up with that email.
				</p>
			</div>
			<form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
				<Input
					required
					value={invitee}
					onChange={(event) => onInviteeChange(event.target.value)}
					placeholder="@username or teammate@email.com"
					className="h-11 flex-1"
				/>
				<select
					aria-label="Invite as"
					value={role}
					onChange={(event) => onRoleChange(event.target.value as InviteRole)}
					className="border-input h-11 rounded-md border bg-transparent px-3 text-sm"
				>
					{INVITE_ROLES.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<Button type="submit" disabled={isPending} className="h-11">
					{isPending ? "Sending…" : "Send invite"}
				</Button>
			</form>
			{pendingInvites.length > 0 ? (
				<ul className="space-y-2">
					{pendingInvites.map((invite) => (
						<li
							key={invite._id}
							className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3 text-sm sm:flex-row sm:items-center"
						>
							<span className="min-w-0 flex-1 truncate">
								{invite.email}
								<span className="ml-2 text-muted-foreground">
									{invite.role === "founder" ? "co-founder" : "member"} ·
									expires {new Date(invite.expiresAt).toLocaleDateString()}
								</span>
							</span>
							<div className="flex gap-2">
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => onCopyLink(invite.token)}
								>
									Copy link
								</Button>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									onClick={() => onRevoke(invite._id)}
								>
									Revoke
								</Button>
							</div>
						</li>
					))}
				</ul>
			) : null}
		</section>
	);
}
