import { Page } from "~/components/shared/Page";
import { PageLoading } from "~/components/globals/PageLoading";
import { EmptyState } from "~/components/shared/EmptyState";
import { PageHeader } from "~/components/shared/PageHeader";
import { SectionLabel } from "~/components/shared/SectionLabel";
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
			<>
				<PageHeader title="Inbox" />
				<Page className="space-y-6">
					<PageLoading rows={4} />
				</Page>
			</>
		);
	}

	const isEmpty =
		inbox.waiting.length === 0 && inbox.notifications.length === 0;

	return (
		<>
			<PageHeader
				width="wide"
				title="Inbox"
				actions={
					inbox.unreadCount > 0 ? (
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() => void inbox.readAll()}
						>
							Mark all read
						</Button>
					) : null
				}
			/>
			<Page className="space-y-6">
				{isEmpty ? (
					<EmptyState
						title="Nothing here yet"
						body="Invites, Offers and notifications show up here."
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
					<section className="space-y-2">
						<SectionLabel>Notifications</SectionLabel>
						<NotificationList
							notifications={inbox.notifications}
							onRead={(id) => void inbox.read(id)}
						/>
					</section>
				) : null}
			</Page>
		</>
	);
}
