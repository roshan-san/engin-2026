import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { BuildFrame } from "~/features/app/layout/BuildFrame";
import { InviteForm } from "~/features/teams/team/components/InviteForm";
import { MemberList } from "~/features/teams/team/components/MemberList";
import { useTeamInvites } from "~/features/teams/team/hooks/useTeamInvites";

export function TeamPage() {
	return (
		<BuildFrame>
			<TeamView />
		</BuildFrame>
	);
}

function TeamView() {
	const team = useTeamInvites();
	const { startup, members, invites, isFounder } = team;

	if (!startup) {
		return null;
	}

	const pendingInvites = invites?.filter(
		(invite) => invite.status === "pending",
	);

	return (
		<div className="space-y-10">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-2">
					<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
						Team
					</h1>
					<p className="text-muted-foreground">
						People already inside {startup.startup.name}.
					</p>
				</div>
				<Button asChild variant="outline">
					<Link to="/startup/$slug" params={{ slug: startup.startup.slug }}>
						Public page
					</Link>
				</Button>
			</div>

			<MemberList members={members ?? []} />

			{isFounder ? (
				<InviteForm
					invitee={team.invitee}
					onInviteeChange={team.setInvitee}
					role={team.role}
					onRoleChange={team.setRole}
					isPending={team.isPending}
					onSubmit={team.submitInvite}
					pendingInvites={pendingInvites ?? []}
					onRevoke={(inviteId) => void team.revoke(inviteId)}
					onCopyLink={(token) => void team.copyLink(token)}
				/>
			) : null}
		</div>
	);
}
