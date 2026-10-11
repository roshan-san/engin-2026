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
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-git-pull-request preview-icon"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" x2="6" y1="9" y2="21"/></svg>
		</Link>
	);
}
