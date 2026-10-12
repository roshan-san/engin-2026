import { Page } from "~/components/Page";
import { PageHeader } from "~/components/PageHeader";
import { useWorkspace } from "~/features/work/board/StartupContext";
import { useStartupInvites } from "./useStartupInvites";
import { useTeamPeople } from "./useTeamPeople";
import { InviteForm } from "./InviteForm";
import { PeopleList } from "./PeopleList";
import { StartupSettings } from "./StartupSettings";

/** The Team tab: people and Invites, with the Founder's startup settings beside them. */
export function TeamPage() {
	const { startup, isFounder } = useWorkspace();
	const { people, remove } = useTeamPeople(startup._id);
	const { invites, send, revoke } = useStartupInvites(startup._id, isFounder);

	const left = (
		<div className="flex min-w-0 flex-col gap-10">
			<PeopleList
				people={people}
				canRemove={isFounder}
				onRemove={(person) => remove(person._id)}
			/>
			{isFounder ? (
				<InviteForm
					invites={invites}
					onSend={send}
					onRevoke={(invite) => revoke(invite.inviteId)}
				/>
			) : null}
		</div>
	);

	return (
		<>
			<PageHeader title="Team" />
			<Page>
				{isFounder ? (
					<div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-12">
						{left}
						<aside className="lg:sticky lg:top-6">
							<StartupSettings />
						</aside>
					</div>
				) : (
					<div className="max-w-3xl">{left}</div>
				)}
			</Page>
		</>
	);
}
