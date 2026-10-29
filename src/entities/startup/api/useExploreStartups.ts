import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useKept } from "~/shared/lib/useKept";
import type { StartupSearch } from "../model/startupSearch";

/**
 * Startups that match the filters, best Rating first. `startups` keeps the previous
 * rows while a new filter loads (`undefined` only the first time); `isLoading` says
 * they may be out of date.
 */
export function useExploreStartups(search: StartupSearch) {
	const live = useQuery(api.startups.explore, search);
	const startups = useKept(live, "explore-startups");
	return { startups, isLoading: live === undefined };
}
