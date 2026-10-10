import { Link } from "@tanstack/react-router";
import { GitPullRequest } from "lucide-react";
import { cn } from "~/lib/utils";

/** The Engin mark (a pull request), linking to My Tasks, or home when signed out. */
export function EnginLogo({
	to = "/my-tasks",
	wordmark = false,
	className,
	tabIndex,
}: {
	readonly to?: "/" | "/my-tasks";
	/** Show "Engin" beside the mark, as on the signed-out header. */
	readonly wordmark?: boolean;
	readonly className?: string;
	readonly tabIndex?: number;
}) {
	return (
		<Link
			to={to}
			aria-label="Engin"
			tabIndex={tabIndex}
			className={cn(
				"flex h-8 shrink-0 items-center justify-center gap-2 rounded-md text-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60",
				wordmark ? "px-1.5" : "w-8",
				className,
			)}
		>
			<GitPullRequest aria-hidden className="size-5" />
			{wordmark ? (
				<span className="text-[17px] font-semibold tracking-tight">Engin</span>
			) : null}
		</Link>
	);
}
