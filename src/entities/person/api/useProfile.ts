import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** A profile and its Record; `null` for an unknown username. */
export function useProfile(username: string | undefined) {
	return useQuery(api.users.getRecord, username ? { username } : "skip");
}
