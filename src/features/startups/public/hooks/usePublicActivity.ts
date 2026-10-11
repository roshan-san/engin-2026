import { api } from "@convex/_generated/api";
import { CYCLES_PAGE } from "@convex/lib/limits";
import { useQuery } from "convex/react";
import { useState } from "react";

/** The public Cycles, masked unless you're Investor Pro. Show earlier asks for one more page. */
export function usePublicActivity(slug: string | undefined) {
	const [count, setCount] = useState(CYCLES_PAGE);
	const data = useQuery(
		api.work.activity.listPublic,
		slug ? { slug, count } : "skip",
	);

	return { data, showEarlier: () => setCount((n) => n + CYCLES_PAGE) };
}
