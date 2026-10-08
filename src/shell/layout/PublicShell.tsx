import { useRouterState } from "@tanstack/react-router";
import { PublicHeader } from "~/components/shared/PublicHeader";
import { buildShellContext } from "~/shell/context";
import { ContextTabs } from "~/shell/topbar/ContextTabs";

/**
 * Signed-out frame. On Explore it adds the section tabs; the context is
 * built purely from the path, since memberships need a signed-in user.
 */
export function PublicShell({
	children,
}: {
	readonly children: React.ReactNode;
}) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const context = buildShellContext({ pathname, memberships: [] });

	return (
		<div className="flex min-h-dvh flex-col bg-background text-foreground">
			<PublicHeader />
			{context.kind === "explore" ? (
				<div className="sticky top-14 z-30 h-12 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
					<ContextTabs context={context} />
				</div>
			) : null}
			<main className="flex-1">{children}</main>
		</div>
	);
}
