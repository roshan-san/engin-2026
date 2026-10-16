import { useMemo } from "react";
import { GlobalNotFound } from "~/components/GlobalNotFound";
import { GlobalSpinner } from "~/components/GlobalSpinner";
import { useMe } from "~/shell/useMe";
import { BoardScopeContext } from "./BoardScope";
import { StartupContext } from "./StartupContext";
import { useStartup } from "./useStartup";

/** Loads the Startup at `slug` and gives its page the workspace; 404s for non-team. */
export function StartupGate({
	slug,
	children,
}: {
	readonly slug: string;
	readonly children: React.ReactNode;
}) {
	const found = useStartup(slug);
	const me = useMe();
	const userId = me?._id;
	// Stable values, so every consumer's memos survive a re-render.
	const contexts = useMemo(() => {
		if (!found || !userId) return null;
		const isFounder = found.role === "founder";
		return {
			workspace: {
				startup: found.startup,
				role: found.role,
				isFounder,
				userId,
			},
			scope: {
				kind: "startup" as const,
				startupId: found.startup._id,
				slug: found.startup.slug,
				userId,
				isFounder,
			},
		};
	}, [found, userId]);

	if (found === null) {
		return <GlobalNotFound />;
	}
	if (!contexts) {
		return <GlobalSpinner fill />;
	}

	return (
		<StartupContext.Provider value={contexts.workspace}>
			<BoardScopeContext.Provider value={contexts.scope}>
				{children}
			</BoardScopeContext.Provider>
		</StartupContext.Provider>
	);
}
