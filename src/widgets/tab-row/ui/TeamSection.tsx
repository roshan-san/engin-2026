import type { Id } from "@convex/_generated/dataModel";
import { teamSummary, useTeamPeople } from "~/entities/contributor";
import { useStartupInvites } from "~/entities/invite";
import {
	InviteButton,
	PendingInvites,
	useInviteActions,
} from "~/features/invite-contributor";
import { useLeaveStartup } from "~/features/leave-startup";
import { useRemoveContributor } from "~/features/remove-contributor";
import { useSetCoFounder } from "~/features/set-co-founder";
import { ConfirmButton } from "~/shared/ui/ConfirmButton";
import { EmptyState } from "~/shared/ui/EmptyState";
import { PeopleList } from "./PeopleList";

/** The Team: people and, for Founders, invites and Remove; the Founder also makes Co-founders. Everyone else can leave. */
export function TeamSection({
	startupId,
	startupName,
	isFounder,
	isOwner,
}: {
	readonly startupId: Id<"startups">;
	readonly startupName: string;
	readonly isFounder: boolean;
	readonly isOwner: boolean;
}) {
	const people = useTeamPeople(startupId);
	const leave = useLeaveStartup(startupId, startupName);
	const remove = useRemoveContributor(startupId);
	const setCoFounder = useSetCoFounder(startupId);
	const invites = useStartupInvites(startupId, isFounder);
	const { send, revoke } = useInviteActions(startupId);

	return (
		<div className="flex flex-col gap-4">
			{people ? (
				<p className="text-sm text-muted-foreground">
					{teamSummary(
						(people.founder ? 1 : 0) + people.contributors.length,
						isFounder ? invites?.length : undefined,
					)}
				</p>
			) : null}
			<PeopleList
				startupId={startupId}
				people={people}
				canRemove={isFounder}
				onRemove={remove}
				onSetCoFounder={isOwner ? setCoFounder : undefined}
			/>
			{isFounder ? (
				<>
					{people && people.contributors.length === 0 ? (
						<EmptyState
							size="compact"
							title="Invite your first Contributor"
							action={<InviteButton onSend={send} />}
						/>
					) : (
						<InviteButton onSend={send} />
					)}
					<PendingInvites
						invites={invites}
						onRevoke={(invite) => revoke(invite.inviteId)}
					/>
				</>
			) : null}
			{isOwner ? null : (
				<div>
					<ConfirmButton
						label={`Leave ${startupName}`}
						title={`Leave ${startupName}?`}
						description="You'll lose the Board and the team's threads. The Founder can invite you back."
						actionLabel="Leave"
						onConfirm={leave}
					/>
				</div>
			)}
		</div>
	);
}
