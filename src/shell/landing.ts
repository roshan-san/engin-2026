import { z } from "zod";
import {
	type CurrentPlace,
	type Places,
	placeFromRoute,
	type RouteMatch,
} from "./places";

export const LAST_PLACE_KEY = "engin:lastPlace";

/** The last place you were in, and the page in it. */
export type RememberedPlace = {
	readonly place: NonNullable<CurrentPlace>;
	readonly path: string;
};

const rememberedPlace = z.object({
	place: z.discriminatedUnion("kind", [
		z.object({ kind: z.literal("startup"), slug: z.string() }),
		z.object({ kind: z.literal("hackathon"), hackathonId: z.string() }),
	]),
	path: z.string(),
});

/** The remembered last place, or `null` when none, unreadable, or storage is blocked. */
export function readLastPlace(): RememberedPlace | null {
	try {
		const stored = localStorage.getItem(LAST_PLACE_KEY);
		if (stored === null) {
			return null;
		}
		const parsed = rememberedPlace.safeParse(JSON.parse(stored));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

/** The place and page to remember, both read from the same route matches so they can't disagree mid-navigation. */
export function rememberedFrom(
	matches: readonly (RouteMatch & { readonly pathname: string })[],
): RememberedPlace | null {
	const place = placeFromRoute(matches);
	const path = matches.at(-1)?.pathname;
	return place && path ? { place, path } : null;
}

/** Remembers a place; does nothing when storage is blocked. */
export function writeLastPlace(remembered: RememberedPlace): void {
	try {
		localStorage.setItem(LAST_PLACE_KEY, JSON.stringify(remembered));
	} catch {
		// Blocked storage just means no memory.
	}
}

/** Whether you still belong to a place. */
function stillBelongs(
	places: Places,
	place: RememberedPlace["place"],
): boolean {
	if (place.kind === "startup") {
		return places.startups.some((startup) => startup.slug === place.slug);
	}
	return places.building.some(
		(hackathon) => hackathon.hackathonId === place.hackathonId,
	);
}

/** Where a signed-in visitor lands: the last place they were in, else their first. */
export function pickLanding(
	places: Places,
	lastPlace: RememberedPlace | null,
): string {
	if (lastPlace && stillBelongs(places, lastPlace.place)) {
		return lastPlace.path;
	}
	const [startup] = places.startups;
	if (startup) {
		return `/s/${startup.slug}/board`;
	}
	const [building] = places.building;
	if (building) {
		return `/h/${building.hackathonId}`;
	}
	const [applied] = places.applied;
	if (applied) {
		return `/hackathons/${applied.hackathonId}`;
	}
	return "/onboarding";
}
