import type { ReactNode } from "react";
import { cn } from "~/shared/lib/cn";

const TONES = {
	founder: "border-t border-border",
	// The default Button and the focus ring are light for the dark app, so they flip here.
	contributor:
		"bg-[var(--panel-contributor)] text-[#18181b] [--primary:#18181b] [--primary-foreground:#fafafa] [--ring:#18181b]",
} as const;

/** One section of the landing page, most of a screen from `md`: two columns from `lg`, or one when `right` renders nothing. */
export function LandingPanel({
	tone = "founder",
	left,
	right,
}: {
	readonly tone?: keyof typeof TONES;
	readonly left: ReactNode;
	readonly right: ReactNode;
}) {
	return (
		<section className={cn("flex items-center md:min-h-[85dvh]", TONES[tone])}>
			<div
				className={cn(
					"mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-24 md:px-6 md:py-32",
					"lg:grid-cols-2 lg:gap-20 lg:has-[>:empty]:grid-cols-1",
				)}
			>
				<div className="flex min-w-0 flex-col items-start gap-6">{left}</div>
				<div className="min-w-0 empty:hidden">{right}</div>
			</div>
		</section>
	);
}
