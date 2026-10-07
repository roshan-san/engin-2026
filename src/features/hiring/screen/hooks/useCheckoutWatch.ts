import type { Id } from "@convex/_generated/dataModel";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { HackathonListItem } from "~/features/hiring/screen/components/HackathonRow";
import { isConfirmingPayment } from "~/features/hiring/screen/checkoutStatus";

/**
 * Announces a paid hackathon going live while the founder watches. Only
 * rows seen confirming payment in this session are announced; the webhook's
 * Inbox notification covers a founder who comes back later.
 */
export function useCheckoutWatch(
	hackathons: readonly HackathonListItem[] | undefined,
	creditCount: number | undefined,
) {
	const watched = useRef(new Set<Id<"hackathons">>());

	useEffect(() => {
		for (const hackathon of hackathons ?? []) {
			if (isConfirmingPayment(hackathon, creditCount)) {
				watched.current.add(hackathon._id);
			} else if (watched.current.delete(hackathon._id)) {
				// A late payment leaves a draft with a credit: stop watching, no toast.
				if (hackathon.status === "open") {
					toast.success(`Payment received. ${hackathon.title} is live.`);
				}
			}
		}
	}, [hackathons, creditCount]);
}
