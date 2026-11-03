import { useMemo } from "react";
import { BoardScopeContext } from "~/entities/card";
import { useCycle } from "~/entities/cycle";
import { useWorkspace } from "~/entities/startup";

/** Makes the Startup's own Board the one being worked on. Inside `StartupGate`. */
export function StartupBoardScope({
	children,
}: {
	readonly children: React.ReactNode;
}) {
	const { startup, userId, role } = useWorkspace();
	const state = useCycle(startup._id)?.state;
	const lock = state === "closing" || state === "planning" ? state : undefined;
	// A stable value, so every consumer's memos survive a re-render.
	const scope = useMemo(
		() => ({
			kind: "startup" as const,
			startupId: startup._id,
			slug: startup.slug,
			userId,
			role,
			phase: null,
			lock,
		}),
		[startup._id, startup.slug, userId, role, lock],
	);

	return (
		<BoardScopeContext.Provider value={scope}>
			{children}
		</BoardScopeContext.Provider>
	);
}
