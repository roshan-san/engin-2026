import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import type { MyInvite } from "~/entities/invite";
import { attempt } from "~/shared/lib/errors";

/**
 * Join and Decline for your Invites. `answering` is the Invite whose answer is in
 * flight. Join goes to the Startup's Board once it went through; a Decline that went
 * through says so. Failures are toasted.
 */
export function useAnswerInvite() {
	const acceptInvite = useMutation(api.invites.accept);
	const declineInvite = useMutation(api.invites.decline);
	const navigate = useNavigate();
	const [answering, setAnswering] = useState<Id<"invites"> | null>(null);

	async function answer(
		inviteId: Id<"invites">,
		action: () => Promise<unknown>,
	) {
		setAnswering(inviteId);
		const isAnswered = await attempt(action);
		setAnswering(null);
		return isAnswered;
	}

	return {
		answering,
		/** `onJoined` runs before the page moves, e.g. to close a popover. */
		join: async (invite: MyInvite, onJoined?: () => void) => {
			const { inviteId, slug } = invite;
			if (await answer(inviteId, () => acceptInvite({ inviteId }))) {
				onJoined?.();
				await navigate({ to: "/s/$slug/board", params: { slug } });
			}
		},
		decline: async (invite: MyInvite) => {
			const { inviteId, startupName } = invite;
			if (await answer(inviteId, () => declineInvite({ inviteId }))) {
				toast.success(`Declined ${startupName}'s invite`);
			}
		},
	};
}
