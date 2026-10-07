import { Link } from "@tanstack/react-router";
import { cn } from "~/lib/utils";

/** The Engin wordmark, linking home to My Tasks. */
export function EnginMark({ className }: { readonly className?: string }) {
	return (
		<Link
			to="/my-tasks"
			className={cn(
				"items-center text-[15px] font-semibold tracking-[-0.01em] text-foreground",
				className,
			)}
		>
			Engin
		</Link>
	);
}
