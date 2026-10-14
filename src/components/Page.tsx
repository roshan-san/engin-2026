import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export type PageWidth = "wide" | "narrow" | "full";

/** Max widths shared by `Page` and the app pages. */
export const PAGE_WIDTH: Record<PageWidth, string> = {
	wide: "max-w-[1200px]",
	narrow: "max-w-3xl",
	full: "max-w-none",
};

/** Side padding shared by `Page`. */
export const PAGE_GUTTER = "mx-auto w-full px-4 md:px-6";

/** The content column. */
export function Page({
	width = "wide",
	className,
	children,
}: {
	readonly width?: PageWidth;
	readonly className?: string;
	readonly children: ReactNode;
}) {
	return (
		<div
			className={cn(PAGE_GUTTER, PAGE_WIDTH[width], "py-6 md:py-8", className)}
		>
			{children}
		</div>
	);
}
