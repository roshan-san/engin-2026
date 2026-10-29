import type { ReactNode } from "react";
import { cn } from "~/shared/lib/cn";

/** The scrolling body under a `PanelHeader`: 16px in from the edges, sections 24px apart. */
export function PanelBody({
	children,
	className,
}: {
	readonly children: ReactNode;
	readonly className?: string;
}) {
	return (
		<div
			className={cn(
				"flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4",
				className,
			)}
		>
			{children}
		</div>
	);
}
