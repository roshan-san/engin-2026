import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** The Startups you run or contribute to; `undefined` while loading. */
export function useMyStartups() {
	return useQuery(api.startups.startups.listMine);
}
