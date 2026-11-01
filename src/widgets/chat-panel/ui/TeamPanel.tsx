import { useTeamThread } from "~/entities/message";
import { useWorkspace } from "~/entities/startup";
import { ThreadPanel } from "./ThreadPanel";

/** The Startup's Team thread. */
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
			onClose={onClose}
		/>
	);
}
