import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
	readonly icon?: LucideIcon;
	readonly title: string;
	readonly body?: ReactNode;
	readonly action?: ReactNode;
	/** `compact` fits a kanban column: small padding, small text, no icon. */
	readonly size?: "default" | "compact";
};

/** The only empty state in the app: centred text, no box. */
export function EmptyState({
	icon: Icon,
	title,
	body,
	action,
	size = "default",
}: EmptyStateProps) {
	if (size === "compact") {
		return (
			<div className="flex flex-col items-center px-2 py-4 text-center text-balance">
				<p className="text-xs text-muted-foreground">{title}</p>
				{body ? (
					<div className="mt-1 text-xs text-muted-foreground">{body}</div>
				) : null}
				{action ? <div className="mt-2">{action}</div> : null}
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center px-4 py-12 text-center text-balance">
			{Icon ? (
				<Icon aria-hidden className="mb-3 size-6 text-muted-foreground" />
			) : null}
			<p className="font-medium">{title}</p>
			{body ? (
				<div className="mt-1 max-w-sm text-sm text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-primary">
					{body}
				</div>
			) : null}
			{action ? <div className="mt-4">{action}</div> : null}
		</div>
	);
}
