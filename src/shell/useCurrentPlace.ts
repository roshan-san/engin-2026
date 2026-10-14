import { useMatches } from "@tanstack/react-router";
import { placeFromRoute } from "~/shell/places";

/** The Startup or Hackathon the current route is in, or `null`. */
export function useCurrentPlace() {
	return useMatches({ select: placeFromRoute });
}
