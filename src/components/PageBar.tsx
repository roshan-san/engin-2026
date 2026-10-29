import type { ReactNode } from "react";
import { cn } from "~/shared/lib/cn";

/** The bar on top of every app page, 48px like the panel headers: back link, title, status badge; actions on the right. */
export function PageBar({
	back,
	title,
	badge,
	actions,
	className,
}: {
	readonly back?: ReactNode;
	readonly title: ReactNode;
	readonly badge?: ReactNode;
	readonly actions?: ReactNode;
	readonly className?: string;
}) {
	return (
		<div
			className={cn(
				"flex h-12 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6",
				className,
			)}
		>
			{back}
			<div className="flex min-w-0 flex-1 items-center gap-3">
				{title}
				{badge}
			</div>
			{actions ? (
				<div className="flex shrink-0 items-center gap-2">{actions}</div>
			) : null}
		</div>
	);
}
