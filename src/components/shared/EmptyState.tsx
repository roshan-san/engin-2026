import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
	readonly icon?: LucideIcon;
	readonly title: string;
	readonly body?: ReactNode;
	readonly action?: ReactNode;
};

/** The only empty state in the app: centred text, no box. */
export function EmptyState({
	icon: Icon,
	title,
	body,
	action,
}: EmptyStateProps) {
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
