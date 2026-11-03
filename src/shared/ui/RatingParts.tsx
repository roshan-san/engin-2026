/** The parts behind a person's Momentum, as of the last weekly run, as plain lines. */
export function RatingParts({
	parts,
}: {
	readonly parts: {
		readonly active: number;
		readonly shipped: number;
		readonly outcomes: number;
	} | null;
}) {
	if (!parts) {
		return <p className="text-sm text-muted-foreground">No scored week yet</p>;
	}

	return (
		<ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
			<li>
				Approved in {parts.shipped} of {parts.active} active weeks
			</li>
			<li>Hackathons {parts.outcomes}</li>
		</ul>
	);
}
