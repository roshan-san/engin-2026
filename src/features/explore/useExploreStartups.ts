import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import type { StartupSearch } from "./exploreSearch";

/** Startups that match the filters, best Rating first; `undefined` while loading. */
export function useExploreStartups(search: StartupSearch) {
	return useQuery(api.startups.startups.explore, search);
}
