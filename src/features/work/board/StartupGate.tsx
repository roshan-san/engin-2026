import { GlobalNotFound } from "~/components/globals/GlobalNotFound";
import { GlobalSpinner } from "~/components/globals/GlobalSpinner";
import { useMe } from "./hooks/useMe";
import { useStartup } from "./hooks/useStartup";
import { StartupContext } from "./StartupContext";

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

	if (found === null) {
		return <GlobalNotFound />;
	}
	if (found === undefined || !me) {
		return <GlobalSpinner />;
	}

	return (
		<StartupContext.Provider
			value={{
				startup: found.startup,
				role: found.role,
				isFounder: found.role === "founder",
				userId: me._id,
			}}
		>
			{children}
		</StartupContext.Provider>
	);
}
