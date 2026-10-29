import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** The public startup page; `null` for an unknown slug. */
export function usePublicStartup(slug: string | undefined) {
	return useQuery(api.startups.startups.getPublic, slug ? { slug } : "skip");
}
