import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "~/features/app/hooks/useWorkspace";
import {
	type InviteRole,
	inviteSchema,
} from "~/features/teams/team/schemas/invite";
import { toErrorMessage, validate } from "~/lib/validation";

export function inviteLink(token: string): string {
	return `${window.location.origin}/invite/${token}`;
}

export function useTeamInvites() {
	const { active: startup } = useWorkspace();
	const startupId = startup?.startup._id;
	const isFounder = startup?.role === "founder";

	const members = useQuery(
		api.teams.members.list,
		startupId ? { startupId } : "skip",
	);
	const invites = useQuery(
		api.teams.invitations.listInvites,
		startupId && isFounder ? { startupId } : "skip",
	);
	const createInvite = useMutation(api.teams.invitations.create);
	const revokeInvite = useMutation(api.teams.invitations.revoke);

	const [invitee, setInvitee] = useState("");
	const [role, setRole] = useState<InviteRole>("member");
	const [isPending, setIsPending] = useState(false);

	async function submitInvite(event: React.FormEvent) {
		event.preventDefault();
		if (!startupId) return;

		const parsed = validate(inviteSchema, { invitee, role });
		if (!parsed.ok) {
			toast.error(parsed.message);
			return;
		}

		setIsPending(true);
		try {
			await createInvite({ startupId, ...parsed.data });
			setInvitee("");
			toast.success(`Invite sent to ${parsed.data.invitee}`);
		} catch (error) {
			toast.error(toErrorMessage(error, "Failed to create invite"));
		} finally {
			setIsPending(false);
		}
	}

	async function revoke(inviteId: Id<"invites">) {
		try {
			await revokeInvite({ inviteId });
		} catch (error) {
			toast.error(toErrorMessage(error, "Failed to revoke invite"));
		}
	}

	async function copyLink(token: string) {
		try {
			await navigator.clipboard.writeText(inviteLink(token));
			toast.success("Invite link copied");
		} catch {
			toast.error("Could not copy the link");
		}
	}

	return {
		startup,
		isFounder,
		members,
		invites,
		invitee,
		setInvitee,
		role,
		setRole,
		isPending,
		submitInvite,
		revoke,
		copyLink,
	};
}
