import { PublicHeader } from "~/components/shared/PublicHeader";

/** Signed-out frame: the public header over the page, which fills the rest and scrolls inside it. */
export function PublicShell({
	children,
}: {
	readonly children: React.ReactNode;
}) {
	return (
		<div className="flex h-dvh flex-col bg-background text-foreground">
			<PublicHeader />
			<main
				data-scroll-restoration-id="main"
				className="flex min-h-0 flex-1 flex-col overflow-y-auto"
			>
				{children}
			</main>
		</div>
	);
}
