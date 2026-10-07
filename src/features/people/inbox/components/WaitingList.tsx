import type { Id } from "@convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { DeclineOfferDialog } from "~/features/hiring/offers/components/DeclineOfferDialog";
import type { WaitingItem } from "~/features/people/inbox/hooks/useInbox";
import { formatDate, formatRelativeTime } from "~/lib/dates";

type WaitingListProps = {
	readonly items: WaitingItem[];
	readonly isBusy: boolean;
	readonly onAcceptInvite: (id: Id<"invites">) => void;
	readonly onDeclineInvite: (id: Id<"invites">) => void;
	readonly onAcceptOffer: (id: Id<"offers">) => void;
	readonly onDeclineOffer: (id: Id<"offers">) => Promise<boolean>;
};

type Declining = { id: Id<"offers">; startupName: string };

/** Invites and Offers the user answers right here, newest first. */
export function WaitingList({
	items,
	isBusy,
	onAcceptInvite,
	onDeclineInvite,
	onAcceptOffer,
	onDeclineOffer,
}: WaitingListProps) {
	const [declining, setDeclining] = useState<Declining | null>(null);

	async function confirmDecline() {
		if (declining && (await onDeclineOffer(declining.id))) {
			setDeclining(null);
		}
	}

	return (
		<section className="space-y-3">
			<h2 className="text-sm font-medium text-muted-foreground">
				Waiting on you
			</h2>
			<ul className="space-y-2">
				{items.map((item) => (
					<li
						key={item.id}
						className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center"
					>
						<div className="min-w-0 flex-1 space-y-1">
							{item.kind === "invite" ? (
								<p className="break-words">
									<span className="font-medium">{item.inviterName}</span>{" "}
									invited you to{" "}
									<Link
										to="/invite/$token"
										params={{ token: item.token }}
										className="font-medium underline-offset-4 hover:underline"
									>
										{item.startupName}
									</Link>{" "}
									as {item.role === "founder" ? "a co-founder" : "a member"}.
								</p>
							) : (
								<p className="break-words">
									<span className="font-medium">{item.startupName}</span>{" "}
									offered you the {item.roleTitle} Role.{" "}
									{item.href ? (
										<Link
											to={item.href}
											className="text-sm text-muted-foreground underline underline-offset-4"
										>
											See the Hackathon
										</Link>
									) : null}
								</p>
							)}
							<time
								dateTime={new Date(item.createdAt).toISOString()}
								title={formatDate(item.createdAt)}
								className="text-xs text-muted-foreground"
							>
								{item.kind === "invite" ? "Invite" : "Offer"} ·{" "}
								{formatRelativeTime(item.createdAt)}
							</time>
						</div>
						<div className="flex gap-2">
							<Button
								type="button"
								size="sm"
								disabled={isBusy}
								onClick={() =>
									item.kind === "invite"
										? onAcceptInvite(item.id)
										: onAcceptOffer(item.id)
								}
							>
								Accept
							</Button>
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={isBusy}
								onClick={() =>
									item.kind === "invite"
										? onDeclineInvite(item.id)
										: setDeclining({
												id: item.id,
												startupName: item.startupName,
											})
								}
							>
								Decline
							</Button>
						</div>
					</li>
				))}
			</ul>

			<DeclineOfferDialog
				startupName={declining?.startupName ?? null}
				isPending={isBusy}
				onCancel={() => setDeclining(null)}
				onConfirm={() => void confirmDecline()}
			/>
		</section>
	);
}
