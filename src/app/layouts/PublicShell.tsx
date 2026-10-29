import { useMatches } from "@tanstack/react-router";
import { PublicHeader } from "~/app/layouts/PublicHeader";
import { tabsFromRoute } from "~/entities/place";
import { SiteFooter } from "~/shared/ui/SiteFooter";
import { TabRow } from "~/widgets/tab-row";

/** Signed-out frame: the public header and Explore's tab row over the page, which fills the rest and scrolls inside it. */
export function PublicShell({
	children,
}: {
	readonly children: React.ReactNode;
}) {
	// Explore scrolls inside its own page and puts the footer at the end of that scroll.
	const isExplore = useMatches({ select: tabsFromRoute })?.kind === "explore";

	return (
		<div className="flex h-dvh flex-col bg-background text-foreground">
			<PublicHeader />
			<TabRow signedOut />
			<main
				data-scroll-restoration-id="main"
				className="flex min-h-0 flex-1 flex-col overflow-y-auto"
			>
				{children}
				{isExplore ? null : <SiteFooter />}
			</main>
		</div>
	);
}
