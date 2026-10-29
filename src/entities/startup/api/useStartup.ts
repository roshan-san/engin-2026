import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/**
 * The Startup at `slug` and your role on it. `null` when it doesn't exist or
 * you're not on its team; `undefined` while loading or with no slug.
 */
export function useStartup(slug: string | undefined) {
	return useQuery(api.startups.getBySlug, slug ? { slug } : "skip");
}
