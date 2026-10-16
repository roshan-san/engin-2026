import { Link } from "@tanstack/react-router";
import { tierText } from "~/features/work/activity/tierText";
import { cn } from "~/lib/utils";
import { useMe } from "~/shell/useMe";

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
				"flex h-8 shrink-0 items-center rounded-md px-2 text-sm font-semibold tabular-nums transition-colors hover:bg-muted focus-ring",
				tierText(me.rating),
			)}
		>
			{me.rating}
		</Link>
	);
}
