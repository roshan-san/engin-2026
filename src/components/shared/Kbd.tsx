import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

/** A keyboard shortcut hint. Hidden on phones, which have no keyboard to press it on. */
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
				"pointer-events-none hidden h-5 min-w-5 items-center justify-center rounded border border-border px-1 font-mono text-[11px] text-subtle-foreground md:inline-flex",
				className,
			)}
		>
			{children}
		</kbd>
	);
}
