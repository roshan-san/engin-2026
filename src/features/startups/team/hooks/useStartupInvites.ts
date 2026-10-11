import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { toast } from "sonner";
import { errorMessage } from "~/lib/errors";

/**
 * The Founder's pending Invites for the Startup, sending and revoking them.
 * The list is Founder-only on the server, so a Contributor skips it.
 */
export function useStartupInvites(
	startupId: Id<"startups">,
	isFounder: boolean,
) {
	const invites = useQuery(
		api.startups.invites.list,
		isFounder ? { startupId } : "skip",
	);
	const createInvite = useMutation(api.startups.invites.create);
	const revokeInvite = useMutation(api.startups.invites.revoke);

	/** Resolves `true` once sent; failures are toasted. */
	async function send(email: string) {
		try {
			await createInvite({ startupId, email });
			toast.success("Invite sent");
			return true;
		} catch (error) {
			toast.error(errorMessage(error));
			return false;
		}
	}

	async function revoke(inviteId: Id<"invites">) {
		try {
			await revokeInvite({ inviteId });
		} catch (error) {
			toast.error(errorMessage(error));
		}
	}

	return { invites, send, revoke };
}

export type StartupInvite = NonNullable<
	FunctionReturnType<typeof api.startups.invites.list>
>[number];
