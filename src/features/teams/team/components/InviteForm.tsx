import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	INVITE_ROLES,
	type InviteRole,
} from "~/features/teams/team/schemas/invite";

type InviteFormProps = {
	readonly invitee: string;
	readonly onInviteeChange: (value: string) => void;
	readonly role: InviteRole;
	readonly onRoleChange: (value: InviteRole) => void;
	readonly isPending: boolean;
	readonly onSubmit: (event: React.FormEvent) => void;
};

export function InviteForm({
	invitee,
	onInviteeChange,
	role,
	onRoleChange,
	isPending,
	onSubmit,
}: InviteFormProps) {
	return (
		<form onSubmit={onSubmit} className="space-y-2">
			<div className="flex flex-col gap-2 sm:flex-row">
				<Input
					required
					value={invitee}
					onChange={(event) => onInviteeChange(event.target.value)}
					placeholder="@username or teammate@email.com"
					className="flex-1"
				/>
				<select
					aria-label="Invite as"
					value={role}
					onChange={(event) => onRoleChange(event.target.value as InviteRole)}
					className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
				>
					{INVITE_ROLES.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<Button type="submit" disabled={isPending}>
					{isPending ? "Sending…" : "Send invite"}
				</Button>
			</div>
			<p className="text-xs text-muted-foreground">
				By username or email. People without an account see the invite when they
				sign up with that email.
			</p>
		</form>
	);
}
