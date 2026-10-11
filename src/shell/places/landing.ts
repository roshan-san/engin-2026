import { currentPlace, type Places } from "./places";

export const LAST_PLACE_KEY = "engin:lastPlace";

/** Whether you still belong to the place a path is in. */
function stillBelongs(places: Places, pathname: string): boolean {
	const place = currentPlace(pathname);
	if (place?.kind === "startup") {
		return places.startups.some((startup) => startup.slug === place.slug);
	}
	if (place?.kind === "hackathon") {
		return places.building.some(
			(hackathon) => hackathon.hackathonId === place.hackathonId,
		);
	}
	return false;
}

/** Where a signed-in visitor lands: the last place they were in, else their first. */
export function pickLanding(places: Places, lastPlace: string | null): string {
	if (lastPlace && stillBelongs(places, lastPlace)) {
		return lastPlace;
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
