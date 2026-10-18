import { useWorkspace } from "~/features/work/StartupContext";
import { PresenceList } from "./PresenceList";
import { ThreadPanel } from "./ThreadPanel";
import { useTeamThread } from "./useTeamThread";

/** The Startup's Team thread, with who's online. */
export function TeamPanel({ onClose }: { readonly onClose?: () => void }) {
	const { startup, userId } = useWorkspace();
	const thread = useTeamThread(startup._id);

	return (
		<ThreadPanel
			threadId={thread?._id}
			title="Team"
			userId={userId}
			placeholder="Message Team"
			emptyNote="Talk here. Mention a Card with #."
			mentions={{ startupId: startup._id, slug: startup.slug }}
			actions={
				<PresenceList
					startupId={startup._id}
					slug={startup.slug}
					userId={userId}
				/>
			}
			onClose={onClose}
		/>
	);
}
