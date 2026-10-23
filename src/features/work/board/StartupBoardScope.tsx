import { useMemo } from "react";
import { useWorkspace } from "~/features/startups/workspace/Workspace";
import { BoardScopeContext } from "./BoardScope";

/** Makes the Startup's own Board the one being worked on. Inside `StartupGate`. */
export function StartupBoardScope({
	children,
}: {
	readonly children: React.ReactNode;
}) {
	const { startup, userId, role } = useWorkspace();
	// A stable value, so every consumer's memos survive a re-render.
	const scope = useMemo(
		() => ({
			kind: "startup" as const,
			startupId: startup._id,
			slug: startup.slug,
			userId,
			role,
			phase: null,
		}),
		[startup._id, startup.slug, userId, role],
	);

	return (
		<BoardScopeContext.Provider value={scope}>
			{children}
		</BoardScopeContext.Provider>
	);
}
