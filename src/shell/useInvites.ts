import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/** Your open Invites, with Join and Decline. Failures are toasted and resolve `false`. */
export function useInvites() {
	const invites = useQuery(api.startups.invites.listMine, {});
	const acceptInvite = useMutation(api.startups.invites.accept);
	const declineInvite = useMutation(api.startups.invites.decline);

	async function run(action: () => Promise<unknown>) {
		try {
			await action();
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	}

	return {
		invites,
		join: (inviteId: Id<"invites">) => run(() => acceptInvite({ inviteId })),
		decline: (inviteId: Id<"invites">) =>
			run(() => declineInvite({ inviteId })),
	};
}
