import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { toErrorMessage } from "~/lib/validation";

type WorkspaceOffersProps = {
	readonly startupId: Id<"startups">;
};

export function WorkspaceOffers({ startupId }: WorkspaceOffersProps) {
	const offers = useQuery(api.hiring.offers.listForStartup, { startupId });
	const withdraw = useMutation(api.hiring.offers.withdraw);
	const [pendingId, setPendingId] = useState<Id<"offers"> | null>(null);

	if (!offers || offers.length === 0) {
		return null;
	}

	async function withdrawOffer(offerId: Id<"offers">) {
		if (!window.confirm("Withdraw this Offer?")) {
			return;
		}
		setPendingId(offerId);
		try {
			await withdraw({ offerId });
		} catch (error) {
			toast.error(toErrorMessage(error, "Could not withdraw the Offer"));
		} finally {
			setPendingId(null);
		}
	}

	return (
		<section className="space-y-4">
			<h2 className="text-lg font-semibold">Offers</h2>
			<ul className="space-y-2">
				{offers.map((offer) => (
					<li
						key={offer._id}
						className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
					>
						<div className="min-w-0 flex-1">
							<p className="font-medium">
								{offer.user?.name ?? offer.user?.username ?? "Participant"}
							</p>
							<p className="text-sm text-muted-foreground">{offer.roleTitle}</p>
						</div>
						<div className="flex items-center gap-2">
							<Badge variant="secondary">{offer.status}</Badge>
							{offer.status === "pending" ? (
								<Button
									type="button"
									size="sm"
									variant="outline"
									disabled={pendingId === offer._id}
									onClick={() => void withdrawOffer(offer._id)}
								>
									Withdraw
								</Button>
							) : null}
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
