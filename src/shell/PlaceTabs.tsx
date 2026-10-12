import { Link, useLocation, useParams } from "@tanstack/react-router";

export const TAB_CLASS =
	"relative flex items-center px-2 py-2 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 aria-[current=page]:text-foreground aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-2 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-foreground";

/** Inside a Startup, the places in it. Nothing elsewhere. */
export function PlaceTabs() {
	const { slug } = useParams({ strict: false });
	// Workspace tabs live under `/s/`; `/startups/$slug` is the public page.
	const inWorkspace = useLocation().pathname.startsWith("/s/");

	if (!inWorkspace || !slug) {
		return null;
	}

	return (
		<nav className="flex h-full items-stretch">
			<Link to="/s/$slug/board" params={{ slug }} className={TAB_CLASS}>
				Board
			</Link>
			<Link to="/s/$slug/hiring" params={{ slug }} className={TAB_CLASS}>
				Hiring
			</Link>
			<Link to="/s/$slug/activity" params={{ slug }} className={TAB_CLASS}>
				Activity
			</Link>
			<Link to="/s/$slug/team" params={{ slug }} className={TAB_CLASS}>
				Team
			</Link>
		</nav>
	);
}
