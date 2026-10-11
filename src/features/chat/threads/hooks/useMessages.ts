import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

export type MessageView = FunctionReturnType<
	typeof api.chat.messages.list
>["messages"][number];

/** A thread's latest messages (oldest first) and its pinned ones; sending, pinning and marking it read. */
export function useMessages(threadId: Id<"threads"> | undefined) {
	const result = useQuery(
		api.chat.messages.list,
		threadId ? { threadId } : "skip",
	);
	const sendMessage = useMutation(api.chat.messages.send);
	const pinMessage = useMutation(api.chat.messages.pin);
	const markThreadRead = useMutation(api.chat.threads.markRead);

	/** Resolves `false` when it wasn't sent (the error is toasted). */
	async function send(body: string, images: Id<"_storage">[]) {
		if (!threadId) return false;
		try {
			await sendMessage({ threadId, body, images });
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	}

	function markRead() {
		if (!threadId) return;
		markThreadRead({ threadId }).catch(() => {
			// Reading is best effort; the next message tries again.
		});
	}

	/** Founder only, in Everyone. */
	async function pin(messageId: MessageView["_id"], pinned: boolean) {
		try {
			await pinMessage({ messageId, pinned });
		} catch (error) {
			toast.error(errorMessage(error));
		}
	}

	return {
		messages: result?.messages,
		pinned: result?.pinned,
		send,
		pin,
		markRead,
	};
}
