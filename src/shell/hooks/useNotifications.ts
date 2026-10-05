import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { toErrorMessage } from "~/lib/validation";

/** Above this the Inbox badge reads "99+". */
const MAX_BADGE_COUNT = 99;

/**
 * Everything addressed to the signed-in user: live invites, the notification
 * feed and its read state. `count` (unread + invites + pending offers) feeds
 * the Inbox badge.
 */
export function useNotifications() {
	const invites = useQuery(api.teams.invitations.listMine);
	const feed = useQuery(api.people.notifications.list);
	const offers = useQuery(api.hiring.offers.listMine, {});
	const acceptInvite = useMutation(api.teams.invitations.acceptById);
	const declineInvite = useMutation(api.teams.invitations.decline);
	const markRead = useMutation(api.people.notifications.markRead);
	const markAllRead = useMutation(api.people.notifications.markAllRead);
	const [acceptingId, setAcceptingId] = useState<Id<"invites"> | null>(null);

	const count =
		(invites?.length ?? 0) +
		(feed?.unreadCount ?? 0) +
		(offers?.filter((offer) => offer.status === "pending").length ?? 0);
	const countLabel =
		count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : String(count);

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
			toast.success("Invite declined");
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

	async function readAll() {
		try {
			await markAllRead({});
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not mark all as read"));
		}
	}

	return {
		invites,
		notifications: feed?.notifications,
		unreadCount: feed?.unreadCount ?? 0,
		count,
		countLabel,
		isLoading:
			invites === undefined || feed === undefined || offers === undefined,
		acceptingId,
		accept,
		decline,
		read,
		readAll,
	};
}
