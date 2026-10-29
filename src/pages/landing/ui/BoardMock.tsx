const COLUMNS = [
	{ title: "To do", cards: ["Search filters", "Empty states"] },
	{ title: "In progress", cards: ["Checkout page"] },
	{ title: "Review", cards: ["Onboarding emails"] },
	{ title: "Done", cards: ["Pricing table"], verified: true },
] as const;

/** A static Board, so the hero shows the product rather than a stock photo. */
export function BoardMock() {
	return (
		<div
			aria-hidden
			className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:grid-cols-4"
		>
			{COLUMNS.map((column) => (
				<div
					key={column.title}
					className="flex flex-col gap-2 rounded-lg bg-muted/50 p-2"
				>
					<p className="px-1 text-xs font-medium text-muted-foreground">
						{column.title}
					</p>
					{column.cards.map((card) => (
						<div
							key={card}
							className="rounded-md border border-border bg-background px-2.5 py-2 text-xs"
						>
							{card}
							{"verified" in column ? (
								<span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-success">
									✓ Verified
								</span>
							) : null}
						</div>
					))}
				</div>
			))}
		</div>
	);
}
