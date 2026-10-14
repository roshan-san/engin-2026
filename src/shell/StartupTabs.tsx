import { Link } from "@tanstack/react-router";

export const TAB_CLASS =
	"relative flex shrink-0 items-center px-2 py-2 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 aria-[current=page]:text-foreground aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-2 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-foreground";

/** The top bar's second row inside a Startup: Board, Hiring, Activity, Team. */
export function StartupTabs({ slug }: { readonly slug: string }) {
	return (
		<nav className="flex h-10 items-stretch overflow-x-auto whitespace-nowrap border-t border-border px-2 md:px-4">
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
