/** "1,820 / 2,000" under a field, shown only once the text passes 80% of its cap. */
export function CharCount({
	value,
	max,
}: {
	readonly value: string;
	readonly max: number;
}) {
	const count = value.length;
	if (count < max * 0.8) return null;
	return (
		<p
			aria-live="polite"
			className="text-xs text-muted-foreground tabular-nums"
		>
			{count.toLocaleString("en-IN")} / {max.toLocaleString("en-IN")}
		</p>
	);
}
