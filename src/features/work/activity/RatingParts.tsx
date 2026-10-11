/** The parts behind a Rating, as plain lines. */
export function RatingParts({
	parts,
}: {
	readonly parts: {
		readonly consistency: { readonly active: number; readonly weeks: number };
		readonly volume: { readonly perWeek: number };
		readonly outcomes?: number;
	};
}) {
	const { consistency, volume, outcomes } = parts;

	return (
		<ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
			{consistency.weeks === 0 ? (
				<li>No finished week yet</li>
			) : (
				<>
					<li>
						Active {consistency.active} of {consistency.weeks} weeks
					</li>
					<li>{volume.perWeek} verified a week</li>
				</>
			)}
			{outcomes !== undefined ? <li>Hackathons {outcomes}</li> : null}
		</ul>
	);
}
