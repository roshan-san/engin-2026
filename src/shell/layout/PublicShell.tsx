import { PublicHeader } from "~/components/shared/PublicHeader";

/** Signed-out frame: the public header over the page. */
export function PublicShell({
	children,
}: {
	readonly children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-dvh flex-col bg-background text-foreground">
			<PublicHeader />
			<main className="flex-1">{children}</main>
		</div>
	);
}
