import { api } from "@convex/_generated/api";
import { CYCLES_PAGE } from "@convex/shared/limits";
import { useQuery } from "convex/react";
import { useState } from "react";
import { useKept } from "~/shared/lib/useKept";

/** The public Cycles, masked unless you're Investor Pro. Show earlier asks for one more page. */
export function usePublicActivity(slug: string | undefined) {
	const [count, setCount] = useState(CYCLES_PAGE);
	const live = useQuery(
		api.activity.listPublic,
		slug ? { slug, count } : "skip",
	);
	const data = useKept(live, slug);

	return {
		data,
		isLoadingEarlier: live === undefined && data != null,
		showEarlier: () => setCount((n) => n + CYCLES_PAGE),
	};
}
