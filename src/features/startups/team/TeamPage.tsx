import { AppPage, PageTitle } from "~/components/AppPage";
import { EmptyState } from "~/components/EmptyState";
import { useWorkspace } from "~/features/work/StartupContext";
import { InviteButton } from "./InviteButton";
import { PendingInvites } from "./PendingInvites";
import { PeopleList } from "./PeopleList";
import { teamSummary } from "./teamSummary";
import { useStartupInvites } from "./useStartupInvites";
import { useTeamPeople } from "./useTeamPeople";

/** The Team tab: people and pending Invites. */
export function TeamPage() {
	const { startup, isFounder } = useWorkspace();
	const { people, remove } = useTeamPeople(startup._id);
	const { invites, send, revoke } = useStartupInvites(startup._id, isFounder);

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
