type ScoreChipProps = {
	readonly score: number;
};

/** No Pro variant, no special styling — user-level Pro indicators removed (#19, ADR-0005). */
export function ScoreChip({ score }: ScoreChipProps) {
	return (
		<span className="inline-flex h-6 items-center rounded-md border border-border px-2 text-xs tabular-nums">
			Score {score}
		</span>
	);
}
