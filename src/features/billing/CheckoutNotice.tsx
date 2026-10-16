import { TILE } from "~/components/tile";
import { cn } from "~/lib/utils";

/** Back from Dodo: confirming until the webhook lands, then ready. */
export function CheckoutNotice({ hasPlan }: { readonly hasPlan: boolean }) {
	return (
		<p role="status" className={cn(TILE, "mb-6 px-4 py-3 text-sm")}>
			{hasPlan
				? "You're on Pro. Publish when you're ready."
				: "Confirming your payment…"}
		</p>
	);
}
