import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

type RowListProps = {
	readonly children: ReactNode;
	readonly className?: string;
};

/** The default way to show a list: rows divided by hairlines, no cards. */
export function RowList({ children, className }: RowListProps) {
	return (
		<ul
			data-slot="row-list"
			className={cn("-mx-2 divide-y divide-border", className)}
		>
			{children}
		</ul>
	);
}

type RowProps = {
	readonly leading?: ReactNode;
	readonly title: ReactNode;
	readonly meta?: ReactNode;
	readonly trailing?: ReactNode;
	readonly to?: LinkProps["to"];
	readonly params?: LinkProps["params"];
	readonly onClick?: () => void;
	readonly className?: string;
};

const ROW_CLASS = "flex w-full items-center gap-3 px-2 py-3 text-left";
const INTERACTIVE_CLASS = "focus-ring transition-colors hover:bg-accent";

export function Row({
	leading,
	title,
	meta,
	trailing,
	to,
	params,
	onClick,
	className,
}: RowProps) {
	const content = (
		<>
			{leading ? <div className="shrink-0">{leading}</div> : null}
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-medium">{title}</div>
				{meta ? (
					<div className="mt-0.5 truncate text-xs text-muted-foreground">
						{meta}
					</div>
				) : null}
			</div>
			{trailing ? (
				<div className="shrink-0 text-sm text-muted-foreground">{trailing}</div>
			) : null}
		</>
	);

	if (to) {
		return (
			<li>
				<Link
					to={to}
					params={params}
					className={cn(ROW_CLASS, INTERACTIVE_CLASS, className)}
				>
					{content}
				</Link>
			</li>
		);
	}
	if (onClick) {
		return (
			<li>
				<button
					type="button"
					onClick={onClick}
					className={cn(ROW_CLASS, INTERACTIVE_CLASS, className)}
				>
					{content}
				</button>
			</li>
		);
	}
	return <li className={cn(ROW_CLASS, className)}>{content}</li>;
}
