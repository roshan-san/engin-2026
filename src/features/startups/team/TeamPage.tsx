import { XIcon } from "lucide-react";
import { useState } from "react";
import { DetailPanel } from "~/components/DetailPanel";
import { Page } from "~/components/Page";
import { PageBar } from "~/components/PageBar";
import { PanelHeader } from "~/components/PanelHeader";
import { Button } from "~/components/ui/button";
import { useWorkspace } from "~/features/work/board/StartupContext";
import { useIsMobile } from "~/lib/use-mobile";
import { InviteButton } from "./InviteButton";
import { PendingInvites } from "./PendingInvites";
import { PeopleList } from "./PeopleList";
import { StartupSettings } from "./StartupSettings";
import { useStartupInvites } from "./useStartupInvites";
import { useTeamPeople } from "./useTeamPeople";

/** The Team tab: people and pending Invites; the Founder's Startup Settings open in the detail panel. */
export function TeamPage() {
	const { startup, isFounder } = useWorkspace();
	const { people, remove } = useTeamPeople(startup._id);
	const { invites, send, revoke } = useStartupInvites(startup._id, isFounder);
	const isMobile = useIsMobile();
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const close = () => setIsSettingsOpen(false);

	return (
		<div className="flex h-full min-h-0">
			<div className="flex min-h-0 min-w-0 flex-1 flex-col">
				<PageBar
					title={<h1 className="text-sm font-medium">Team</h1>}
					actions={
						isFounder ? (
							<>
								<InviteButton onSend={send} />
								<Button
									variant="outline"
									size="sm"
									aria-pressed={isSettingsOpen}
									onClick={() => setIsSettingsOpen((isOpen) => !isOpen)}
								>
									Settings
								</Button>
							</>
						) : null
					}
				/>
				<div className="min-h-0 flex-1 overflow-y-auto">
					<Page width="narrow">
						<div className="flex flex-col gap-10">
							<PeopleList
								people={people}
								canRemove={isFounder}
								onRemove={(person) => remove(person._id)}
							/>
							{isFounder ? (
								<PendingInvites
									invites={invites}
									onRevoke={(invite) => revoke(invite.inviteId)}
								/>
							) : null}
						</div>
					</Page>
				</div>
			</div>

			{isFounder && isSettingsOpen && isMobile !== undefined ? (
				<DetailPanel
					shows={{ where: isMobile ? "sheet" : "side", what: "default" }}
					title="Startup settings"
					description="Name, logo and details."
					onClose={close}
					item={null}
					fallback={
						<div className="flex min-h-0 flex-1 flex-col">
							<PanelHeader>
								<h2 className="text-sm font-medium">Startup settings</h2>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Close"
									className="ml-auto"
									onClick={close}
								>
									<XIcon />
								</Button>
							</PanelHeader>
							<div className="min-h-0 flex-1 overflow-y-auto p-4">
								<StartupSettings />
							</div>
						</div>
					}
				/>
			) : null}
		</div>
	);
}
