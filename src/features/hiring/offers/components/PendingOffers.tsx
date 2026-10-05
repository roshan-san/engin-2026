import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { DeclineOfferDialog } from "~/features/hiring/offers/components/DeclineOfferDialog";
import { useOffers } from "~/features/hiring/offers/hooks/useOffers";
import { useRespondToOffer } from "~/features/hiring/offers/hooks/useRespondToOffer";

type Declining = { _id: Id<"offers">; startupName: string };

/** The contributor's Offers still waiting for an answer; nothing when there are none. */
export function PendingOffers() {
	const { pending } = useOffers();
	const { accept, decline, pendingId } = useRespondToOffer();
	const [declining, setDeclining] = useState<Declining | null>(null);

	if (pending.length === 0 && declining === null) {
		return null;
	}

	async function confirmDecline() {
		if (declining && (await decline(declining._id))) {
			setDeclining(null);
		}
	}

	return (
		<section className="space-y-3">
			<h2 className="text-sm font-medium text-muted-foreground">Offers</h2>
			<ul className="space-y-2">
				{pending.map((offer) => (
					<li
						key={offer._id}
						className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center"
					>
						<p className="min-w-0 flex-1 break-words">
							<span className="font-medium">{offer.startupName}</span> offered
							you the {offer.roleTitle} Role.
						</p>
						<div className="flex gap-2">
							<Button
								type="button"
								size="sm"
								disabled={pendingId !== null}
								onClick={() => void accept(offer._id)}
							>
								Accept
							</Button>
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={pendingId !== null}
								onClick={() => setDeclining(offer)}
							>
								Decline
							</Button>
						</div>
					</li>
				))}
			</ul>

			<DeclineOfferDialog
				startupName={declining?.startupName ?? null}
				isPending={pendingId !== null}
				onCancel={() => setDeclining(null)}
				onConfirm={() => void confirmDecline()}
			/>
		</section>
	);
}
