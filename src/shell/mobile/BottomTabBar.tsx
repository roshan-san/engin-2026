import { Link, useRouterState } from "@tanstack/react-router";
import {
	Building2,
	Compass,
	Inbox as InboxIcon,
	ListChecks,
} from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { useNotifications } from "~/shell/hooks/useNotifications";
import { StartupSheet } from "~/shell/mobile/StartupSheet";

/**
 * Mobile bottom tab bar (D-14): Inbox · My Tasks · Startup · Discover. The
 * Startup tab is a button that opens the Startup sheet (D-15) instead of
 * navigating — it never gets its own screen. Inbox is active on both /inbox
 * and /threads because Threads live inside Inbox on mobile (D-16).
 */
export function BottomTabBar() {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const { count, countLabel, isLoading } = useNotifications();
	const [sheetOpen, setSheetOpen] = useState(false);

	const inboxActive =
		pathname.startsWith("/inbox") || pathname.startsWith("/threads");
	const myTasksActive = pathname.startsWith("/my-tasks");
	const startupActive = pathname.startsWith("/s/");
	const discoverActive = pathname.startsWith("/discover");
	const showBadge = !isLoading && count > 0;

	return (
		<>
			<nav
				aria-label="Main"
				className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background pb-safe md:hidden"
			>
				<div className="grid grid-cols-4">
					<Link
						to="/inbox"
						aria-current={inboxActive ? "page" : undefined}
						className="flex h-14 flex-col items-center justify-center gap-1 text-xs"
					>
						<span className="relative">
							<InboxIcon
								className={cn(
									"size-5",
									inboxActive ? "text-primary" : "text-muted-foreground",
								)}
							/>
							{showBadge ? (
								<span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-md bg-primary px-1 text-xs text-primary-foreground tabular-nums">
									{countLabel}
								</span>
							) : null}
						</span>
						<span
							className={inboxActive ? "text-primary" : "text-muted-foreground"}
						>
							Inbox
						</span>
					</Link>
					<Link
						to="/my-tasks"
						aria-current={myTasksActive ? "page" : undefined}
						className="flex h-14 flex-col items-center justify-center gap-1 text-xs"
					>
						<ListChecks
							className={cn(
								"size-5",
								myTasksActive ? "text-primary" : "text-muted-foreground",
							)}
						/>
						<span
							className={
								myTasksActive ? "text-primary" : "text-muted-foreground"
							}
						>
							My Tasks
						</span>
					</Link>
					<button
						type="button"
						aria-label="Startup"
						aria-current={startupActive ? "page" : undefined}
						onClick={() => setSheetOpen(true)}
						className="flex h-14 flex-col items-center justify-center gap-1 text-xs"
					>
						<Building2
							className={cn(
								"size-5",
								startupActive ? "text-primary" : "text-muted-foreground",
							)}
						/>
						<span
							className={
								startupActive ? "text-primary" : "text-muted-foreground"
							}
						>
							Startup
						</span>
					</button>
					<Link
						to="/discover"
						aria-current={discoverActive ? "page" : undefined}
						className="flex h-14 flex-col items-center justify-center gap-1 text-xs"
					>
						<Compass
							className={cn(
								"size-5",
								discoverActive ? "text-primary" : "text-muted-foreground",
							)}
						/>
						<span
							className={
								discoverActive ? "text-primary" : "text-muted-foreground"
							}
						>
							Discover
						</span>
					</Link>
				</div>
			</nav>
			<StartupSheet open={sheetOpen} onOpenChange={setSheetOpen} />
		</>
	);
}
