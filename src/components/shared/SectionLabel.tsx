import type { ReactNode } from "react";

type SectionLabelProps = {
	readonly children: ReactNode;
	readonly as?: "h2" | "h3" | "p";
};

/** The small uppercase label above a group of rows. Stays a heading by default. */
export function SectionLabel({ children, as: Tag = "h2" }: SectionLabelProps) {
	return (
		<Tag className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
			{children}
		</Tag>
	);
}
