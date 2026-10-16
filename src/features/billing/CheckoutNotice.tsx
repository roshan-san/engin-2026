/** Back from Dodo: confirming until the webhook lands, then ready. */
export function CheckoutNotice({ hasPlan }: { readonly hasPlan: boolean }) {
	return (
		<p
			role="status"
			className="mb-6 rounded-lg border border-border bg-card px-4 py-3 text-sm"
		>
			{hasPlan
				? "You're on Pro. Publish when you're ready."
				: "Confirming your payment…"}
		</p>
	);
}
