import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useKept } from "~/lib/useKept";
import type { HackathonSearch } from "./exploreSearch";

/**
 * Open and live Hackathons that match the filters. `hackathons` keeps the previous
 * rows while a new filter loads (`undefined` only the first time); `isLoading` says
 * they may be out of date.
 */
export function useExploreHackathons(search: HackathonSearch) {
	const live = useQuery(api.hiring.hackathons.explore, search);
	const hackathons = useKept(live, "explore-hackathons");
	return { hackathons, isLoading: live === undefined };
}
