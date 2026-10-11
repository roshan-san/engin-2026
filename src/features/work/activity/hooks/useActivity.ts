import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CYCLES_PAGE } from "@convex/lib/limits";
import { useQuery } from "convex/react";
import { useState } from "react";

/** The team's Cycles, newest first. Show earlier asks for one more page. */
export function useActivity(startupId: Id<"startups">) {
	const [count, setCount] = useState(CYCLES_PAGE);
	const data = useQuery(api.work.activity.list, { startupId, count });

	return { data, showEarlier: () => setCount((n) => n + CYCLES_PAGE) };
}
