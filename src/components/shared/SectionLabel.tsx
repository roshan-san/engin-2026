import type { ReactNode } from "react";

type SectionLabelProps = {
	readonly children: ReactNode;
	readonly as?: "h2" | "h3" | "p";
};

/** The small label with a hairline above a group of rows. Stays a heading by default. */
export function SectionLabel({ children, as: Tag = "h2" }: SectionLabelProps) {
	return (
		<Tag className="border-b border-border pb-2 text-xs font-semibold text-muted-foreground">
			{children}
		</Tag>
	);
}
