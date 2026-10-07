import { Link } from "@tanstack/react-router";
import { cn } from "~/lib/utils";

/** The Engin wordmark, linking to My Tasks (or home, signed out). */
export function EnginMark({
	className,
	to = "/my-tasks",
}: {
	readonly className?: string;
	readonly to?: "/" | "/my-tasks";
}) {
	return (
		<Link
			to={to}
			className={cn(
				"items-center text-[15px] font-semibold tracking-[-0.01em] text-foreground",
				className,
			)}
		>
			Engin
		</Link>
	);
}
