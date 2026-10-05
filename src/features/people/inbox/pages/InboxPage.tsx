import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { Button } from "~/components/ui/button";
import { NotificationList } from "~/features/people/inbox/components/NotificationList";
import { WaitingList } from "~/features/people/inbox/components/WaitingList";
import { useInbox } from "~/features/people/inbox/hooks/useInbox";

/** Everything addressed to the user: invites and offers to answer, then notifications. */
export function InboxPage() {
	const inbox = useInbox();

	if (
		inbox.isLoading ||
		inbox.waiting === undefined ||
		inbox.notifications === undefined
	) {
		return (
			<div className="mx-auto w-full max-w-3xl space-y-6">
				<h1 className="text-xl font-semibold">Inbox</h1>
				<PageLoading rows={4} />
			</div>
		);
	}

	const isEmpty =
		inbox.waiting.length === 0 && inbox.notifications.length === 0;

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6">
			<h1 className="text-xl font-semibold">Inbox</h1>
			{isEmpty ? (
				<EmptyState
					title="Nothing here yet"
					description="Invites, Offers and notifications show up here."
				/>
			) : null}
			{inbox.waiting.length > 0 ? (
				<WaitingList
					items={inbox.waiting}
					isBusy={inbox.isBusy}
					onAcceptInvite={(id) => void inbox.acceptInvite(id)}
					onDeclineInvite={(id) => void inbox.declineInvite(id)}
					onAcceptOffer={(id) => void inbox.acceptOffer(id)}
					onDeclineOffer={inbox.declineOffer}
				/>
			) : null}
			{inbox.notifications.length > 0 ? (
				<section className="space-y-3">
					<div className="flex items-center justify-between gap-2">
						<h2 className="text-sm font-medium text-muted-foreground">
							Notifications
							{inbox.unreadCount > 0 ? ` · ${inbox.unreadCount} unread` : ""}
						</h2>
						{inbox.unreadCount > 0 ? (
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => void inbox.readAll()}
							>
								Mark all read
							</Button>
						) : null}
					</div>
					<NotificationList
						notifications={inbox.notifications}
						onRead={(id) => void inbox.read(id)}
					/>
				</section>
			) : null}
		</div>
	);
}
