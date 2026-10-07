import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

type GlowHeroProps = {
	readonly eyebrow?: ReactNode;
	readonly title: ReactNode;
	readonly subtitle?: ReactNode;
	readonly children?: ReactNode;
	readonly size?: "page" | "compact";
};

/** The energy panel: a bordered card with a soft `--glow` in the top-right corner. */
export function GlowHero({
	eyebrow,
	title,
	subtitle,
	children,
	size = "page",
}: GlowHeroProps) {
	return (
		<section
			className={cn(
				"rounded-lg border border-border bg-card bg-[radial-gradient(circle_at_top_right,var(--glow),transparent_55%)]",
				size === "page" ? "p-6 md:p-8" : "p-4 md:p-5",
			)}
		>
			{eyebrow ? <div className="mb-3">{eyebrow}</div> : null}
			<h1 className="text-[22px] font-[650] tracking-[-0.02em] md:text-[28px]">
				{title}
			</h1>
			{subtitle ? (
				<p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
			) : null}
			{children ? <div className="mt-5">{children}</div> : null}
		</section>
	);
}
