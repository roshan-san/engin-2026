import { useEffect } from "react";
import { SectionLabel } from "~/components/shared/SectionLabel";
import { Skeleton } from "~/components/ui/skeleton";
import { useWorkspace } from "~/features/work/board/StartupContext";
import { Composer } from "./Composer";
import { useMessages } from "./hooks/useMessages";
import { useTeamThread } from "./hooks/useTeamThread";
import { MessageList } from "./MessageList";

/** The Team thread. It's mounted only while Threads is the visible panel. */
export function ThreadsPanel() {
	const { startup, userId } = useWorkspace();
	const thread = useTeamThread(startup._id);
	const { messages, send, markRead } = useMessages(thread?._id);
	const newestId = messages?.at(-1)?._id;

	// Read on opening, and again whenever a newer message lands while open.
	// biome-ignore lint/correctness/useExhaustiveDependencies: markRead only needs to run when the thread or newest message changes
	useEffect(() => {
		if (thread) markRead();
	}, [thread?._id, newestId]);

	if (!thread) {
		return (
			<div className="flex flex-col gap-3 p-4">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-16 w-full" />
			</div>
		);
	}

	return (
		<div data-testid="threads-panel" className="flex min-h-0 flex-1 flex-col">
			<div className="px-4 pt-3">
				<SectionLabel>Team</SectionLabel>
			</div>
			<MessageList messages={messages} userId={userId} />
			<Composer onSend={send} />
		</div>
	);
}
