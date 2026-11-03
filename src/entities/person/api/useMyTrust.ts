import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** Your own Trust and progress; null signed out, undefined while loading. */
export function useMyTrust() {
	return useQuery(api.users.myTrust, {});
}
