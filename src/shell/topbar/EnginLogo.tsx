import { Link } from "@tanstack/react-router";
import { cn } from "~/lib/utils";

/** The Engin mark (a block E), linking to Home, or the landing page when signed out. */
export function EnginLogo({
	to = "/home",
	className,
	tabIndex,
}: {
	readonly to?: "/" | "/home";
	readonly className?: string;
	readonly tabIndex?: number;
}) {
	return (
		<Link
			to={to}
			aria-label="Engin"
			tabIndex={tabIndex}
			className={cn(
				"flex size-8 shrink-0 items-center justify-center rounded-md text-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60",
				className,
			)}
		>
			<svg viewBox="0 0 24 24" aria-hidden className="size-5">
				<path d="M5 4h14v4H9.5v2H17v4H9.5v2H19v4H5z" fill="currentColor" />
			</svg>
		</Link>
	);
}
