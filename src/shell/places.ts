import type { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { roleLabel } from "~/features/hiring/jobChips";

export type Places = FunctionReturnType<typeof api.people.places.list>;

export type CurrentPlace =
	| { kind: "startup"; slug: string }
	| { kind: "hackathon"; hackathonId: string }
	| null;

/** The part of a route match that says where you are. */
export type RouteMatch = {
	readonly routeId: string;
	readonly params: Readonly<Record<string, string | undefined>>;
};

/** The place the current route is in: a page under `/s/$slug` is that Startup, `/h/$id` is that Hackathon. */
export function placeFromRoute(matches: readonly RouteMatch[]): CurrentPlace {
	for (const { routeId, params } of matches) {
		if (routeId === "/_shell/_authed/s/$slug" && params.slug) {
			return { kind: "startup", slug: params.slug };
		}
		if (routeId === "/_shell/_authed/h/$id" && params.id) {
			return { kind: "hackathon", hackathonId: params.id };
		}
	}
	return null;
}

/** Whether two places are the same one; no place is never the same as anything. */
export function isSamePlace(a: CurrentPlace, b: CurrentPlace): boolean {
	if (a === null || b === null) {
		return false;
	}
	if (a.kind === "startup" && b.kind === "startup") {
		return a.slug === b.slug;
	}
	if (a.kind === "hackathon" && b.kind === "hackathon") {
		return a.hackathonId === b.hackathonId;
	}
	return false;
}

/** Whether a place other than the one you're in is waiting on you. */
export function othersWaiting(places: Places, current: CurrentPlace): boolean {
	return (
		places.startups.some(
			(startup) =>
				startup.waiting &&
				!isSamePlace({ kind: "startup", slug: startup.slug }, current),
		) ||
		places.building.some(
			(hackathon) =>
				hackathon.waiting &&
				!isSamePlace(
					{ kind: "hackathon", hackathonId: hackathon.hackathonId },
					current,
				),
		)
	);
}

/** What the switcher's trigger says: the Startup, the job you're building, or "Places". */
export function placeLabel(places: Places, current: CurrentPlace): string {
	if (current?.kind === "startup") {
		const slug = current.slug;
		return places.startups.find((s) => s.slug === slug)?.name ?? "Places";
	}
	if (current?.kind === "hackathon") {
		const id = current.hackathonId;
		const found = places.building.find((h) => h.hackathonId === id);
		return found ? roleLabel(found.job.role) : "Places";
	}
	return "Places";
}
