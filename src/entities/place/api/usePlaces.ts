import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import type { Places } from "../model/places";

/**
 * Every place you can switch to and which are waiting; `undefined` while
 * loading. Pass `enabled = false` when signed out: the query needs sign-in.
 */
export function usePlaces(enabled = true): Places | undefined {
	return useQuery(api.people.places.list, enabled ? {} : "skip");
}
