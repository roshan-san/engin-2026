import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

/** Your own account; `undefined` while loading. */
export function useMe() {
	return useQuery(api.users.getMe);
}
