import { Link } from "@tanstack/react-router";
import { cn } from "~/shared/lib/cn";
import { tierText } from "~/shared/lib/tierText";
import { useMe } from "../api/useMe";

/** Your Rating in its Tier colour, linking to your Profile. */
export function MyRating() {
	const me = useMe();
	if (!me?.username) return null;

	return (
		<Link
			to="/u/$username"
			params={{ username: me.username }}
			aria-label={`Your Rating, ${me.rating}`}
			className={cn(
				"flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md px-2 text-sm font-semibold tabular-nums transition-colors hover:bg-muted focus-ring md:h-8 md:min-w-8",
				tierText(me.rating),
			)}
		>
			{me.rating}
		</Link>
	);
}
