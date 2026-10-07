import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

type PageHeaderProps = {
	readonly title: string;
	readonly meta?: ReactNode;
	readonly actions?: ReactNode;
	/** Keeps the `<h1>` for screen readers on tab root pages. */
	readonly hidden?: boolean;
};

export function PageHeader({ title, meta, actions, hidden }: PageHeaderProps) {
	return (
		<div className="flex items-start justify-between gap-4">
			<div className="min-w-0">
				<h1
					className={cn(
						"truncate text-xl font-semibold tracking-[-0.01em]",
						hidden && "sr-only",
					)}
				>
					{title}
				</h1>
				{meta && !hidden ? (
					<div className="mt-1 text-sm text-muted-foreground">{meta}</div>
				) : null}
			</div>
			{actions ? (
				<div className="flex shrink-0 items-center gap-2">{actions}</div>
			) : null}
		</div>
	);
}
