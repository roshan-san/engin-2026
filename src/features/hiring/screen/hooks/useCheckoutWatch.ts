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
	trials: readonly HackathonListItem[] | undefined,
	creditCount: number | undefined,
) {
	const watched = useRef(new Set<Id<"trialCycles">>());

	useEffect(() => {
		for (const trial of trials ?? []) {
			if (isConfirmingPayment(trial, creditCount)) {
				watched.current.add(trial._id);
			} else if (watched.current.delete(trial._id)) {
				// A late payment leaves a draft with a credit: stop watching, no toast.
				if (trial.status === "open") {
					toast.success(`Payment received. ${trial.title} is live.`);
				}
			}
		}
	}, [trials, creditCount]);
}
