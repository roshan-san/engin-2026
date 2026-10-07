import type { ReactNode } from "react";

type PageHeaderProps = {
	readonly title: string;
	readonly meta?: ReactNode;
	readonly actions?: ReactNode;
	/** Keeps the `<h1>` for screen readers on tab root pages. */
	readonly hidden?: boolean;
};

export function PageHeader({ title, meta, actions, hidden }: PageHeaderProps) {
	if (hidden) {
		return (
			<>
				<h1 className="sr-only">{title}</h1>
				{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
			</>
		);
	}

	return (
		<div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
			<div className="min-w-0 flex-1 basis-48">
				<h1 className="break-words text-xl font-semibold tracking-[-0.01em]">
					{title}
				</h1>
				{meta ? (
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
