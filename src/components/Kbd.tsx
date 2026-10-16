import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

/** A keyboard shortcut hint. Hidden on small screens and on touch, which have no keyboard to press it on. */
export function Kbd({
	children,
	className,
}: {
	readonly children: ReactNode;
	readonly className?: string;
}) {
	return (
		<kbd
			className={cn(
				"pointer-events-none hidden h-5 min-w-5 items-center justify-center rounded border border-border px-1 font-mono text-xs text-subtle-foreground md:inline-flex pointer-coarse:hidden",
				className,
			)}
		>
			{children}
		</kbd>
	);
}
