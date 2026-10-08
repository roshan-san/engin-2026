import type { ReactNode } from "react";
import {
	PAGE_GUTTER,
	PAGE_WIDTH,
	type PageWidth,
} from "~/components/shared/Page";
import { cn } from "~/lib/utils";

type PageHeaderProps = {
	readonly title: string;
	readonly meta?: ReactNode;
	readonly actions?: ReactNode;
	/** Matches the `Page` below so the edges line up. */
	readonly width?: PageWidth;
	/** Keeps the `<h1>` for screen readers on tab root pages. */
	readonly hidden?: boolean;
};

/** Full-bleed band under the tabs: title, meta line, actions on the right. */
export function PageHeader({
	title,
	meta,
	actions,
	width = "wide",
	hidden,
}: PageHeaderProps) {
	if (hidden) {
		return (
			<>
				<h1 className="sr-only">{title}</h1>
				{actions ? (
					<div className="flex w-full flex-wrap items-center justify-end gap-2">
						{actions}
					</div>
				) : null}
			</>
		);
	}

	return (
		<div className="border-b border-border">
			<div
				className={cn(
					PAGE_GUTTER,
					PAGE_WIDTH[width],
					"flex flex-wrap items-start justify-between gap-x-4 gap-y-3 py-6 md:py-8",
				)}
			>
				<div className="min-w-0 flex-1 basis-48">
					<h1 className="break-words text-2xl font-semibold tracking-tight">
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
		</div>
	);
}
