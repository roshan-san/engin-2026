import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useFocusedStartup } from "~/shell/hooks/useFocusedStartup";

/**
 * Palette data beyond the static registry (D-18): memberships for the
 * "Startups" group, and the Focused Startup's Cycles only — never a
 * cross-Startup Cycle search. Cycle-scoped visibility is enforced server-side
 * by `api.work.cycles.list` itself (Members see only their Cycles).
 */
export function usePaletteData() {
	const { memberships, focused } = useFocusedStartup();
	const cycles = useQuery(
		api.work.cycles.list,
		focused ? { startupId: focused.startup._id } : "skip",
	);

	return {
		memberships,
		focused,
		cycles: cycles ?? [],
		cyclesLoading: focused !== null && cycles === undefined,
	};
}
