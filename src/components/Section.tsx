import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

type SectionProps = {
	readonly label: ReactNode;
	readonly as?: "h2" | "h3";
	/** Small text at the label's right end, like a count. */
	readonly aside?: ReactNode;
	readonly className?: string;
	readonly children: ReactNode;
};

/**
 * A labelled group: the small label over a hairline, its content 12px below.
 * A `RowList` starts at the hairline instead, because its rows carry their own 12px.
 */
export function Section({
	label,
	as: Heading = "h2",
	aside,
	className,
	children,
}: SectionProps) {
	return (
		<section
			className={cn(
				"flex flex-col gap-3 [&>[data-slot=row-list]]:-mt-3",
				className,
			)}
		>
			<div className="flex items-baseline gap-3 border-b border-border pb-2">
				<Heading className="text-xs font-semibold text-muted-foreground">
					{label}
				</Heading>
				{aside ? (
					<span className="text-xs text-muted-foreground">{aside}</span>
				) : null}
			</div>
			{children}
		</section>
	);
}
