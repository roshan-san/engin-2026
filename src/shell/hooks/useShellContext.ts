import { useRouterState } from "@tanstack/react-router";
import { buildShellContext, type ShellContext } from "../context";
import { useFocusedStartup } from "./useFocusedStartup";

/** The shell's current context (You, Startup, Explore, neutral or loading). */
export function useShellContext(): ShellContext {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { memberships, isLoading } = useFocusedStartup();

	return buildShellContext({
		pathname,
		memberships: isLoading
			? undefined
			: memberships.map((m) => ({ slug: m.startup.slug })),
	});
}
