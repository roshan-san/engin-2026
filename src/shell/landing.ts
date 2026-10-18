import { z } from "zod";
import {
	type CurrentPlace,
	type Places,
	placeFromRoute,
	type RouteMatch,
} from "./places";

const LAST_PLACE_KEY = "engin:lastPlace";

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
	return places.hackathons.some(
		(hackathon) => hackathon.hackathonId === place.hackathonId,
	);
}

/** Where a signed-in visitor lands: the last place they were in while they still belong, else Home. */
export function pickLanding(
	places: Places,
	lastPlace: RememberedPlace | null,
): string {
	return lastPlace && stillBelongs(places, lastPlace.place)
		? lastPlace.path
		: "/home";
}

declare module "@tanstack/react-router" {
	interface HistoryState {
		/** Set by Sign out on its trip to the landing page, which signs you out on arrival. */
		signingOut?: true;
	}
}

/** What the landing page shows. */
export type LandingView = "wait" | "signOut" | "redirect" | "page";

/**
 * Decides the landing page: a signed-in visitor goes to their last place,
 * unless they arrived through Sign out, in which case they're signed out here.
 */
export function landingView(
	auth: { readonly isLoading: boolean; readonly isAuthenticated: boolean },
	signingOut: boolean,
): LandingView {
	if (auth.isLoading) {
		return "wait";
	}
	if (auth.isAuthenticated) {
		return signingOut ? "signOut" : "redirect";
	}
	return "page";
}
