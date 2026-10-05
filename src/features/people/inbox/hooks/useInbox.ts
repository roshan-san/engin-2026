import type { Id } from "@convex/_generated/dataModel";
import { useOffers } from "~/features/hiring/offers/hooks/useOffers";
import { useRespondToOffer } from "~/features/hiring/offers/hooks/useRespondToOffer";
import { useNotifications } from "~/shell/hooks/useNotifications";

/** Something addressed to the user that waits on their answer. */
export type WaitingItem =
	| {
			kind: "invite";
			id: Id<"invites">;
			createdAt: number;
			startupName: string;
			inviterName: string;
			role: "founder" | "member";
			token: string;
	  }
	| {
			kind: "offer";
			id: Id<"offers">;
			createdAt: number;
			startupName: string;
			roleTitle: string;
			href: string | null;
	  };

/** The Inbox: invites and offers to answer (newest first), then notifications. */
export function useInbox() {
	const notifications = useNotifications();
	const { offers, pending } = useOffers();
	const offerActions = useRespondToOffer();

	const waiting: WaitingItem[] | undefined =
		notifications.invites === undefined || offers === undefined
			? undefined
			: [
					...notifications.invites.map(
						(invite): WaitingItem => ({
							kind: "invite",
							id: invite._id,
							createdAt: invite.createdAt,
							startupName: invite.startupName,
							inviterName: invite.inviterName,
							role: invite.role,
							token: invite.token,
						}),
					),
					...pending.map(
						(offer): WaitingItem => ({
							kind: "offer",
							id: offer._id,
							createdAt: offer.createdAt,
							startupName: offer.startupName,
							roleTitle: offer.roleTitle,
							href: offer.href,
						}),
					),
				].sort((a, b) => b.createdAt - a.createdAt);

	return {
		waiting,
		notifications: notifications.notifications,
		unreadCount: notifications.unreadCount,
		isLoading: notifications.isLoading,
		isBusy:
			notifications.acceptingId !== null || offerActions.pendingId !== null,
		acceptInvite: notifications.accept,
		declineInvite: notifications.decline,
		acceptOffer: offerActions.accept,
		declineOffer: offerActions.decline,
		read: notifications.read,
		readAll: notifications.readAll,
	};
}
