import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { toErrorMessage } from "~/lib/validation";

export function PendingOffers() {
	const offers = useQuery(api.hiring.offers.listMine, {});
	const accept = useMutation(api.hiring.offers.accept);
	const decline = useMutation(api.hiring.offers.decline);
	const [pendingId, setPendingId] = useState<Id<"offers"> | null>(null);

	const pending = offers?.filter((offer) => offer.status === "pending") ?? [];
	if (pending.length === 0) {
		return null;
	}

	async function respond(offerId: Id<"offers">, isAccepting: boolean) {
		setPendingId(offerId);
		try {
			await (isAccepting ? accept({ offerId }) : decline({ offerId }));
			toast.success(isAccepting ? "Welcome to the team" : "Offer declined");
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not respond to the Offer"));
		} finally {
			setPendingId(null);
		}
	}

	return (
		<section className="mt-6 space-y-2">
			{pending.map((offer) => (
				<div
					key={offer._id}
					className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 md:flex-row md:items-center"
				>
					<p className="flex-1">
						<span className="font-medium">{offer.startupName}</span> offered you
						the {offer.roleTitle} Role.
					</p>
					<div className="flex gap-2">
						<Button
							type="button"
							size="sm"
							disabled={pendingId === offer._id}
							onClick={() => void respond(offer._id, true)}
						>
							Accept
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={pendingId === offer._id}
							onClick={() => void respond(offer._id, false)}
						>
							Decline
						</Button>
					</div>
				</div>
			))}
		</section>
	);
}
