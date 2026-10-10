import { XIcon } from "lucide-react";
import { useEffect } from "react";
import { PanelHeader } from "~/components/shared/PanelHeader";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useWorkspace } from "~/features/work/board/StartupContext";
import { Composer } from "./Composer";
import { useMessages } from "./hooks/useMessages";
import { useTeamThread } from "./hooks/useTeamThread";
import { MessageList } from "./MessageList";
import { PresenceList } from "./PresenceList";

/** The Team thread. It's mounted only while Threads is the visible panel. */
export function ThreadsPanel({
	onClose,
}: {
	/** On a phone, closes the sheet the panel sits in. */
	readonly onClose?: () => void;
}) {
	const { startup, userId } = useWorkspace();
	const thread = useTeamThread(startup._id);
	const { messages, send, markRead } = useMessages(thread?._id);
	const newestId = messages?.at(-1)?._id;

	// Read on opening, and again whenever a newer message lands while open.
	// biome-ignore lint/correctness/useExhaustiveDependencies: markRead only needs to run when the thread or newest message changes
	useEffect(() => {
		if (thread) markRead();
	}, [thread?._id, newestId]);

	return (
		<div data-testid="threads-panel" className="flex min-h-0 flex-1 flex-col">
			<PanelHeader>
				<h2 className="text-sm font-medium">Team</h2>
				<div className="ml-auto flex items-center gap-2">
					<PresenceList />
					{onClose ? (
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Close"
							onClick={onClose}
						>
							<XIcon />
						</Button>
					) : null}
				</div>
			</PanelHeader>
			{thread ? (
				<>
					<MessageList messages={messages} userId={userId} />
					<Composer onSend={send} />
				</>
			) : (
				<div className="flex flex-col gap-3 p-4">
					<Skeleton className="h-10 w-3/4" />
					<Skeleton className="h-10 w-1/2" />
				</div>
			)}
		</div>
	);
}
