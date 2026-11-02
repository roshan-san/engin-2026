import type { ReactNode } from "react";
import { cn } from "~/shared/lib/cn";

const TONES = {
	founder: "bg-[var(--panel-founder)] text-white",
	// The default Button and the focus ring are light for the dark app, so they flip here.
	contributor:
		"bg-[var(--panel-contributor)] text-[#18181b] [--primary:#18181b] [--primary-foreground:#fafafa] [--ring:#18181b]",
} as const;

/** One screen of the landing page: its own colour, and two columns from `lg`. Grows when its content is taller than the screen. */
export function LandingPanel({
	tone = "founder",
	left,
	right,
}: {
	readonly tone?: keyof typeof TONES;
	readonly left: ReactNode;
	readonly right?: ReactNode;
}) {
	return (
		<section className={cn("flex min-h-dvh items-center", TONES[tone])}>
			<div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 md:px-6 lg:grid-cols-2 lg:gap-16">
				<div className="flex min-w-0 flex-col items-start gap-6">{left}</div>
				{right ? <div className="min-w-0">{right}</div> : null}
			</div>
		</section>
	);
}
