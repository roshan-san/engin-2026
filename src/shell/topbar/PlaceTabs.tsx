import { Link, useLocation, useParams } from "@tanstack/react-router";
import { useStartup } from "~/features/work/board/hooks/useStartup";

const TAB_CLASS =
	"relative flex items-center px-2 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 aria-[current=page]:text-foreground aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-2 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-foreground";

/** Inside a Startup: its name, then the places in it. Nothing elsewhere. */
export function PlaceTabs() {
	const { slug } = useParams({ strict: false });
	const { pathname } = useLocation();
	// Workspace tabs live under `/s/`; `/startups/$slug` is the public page.
	const inWorkspace = pathname.startsWith("/s/");
	const found = useStartup(inWorkspace ? slug : undefined);

	if (!inWorkspace || !slug || !found) {
		return null;
	}

	return (
		<>
			<span className="max-w-40 truncate text-sm font-medium">
				{found.startup.name}
			</span>
			<nav className="ml-2 flex h-14 items-stretch">
				<Link to="/s/$slug/board" params={{ slug }} className={TAB_CLASS}>
					Board
				</Link>
				<Link to="/s/$slug/hiring" params={{ slug }} className={TAB_CLASS}>
					Hiring
				</Link>
				<Link to="/s/$slug/activity" params={{ slug }} className={TAB_CLASS}>
					Activity
				</Link>
			</nav>
		</>
	);
}
