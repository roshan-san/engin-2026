import { SidebarProvider } from "~/components/ui/sidebar";
import { BottomTabBar } from "~/shell/mobile/BottomTabBar";
import { MobileTopBar } from "~/shell/mobile/MobileTopBar";
import { AppSidebar } from "~/shell/sidebar/AppSidebar";

/**
 * Signed-in frame. `SidebarProvider` is the outer container (it already
 * renders a `flex min-h-svh w-full` wrapper); the desktop sidebar mounts as
 * its first child, hidden below `md`. Below `md`, the slim top bar and the
 * bottom tab bar take over — `main` reserves `pb-20` so the last content row
 * never sits under the tab bar.
 */
export function AppShell({ children }: { readonly children: React.ReactNode }) {
	return (
		<SidebarProvider className="bg-background text-foreground">
			<div className="hidden md:flex">
				<AppSidebar />
			</div>
			<div className="flex min-w-0 flex-1 flex-col">
				<MobileTopBar />
				<main className="flex-1 px-4 py-4 pb-20 md:px-6 md:pb-4">
					{children}
				</main>
			</div>
			<BottomTabBar />
		</SidebarProvider>
	);
}
