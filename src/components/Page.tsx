import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

const WIDTH = {
	wide: "max-w-[1200px]",
	narrow: "max-w-3xl",
	full: "max-w-none",
};

/** The content column. */
export function Page({
	width = "wide",
	className,
	children,
}: {
	readonly width?: keyof typeof WIDTH;
	readonly className?: string;
	readonly children: ReactNode;
}) {
	return (
		<div
			className={cn(
				"mx-auto w-full px-4 py-6 md:px-6 md:py-8",
				WIDTH[width],
				className,
			)}
		>
			{children}
		</div>
	);
}
