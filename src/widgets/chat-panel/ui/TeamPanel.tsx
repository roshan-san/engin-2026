import { useCycle } from "~/entities/cycle";
import { useTeamThread } from "~/entities/message";
import { useWorkspace } from "~/entities/startup";
import { ThreadPanel } from "./ThreadPanel";

const SCOPE_HINT = "Post this week's scope here so everyone can start.";

/** The Startup's Team thread. */
export function TeamPanel({ onClose }: { readonly onClose?: () => void }) {
	const { startup, userId } = useWorkspace();
	const thread = useTeamThread(startup._id);
	const showsScopeHint = useCycle(startup._id)?.showsScopeHint ?? false;

	return (
		<ThreadPanel
			threadId={thread?._id}
			title="Team"
			userId={userId}
			placeholder="Message Team"
			emptyNote={
				showsScopeHint ? SCOPE_HINT : "Talk here. Mention a Card with #."
			}
			hint={showsScopeHint ? SCOPE_HINT : undefined}
			mentions={{ startupId: startup._id, slug: startup.slug }}
			onClose={onClose}
		/>
	);
}
