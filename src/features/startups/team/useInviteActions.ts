import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { attempt } from "~/shared/lib/errors";

/** The Founder sends and revokes Invites to the Startup. Both resolve `true` once done; failures are toasted. */
export function useInviteActions(startupId: Id<"startups">) {
	const createInvite = useMutation(api.startups.invites.create);
	const revokeInvite = useMutation(api.startups.invites.revoke);

	async function send(email: string) {
		return attempt(async () => {
			await createInvite({ startupId, email });
			toast.success(
				`Invite created. Tell them to sign in with ${email.trim()}.`,
			);
		});
	}

	async function revoke(inviteId: Id<"invites">) {
		return attempt(async () => {
			await revokeInvite({ inviteId });
			toast.success("Invite revoked");
		});
	}

	return { send, revoke };
}
