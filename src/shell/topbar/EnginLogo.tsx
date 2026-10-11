import { Link } from "@tanstack/react-router";
import { cn } from "~/lib/utils";
import { GitPullRequestArrow } from "lucide-react";

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
			<GitPullRequestArrow />
		</Link>
	);
}
