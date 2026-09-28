import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/shell/sidebar/AppSidebar";

/**
 * Signed-in frame. `SidebarProvider` is the outer container (it already
 * renders a `flex min-h-svh w-full` wrapper); the desktop sidebar mounts as
 * its first child, hidden below `md` (plan 01-07 adds the mobile bars there).
 */
export function AppShell({ children }: { readonly children: React.ReactNode }) {
	return (
		<SidebarProvider className="bg-background text-foreground">
			<div className="hidden md:flex">
				<AppSidebar />
			</div>
			<div className="flex min-w-0 flex-1 flex-col">
				<main className="flex-1 px-4 py-4 md:px-6">{children}</main>
			</div>
		</SidebarProvider>
	);
}
