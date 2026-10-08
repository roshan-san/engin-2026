import { useEffect, useState } from "react";
import { SWATCH_TOKENS } from "~/features/design/sample";
import type { DesignSystem } from "~/features/design/systems";

/** One tile per colour token, with the value the current system resolves to. */
export function TokenSwatches({ system }: { readonly system: DesignSystem }) {
	const [values, setValues] = useState<Record<string, string>>({});

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-read the tokens whenever the system on <html> changes
	useEffect(() => {
		const style = getComputedStyle(document.documentElement);
		setValues(
			Object.fromEntries(
				SWATCH_TOKENS.map((token) => [
					token,
					style.getPropertyValue(`--${token}`).trim(),
				]),
			),
		);
	}, [system]);

	return (
		<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
			{SWATCH_TOKENS.map((token) => (
				<li
					key={token}
					className="overflow-hidden rounded-xl border border-border"
				>
					<div className="h-14" style={{ background: `var(--${token})` }} />
					<div className="bg-card px-3 py-2">
						<p className="truncate text-xs font-medium">{token}</p>
						<p className="font-mono text-xs text-muted-foreground">
							{values[token] ?? "…"}
						</p>
					</div>
				</li>
			))}
		</ul>
	);
}
