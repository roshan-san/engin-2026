import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { attempt } from "~/shared/lib/errors";

/** Sends to the thread. Resolves `false` when it wasn't sent (the error is toasted). */
export function useSendMessage(threadId: Id<"threads"> | undefined) {
	const sendMessage = useMutation(api.chat.messages.send);

	return async function send(body: string, images: Id<"_storage">[]) {
		if (!threadId) return false;
		return attempt(() => sendMessage({ threadId, body, images }));
	};
}
