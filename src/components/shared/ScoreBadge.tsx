/** A user's Score in tabular figures inside an azure ring. */
export function ScoreBadge({ score }: { readonly score: number }) {
	return (
		<span className="inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium tabular-nums ring-1 ring-link">
			Score {score}
		</span>
	);
}
