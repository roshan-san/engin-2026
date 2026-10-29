import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";

export type MessageView = FunctionReturnType<
	typeof api.chat.messages.list
>["messages"][number];

/** A thread's latest messages (oldest first) and its pinned ones, and marking it read. */
export function useMessages(threadId: Id<"threads"> | undefined) {
	const result = useQuery(
		api.chat.messages.list,
		threadId ? { threadId } : "skip",
	);
	const markThreadRead = useMutation(api.chat.threads.markRead);

	function markRead() {
		if (!threadId) return;
		markThreadRead({ threadId }).catch(() => {
			// Reading is best effort; the next message tries again.
		});
	}

	return { messages: result?.messages, pinned: result?.pinned, markRead };
}
