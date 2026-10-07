import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { GlowHero } from "~/components/shared/GlowHero";
import { SectionLabel } from "~/components/shared/SectionLabel";
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
			<SectionLabel>Offers</SectionLabel>
			{pending.map((offer) => (
				<GlowHero
					key={offer._id}
					size="compact"
					titleAs="h2"
					eyebrow={<SectionLabel as="p">New offer</SectionLabel>}
					title={<span className="break-words">{offer.roleTitle} Role</span>}
					subtitle={
						<span className="break-words">
							<span className="font-medium text-foreground">
								{offer.startupName}
							</span>{" "}
							offered you the {offer.roleTitle} Role.
						</span>
					}
				>
					<div className="flex gap-2">
						<Button
							type="button"
							disabled={pendingId !== null}
							onClick={() => void accept(offer._id)}
						>
							Accept
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={pendingId !== null}
							onClick={() => setDeclining(offer)}
						>
							Decline
						</Button>
					</div>
				</GlowHero>
			))}

			<DeclineOfferDialog
				startupName={declining?.startupName ?? null}
				isPending={pendingId !== null}
				onCancel={() => setDeclining(null)}
				onConfirm={() => void confirmDecline()}
			/>
		</section>
	);
}
