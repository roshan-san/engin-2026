import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { attempt } from "~/shared/lib/errors";

/** Adds and removes conversations; each resolves whether it worked and toasts the error instead of throwing. */
export function useConversationActions(startupId: Id<"startups">) {
	const addLine = useMutation(api.conversations.add);
	const removeLine = useMutation(api.conversations.remove);

	return {
		add: (line: string): Promise<boolean> =>
			attempt(() => addLine({ startupId, line })),
		remove: (conversationId: Id<"conversations">): Promise<boolean> =>
			attempt(() => removeLine({ conversationId })),
	};
}
