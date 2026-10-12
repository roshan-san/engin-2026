import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CYCLES_PAGE } from "@convex/shared/limits";
import { useQuery } from "convex/react";
import { useState } from "react";
import { useKept } from "~/shell/hooks/useKept";

/** The team's Cycles, newest first. Show earlier asks for one more page. */
export function useActivity(startupId: Id<"startups">) {
	const [count, setCount] = useState(CYCLES_PAGE);
	const live = useQuery(api.work.activity.list, { startupId, count });
	const data = useKept(live, startupId);

	return {
		data,
		isLoadingEarlier: live === undefined && data !== undefined,
		showEarlier: () => setCount((n) => n + CYCLES_PAGE),
	};
}
