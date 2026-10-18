import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

type Invite = FunctionReturnType<typeof api.startups.invites.listMine>[number];

/** How an Invite is named: a hire from a Hackathon, or a plain invite. */
export function inviteTitle(invite: Invite): string {
	return invite.fromHackathon
		? `Hired at ${invite.startupName}`
		: `${invite.startupName} invited you`;
}

/**
 * Your open Invites, with Join and Decline. `answering` is the Invite whose answer is in
 * flight. Join goes to the Startup's Board once it went through; a Decline that went
 * through says so. Failures are toasted.
 */
export function useInvites() {
	const invites = useQuery(api.startups.invites.listMine, {});
	const acceptInvite = useMutation(api.startups.invites.accept);
	const declineInvite = useMutation(api.startups.invites.decline);
	const navigate = useNavigate();
	const [answering, setAnswering] = useState<Id<"invites"> | null>(null);

	async function answer(
		inviteId: Id<"invites">,
		action: () => Promise<unknown>,
	) {
		setAnswering(inviteId);
		try {
			await action();
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		} finally {
			setAnswering(null);
		}
	}

	return {
		invites,
		answering,
		/** `onJoined` runs before the page moves, e.g. to close a popover. */
		join: async (invite: Invite, onJoined?: () => void) => {
			const { inviteId, slug } = invite;
			if (await answer(inviteId, () => acceptInvite({ inviteId }))) {
				onJoined?.();
				await navigate({ to: "/s/$slug/board", params: { slug } });
			}
		},
		decline: async (invite: Invite) => {
			const { inviteId, startupName } = invite;
			if (await answer(inviteId, () => declineInvite({ inviteId }))) {
				toast.success(`Declined ${startupName}'s invite`);
			}
		},
	};
}
