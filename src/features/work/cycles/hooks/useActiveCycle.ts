import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useState } from "react";
import { useFocusedStartup } from "~/shell/hooks/useFocusedStartup";
import { useStartupRoute } from "~/shell/startup/StartupRoute";

export function useActiveCycle() {
	const { member: active, isLoading: workspaceLoading } = useStartupRoute();
	const { hasStartups } = useFocusedStartup();
	const cycles = useQuery(
		api.work.cycles.list,
		active ? { startupId: active.startup._id } : "skip",
	);
	const [selectedId, setSelectedId] = useState<Id<"cycles"> | null>(null);

	const suggested =
		cycles?.find((cycle) => cycle.status === "active") ??
		cycles?.find((cycle) => cycle.status === "planned") ??
		cycles?.[0] ??
		null;
	const cycle = cycles?.find((item) => item._id === selectedId) ?? suggested;

	return {
		membership: active,
		startup: active?.startup ?? null,
		isFounder: active?.role === "founder",
		cycles: cycles ?? [],
		cycle,
		selectCycle: setSelectedId,
		isLoading: workspaceLoading || (active !== null && cycles === undefined),
		hasStartups,
	};
}
