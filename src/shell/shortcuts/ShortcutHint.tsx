import { cn } from "~/lib/utils";
import { formatShortcut } from "~/shell/shortcuts/platform";
import { findShortcut } from "~/shell/shortcuts/registry";

/**
 * The only component that prints a shortcut label (SHELL-05). Renders
 * nothing when the entry has no key.
 */
export function ShortcutHint({
	id,
	className,
}: {
	readonly id: string;
	readonly className?: string;
}) {
	const label = formatShortcut(findShortcut(id)?.key);
	if (!label) {
		return null;
	}

	return (
		<kbd
			className={cn(
				"rounded border border-input px-1 font-mono text-[11px] leading-4 text-muted-foreground whitespace-nowrap",
				className,
			)}
		>
			{label}
		</kbd>
	);
}
