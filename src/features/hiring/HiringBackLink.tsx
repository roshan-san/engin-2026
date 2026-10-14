import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

/** "← Hiring /" in a page bar, back to the Startup's Hackathons. */
export function HiringBackLink({ slug }: { readonly slug: string }) {
	return (
		<span className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
			<Link
				to="/s/$slug/hiring"
				params={{ slug }}
				className="flex items-center gap-1 rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
			>
				<ArrowLeftIcon aria-hidden className="size-4" />
				Hiring
			</Link>
			<span aria-hidden>/</span>
		</span>
	);
}
