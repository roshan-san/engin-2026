import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

/** The bar on top of a workspace pane. Every pane's bar is the same height, so they line up. */
export function PanelHeader({
	children,
	className,
}: {
	readonly children: ReactNode;
	readonly className?: string;
}) {
	return (
		<div
			className={cn(
				"flex h-12 shrink-0 items-center gap-2 border-b border-border px-4",
				className,
			)}
		>
			{children}
		</div>
	);
}
