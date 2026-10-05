import { Link } from "@tanstack/react-router";
import { PageLoading } from "~/components/globals/PageLoading";
import { InviteForm } from "~/features/teams/team/components/InviteForm";
import { MemberList } from "~/features/teams/team/components/MemberList";
import { useTeamInvites } from "~/features/teams/team/hooks/useTeamInvites";

/** Everyone on the Startup; Founders also invite, revoke and remove. */
export function TeamPage() {
	const team = useTeamInvites();
	const { plan } = team;

	return (
		<div className="mx-auto w-full max-w-3xl space-y-8">
			<h1 className="text-xl font-semibold">Team</h1>

			{team.members === undefined ? (
				<PageLoading rows={3} />
			) : (
				<MemberList
					members={team.members}
					onRemove={team.isFounder ? team.remove : undefined}
					removingId={team.removingId}
				/>
			)}

			{team.isFounder ? (
				<div className="space-y-3">
					{plan ? (
						<p className="text-sm text-muted-foreground">
							{plan.usage.members} of {plan.limits.members} member slots used on{" "}
							{plan.tier === "pro" ? "Pro" : "Free"}, counting pending invites
							and offers. Co-founders don't count.
							{plan.tier === "free" ? (
								<>
									{" "}
									<Link
										to="/pricing"
										className="font-medium text-foreground underline"
									>
										See Pro
									</Link>
								</>
							) : null}
						</p>
					) : null}
					<InviteForm
						invitee={team.invitee}
						onInviteeChange={team.setInvitee}
						role={team.role}
						onRoleChange={team.setRole}
						isPending={team.isPending}
						onSubmit={team.submitInvite}
						pendingInvites={team.invites ?? []}
						onRevoke={team.revoke}
						onCopyLink={team.copyLink}
					/>
				</div>
			) : null}
		</div>
	);
}
