import { PeopleList, teamSummary, useTeamPeople } from "~/entities/contributor";
import { PendingInvites, useStartupInvites } from "~/entities/invite";
import { useWorkspace } from "~/entities/startup";
import { AppPage, PageTitle } from "~/shared/ui/AppPage";
import { EmptyState } from "~/shared/ui/EmptyState";
import { InviteButton } from "./InviteButton";
import { useInviteActions } from "./useInviteActions";
import { useRemoveContributor } from "./useRemoveContributor";

/** The Team tab: people and pending Invites. */
export function TeamPage() {
	const { startup, isFounder } = useWorkspace();
	const people = useTeamPeople(startup._id);
	const remove = useRemoveContributor(startup._id);
	const invites = useStartupInvites(startup._id, isFounder);
	const { send, revoke } = useInviteActions(startup._id);

	return (
		<AppPage
			bar={{
				title: (
					<PageTitle
						name="Team"
						context={
							people
								? teamSummary(
										(people.founder ? 1 : 0) + people.contributors.length,
										isFounder ? invites?.length : undefined,
									)
								: null
						}
					/>
				),
				actions: isFounder ? <InviteButton onSend={send} /> : null,
			}}
		>
			<PeopleList people={people} canRemove={isFounder} onRemove={remove} />
			{isFounder && people && people.contributors.length === 0 ? (
				<EmptyState
					size="compact"
					title="Invite your first Contributor"
					action={<InviteButton onSend={send} />}
				/>
			) : null}
			{isFounder ? (
				<PendingInvites
					invites={invites}
					onRevoke={(invite) => revoke(invite.inviteId)}
				/>
			) : null}
		</AppPage>
	);
}
