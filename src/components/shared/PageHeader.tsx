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
		<div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
			<div className="min-w-0 flex-1 basis-48">
				<h1
					className={cn(
						"break-words text-xl font-semibold tracking-[-0.01em]",
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
				<div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
					{actions}
				</div>
			) : null}
		</div>
	);
}
