import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { attempt } from "~/shared/lib/errors";

/** Pins or unpins a message. Founder only, in Everyone. */
export function usePinMessage() {
	const pinMessage = useMutation(api.messages.pin);

	return async function pin(messageId: Id<"messages">, pinned: boolean) {
		await attempt(() => pinMessage({ messageId, pinned }));
	};
}
