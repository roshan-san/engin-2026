import { TopBar } from "~/shell/topbar/TopBar";

/** Signed-in frame: the top bar over the page. */
export function AppShell({ children }: { readonly children: React.ReactNode }) {
	return (
		<div className="flex min-h-dvh flex-col bg-background text-foreground">
			<TopBar />
			<main className="flex-1">{children}</main>
		</div>
	);
}
