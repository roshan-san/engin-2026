import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "~/features/app/hooks/useWorkspace";
import { inviteSchema } from "~/features/team/schemas/invite";
import { toErrorMessage, validate } from "~/lib/validation";

export function useTeamInvites() {
	const { active: startup } = useWorkspace();
	const startupId = startup?.startup._id;

	const members = useQuery(
		api.members.list,
		startupId ? { startupId } : "skip",
	);
	const invites = useQuery(
		api.invitations.listInvites,
		startupId ? { startupId } : "skip",
	);
	const createInvite = useMutation(api.invitations.create);
	const revokeInvite = useMutation(api.invitations.revoke);

	const [email, setEmail] = useState("");
	const [isPending, setIsPending] = useState(false);

	async function submitInvite(event: React.FormEvent) {
		event.preventDefault();
		if (!startupId) return;

		const parsed = validate(inviteSchema, { email, role: "member" });
		if (!parsed.ok) {
			toast.error(parsed.message);
			return;
		}

		setIsPending(true);
		try {
			await createInvite({ startupId, ...parsed.data });
			setEmail("");
			toast.success(`Invite sent to ${parsed.data.email}`);
		} catch (error) {
			toast.error(toErrorMessage(error, "Failed to create invite"));
		} finally {
			setIsPending(false);
		}
	}

	return {
		startup,
		members,
		invites,
		email,
		setEmail,
		isPending,
		submitInvite,
		revokeInvite,
	};
}
