import { TopBar } from "~/app/layouts/TopBar";
import { useRememberPlace } from "~/entities/place";

/** Signed-in frame: the top bar over the page, which fills the rest and scrolls inside it. */
export function AppShell({ children }: { readonly children: React.ReactNode }) {
	useRememberPlace();

	return (
		<div className="flex h-dvh flex-col bg-background text-foreground">
			<TopBar />
			<main
				data-scroll-restoration-id="main"
				className="flex min-h-0 flex-1 flex-col overflow-y-auto"
			>
				{children}
			</main>
		</div>
	);
}
