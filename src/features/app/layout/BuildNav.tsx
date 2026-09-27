import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "~/lib/utils";

const items = [
	{
		label: "Cycle",
		to: "/app",
		isActive: (path: string) => path === "/app" || path === "/app/",
	},
	{
		label: "Pitch",
		to: "/app/startup",
		isActive: (path: string) =>
			path === "/app/startup" || path === "/app/startup/",
	},
	{
		label: "Team",
		to: "/app/team",
		isActive: (path: string) => path.startsWith("/app/team"),
	},
	{
		label: "Trials",
		to: "/app/trials",
		isActive: (path: string) =>
			path.startsWith("/app/trials") ||
			path.startsWith("/app/startup/trials") ||
			path.startsWith("/app/startup/roles"),
	},
] as const;

export function BuildNav() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	return (
		<nav aria-label="Build" className="flex gap-6 border-b border-border">
			{items.map(({ label, to, isActive }) => {
				const active = isActive(pathname);
				return (
					<Link
						key={to}
						to={to}
						aria-current={active ? "page" : undefined}
						className={cn(
							"-mb-px border-b-2 pb-3 text-sm font-medium",
							active
								? "border-foreground text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground",
						)}
					>
						{label}
					</Link>
				);
			})}
		</nav>
	);
}
