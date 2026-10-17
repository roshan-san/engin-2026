import { Link } from "@tanstack/react-router";
import { GitPullRequest } from "lucide-react";
import { cn } from "~/lib/utils";

/** The Engin mark (a block E), linking to `/` (which picks your place) or, in the app, to Home. */
export function EnginLogo({
	className,
	tabIndex,
	to = "/",
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
				"flex size-9 shrink-0 md:size-8 items-center justify-center rounded-md text-foreground hover:bg-accent focus-ring",
				className,
			)}
		>
			<GitPullRequest />
		</Link>
	);
}
