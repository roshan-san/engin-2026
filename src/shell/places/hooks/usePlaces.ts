import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import type { Places } from "~/shell/places/places";

/** Every place you can switch to and which are waiting; `undefined` while loading. */
export function usePlaces(): Places | undefined {
	return useQuery(api.people.places.list);
}
