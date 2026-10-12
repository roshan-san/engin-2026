import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import type { HackathonSearch } from "./exploreSearch";

/** Open and building Hackathons that match the filters; `undefined` while loading. */
export function useExploreHackathons(search: HackathonSearch) {
	return useQuery(api.hiring.hackathons.explore, search);
}
