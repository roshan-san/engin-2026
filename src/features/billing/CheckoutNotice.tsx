import { useEffect, useState } from "react";
import { TILE } from "~/components/tile";
import { cn } from "~/lib/utils";

/** How long to wait for the payment before saying it may not clear. */
const STILL_WAITING_MS = 30_000;

/** Back from Dodo: confirming until the webhook lands, then ready. */
export function CheckoutNotice({ hasPlan }: { readonly hasPlan: boolean }) {
	const [isStuck, setIsStuck] = useState(false);

	useEffect(() => {
		if (hasPlan) return;
		const timer = setTimeout(() => setIsStuck(true), STILL_WAITING_MS);
		return () => clearTimeout(timer);
	}, [hasPlan]);

	return (
		<p role="status" className={cn(TILE, "mb-6 px-4 py-3 text-sm")}>
			{hasPlan ? (
				"You're on Pro. Publish when you're ready."
			) : (
				<>
					Confirming your payment…
					{isStuck
						? " Still waiting. Refresh the page, or write to us if it doesn't clear."
						: null}
				</>
			)}
		</p>
	);
}
