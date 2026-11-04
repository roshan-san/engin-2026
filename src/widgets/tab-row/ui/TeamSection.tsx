import type { Id } from "@convex/_generated/dataModel";
import { teamSummary, useTeamPeople } from "~/entities/contributor";
import { useStartupInvites } from "~/entities/invite";
import {
	InviteButton,
	PendingInvites,
	useInviteActions,
} from "~/features/invite-contributor";
import { useRemoveContributor } from "~/features/remove-contributor";
import { useSetCoFounder } from "~/features/set-co-founder";
import { EmptyState } from "~/shared/ui/EmptyState";
import { PeopleList } from "./PeopleList";

/** The Team: people and, for Founders, invites and Remove; the Founder also makes Co-founders. */
export function TeamSection({
	startupId,
	isFounder,
	isOwner,
}: {
	readonly startupId: Id<"startups">;
	readonly isFounder: boolean;
	readonly isOwner: boolean;
}) {
	const people = useTeamPeople(startupId);
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
		</div>
	);
}
