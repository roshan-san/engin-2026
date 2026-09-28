import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

export function useNotifications() {
	const invites = useQuery(api.teams.invitations.listMine);
	const feed = useQuery(api.notifications.list);
	const acceptInvite = useMutation(api.teams.invitations.acceptById);
	const declineInvite = useMutation(api.teams.invitations.decline);
	const markRead = useMutation(api.notifications.markRead);
	const [acceptingId, setAcceptingId] = useState<Id<"invites"> | null>(null);

	const count = (invites?.length ?? 0) + (feed?.unreadCount ?? 0);

	async function accept(inviteId: Id<"invites">) {
		setAcceptingId(inviteId);
		try {
			await acceptInvite({ inviteId });
			toast.success("Invite accepted — switched to that startup");
		} catch (error) {
			toast.error(toErrorMessage(error, "Failed to accept invite"));
		} finally {
			setAcceptingId(null);
		}
	}

	async function decline(inviteId: Id<"invites">) {
		setAcceptingId(inviteId);
		try {
			await declineInvite({ inviteId });
		} catch (error) {
			toast.error(toErrorMessage(error, "Failed to decline invite"));
		} finally {
			setAcceptingId(null);
		}
	}

	async function read(notificationId: Id<"notifications">) {
		try {
			await markRead({ notificationId });
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not mark as read"));
		}
	}

	return {
		invites,
		notifications: feed?.notifications,
		count,
		isLoading: invites === undefined || feed === undefined,
		acceptingId,
		accept,
		decline,
		read,
	};
}
