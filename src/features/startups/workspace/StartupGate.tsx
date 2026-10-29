import { useMemo } from "react";
import { GlobalNotFound } from "~/shared/ui/GlobalNotFound";
import { GlobalSpinner } from "~/shared/ui/GlobalSpinner";
import { useMe } from "~/shell/useMe";
import { useStartup } from "./useStartup";
import { StartupContext } from "./Workspace";

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
	// A stable value, so every consumer's memos survive a re-render.
	const workspace = useMemo(() => {
		if (!found || !userId) return null;
		return {
			startup: found.startup,
			role: found.role,
			isFounder: found.role === "founder",
			userId,
		};
	}, [found, userId]);

	if (found === null) {
		return <GlobalNotFound />;
	}
	if (!workspace) {
		return <GlobalSpinner fill />;
	}

	return (
		<StartupContext.Provider value={workspace}>
			{children}
		</StartupContext.Provider>
	);
}
