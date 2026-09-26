import { Link, useRouterState } from "@tanstack/react-router";
import { Briefcase, Compass, Layers } from "lucide-react";
import { cn } from "~/lib/utils";

const tabs = [
	{
		label: "Build",
		to: "/app",
		icon: Layers,
		isActive: (path: string) =>
			path === "/app" ||
			path === "/app/" ||
			path === "/app/startup" ||
			path.startsWith("/app/startup/") ||
			path.startsWith("/app/trials") ||
			path.startsWith("/app/team") ||
			path.startsWith("/app/work"),
	},
	{
		label: "Explore",
		to: "/app/explore",
		icon: Compass,
		isActive: (path: string) => path.startsWith("/app/explore"),
	},
	{
		label: "Opportunities",
		to: "/app/opportunities",
		icon: Briefcase,
		isActive: (path: string) => path.startsWith("/app/opportunities"),
	},
] as const;

export function AppNav({
	placement,
}: {
	readonly placement: "header" | "dock";
}) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	if (placement === "header") {
		return (
			<nav
				aria-label="Main"
				className="flex rounded-full border border-border bg-muted/40 p-1"
			>
				{tabs.map(({ label, to, isActive }) => {
					const active = isActive(pathname);
					return (
						<Link
							key={to}
							to={to}
							aria-current={active ? "page" : undefined}
							className={cn(
								"rounded-full px-5 py-2 text-sm font-medium",
								active
									? "bg-background text-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{label}
						</Link>
					);
				})}
			</nav>
		);
	}

	return (
		<nav
			aria-label="Main"
			className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
		>
			<div className="grid grid-cols-3">
				{tabs.map(({ label, to, icon: Icon, isActive }) => {
					const active = isActive(pathname);
					return (
						<Link
							key={to}
							to={to}
							aria-current={active ? "page" : undefined}
							className={cn(
								"flex flex-col items-center gap-1 py-3 text-xs font-medium",
								active ? "text-foreground" : "text-muted-foreground",
							)}
						>
							<Icon className="size-5" />
							{label}
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
