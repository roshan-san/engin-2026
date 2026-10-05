import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import {
	type InviteRole,
	inviteSchema,
} from "~/features/teams/team/schemas/invite";
import { toErrorMessage, validate } from "~/lib/validation";
import { useStartupRoute } from "~/shell/startup/StartupRoute";

export function inviteLink(token: string): string {
	return `${window.location.origin}/invite/${token}`;
}

/** The Team screen: members, live pending Invites and the Founder's actions. */
export function useTeamInvites() {
	const { member: startup } = useStartupRoute();
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
	const removeMember = useMutation(api.teams.members.remove);

	const [invitee, setInvitee] = useState("");
	const [role, setRole] = useState<InviteRole>("member");
	const [isPending, setIsPending] = useState(false);
	const [removingId, setRemovingId] = useState<Id<"memberships"> | null>(null);

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

	async function remove(membershipId: Id<"memberships">): Promise<boolean> {
		setRemovingId(membershipId);
		try {
			await removeMember({ membershipId });
			toast.success("Removed from the team");
			return true;
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not remove member"));
			return false;
		} finally {
			setRemovingId(null);
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
		plan: startup?.plan ?? null,
		isFounder,
		members,
		invites,
		invitee,
		setInvitee,
		role,
		setRole,
		isPending,
		removingId,
		submitInvite,
		revoke,
		remove,
		copyLink,
	};
}
