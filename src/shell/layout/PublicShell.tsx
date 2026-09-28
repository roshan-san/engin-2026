import { PublicHeader } from "~/components/shared/PublicHeader";

/** Signed-out frame. Plan 01-05 restyles PublicHeader itself. */
export function PublicShell({
	children,
}: {
	readonly children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-dvh flex-col bg-background text-foreground">
			<PublicHeader />
			<main className="flex-1 px-4 py-6 md:px-6">{children}</main>
		</div>
	);
}
