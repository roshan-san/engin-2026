import type { api } from "@convex/_generated/api";
import type { WaitingReason } from "@convex/shared/places";
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

/** Whether anything is waiting on you there. An empty list is truthy; always ask this. */
export function isWaiting(place: {
	readonly waiting: readonly WaitingReason[];
}): boolean {
	return place.waiting.length > 0;
}

function plural(count: number, one: string, many: string): string {
	return `${count} ${count === 1 ? one : many}`;
}

/** One reason in plain words, for Home. */
export function reasonLine(reason: WaitingReason): string {
	switch (reason.kind) {
		case "team_unread":
			return "Unread team messages";
		case "cards_to_verify":
			return `${plural(reason.count, "Card", "Cards")} to verify`;
		case "new_applicants":
			return `${plural(reason.count, "new applicant", "new applicants")} on ${roleLabel(reason.role)}`;
		case "builder_cards_to_review":
			return `${plural(reason.count, "Builder Card", "Builder Cards")} to review on ${roleLabel(reason.role)}`;
		case "hackathon_unread":
			return `Unread messages on ${roleLabel(reason.role)}`;
		case "builders_to_decide":
			return `${plural(reason.count, "Builder", "Builders")} to decide on ${roleLabel(reason.role)}`;
		case "messages_unread":
			return "Unread messages";
		case "promise_pending":
			return "Did they keep their promise?";
	}
}

/** Whether a place other than the one you're in is waiting on you. */
export function othersWaiting(places: Places, current: CurrentPlace): boolean {
	return (
		places.startups.some(
			(startup) =>
				isWaiting(startup) &&
				!isSamePlace({ kind: "startup", slug: startup.slug }, current),
		) ||
		places.building.some(
			(hackathon) =>
				isWaiting(hackathon) &&
				!isSamePlace(
					{ kind: "hackathon", hackathonId: hackathon.hackathonId },
					current,
				),
		)
	);
}

/** The switcher's trigger: what you're in, its logo (named for the Startup, so initials match the menu rows), and who you are there. */
export function currentPlaceView(
	places: Places,
	current: CurrentPlace,
): {
	name: string;
	logoName: string;
	logoUrl: string | null;
	role: string;
} | null {
	if (current?.kind === "startup") {
		const slug = current.slug;
		const startup = places.startups.find((s) => s.slug === slug);
		return startup
			? {
					name: startup.name,
					logoName: startup.name,
					logoUrl: startup.logoUrl,
					role: startup.role === "founder" ? "Founder" : "Contributor",
				}
			: null;
	}
	if (current?.kind === "hackathon") {
		const id = current.hackathonId;
		const hackathon = places.building.find((h) => h.hackathonId === id);
		return hackathon
			? {
					name: roleLabel(hackathon.job.role),
					logoName: hackathon.startupName,
					logoUrl: hackathon.startupLogoUrl,
					role: `Builder · ${hackathon.startupName}`,
				}
			: null;
	}
	return null;
}

/** Places whose name matches the search; blank keeps all. */
export function filterPlaces(places: Places, query: string): Places {
	const q = query.trim().toLowerCase();
	if (!q) {
		return places;
	}
	return {
		...places,
		startups: places.startups.filter((s) => s.name.toLowerCase().includes(q)),
		building: places.building.filter((h) =>
			`${roleLabel(h.job.role)} ${h.startupName}`.toLowerCase().includes(q),
		),
	};
}

/** Which tab row the shell shows under the top bar. */
export type TabsKind =
	| { kind: "startup"; slug: string }
	| { kind: "builder"; hackathonId: string }
	| { kind: "explore" }
	| null;

/** A Startup's tabs inside it, the Builder's tabs in their Hackathon, Explore's on Explore; nothing elsewhere. */
export function tabsFromRoute(matches: readonly RouteMatch[]): TabsKind {
	const place = placeFromRoute(matches);
	if (place?.kind === "startup") {
		return place;
	}
	if (place?.kind === "hackathon") {
		return { kind: "builder", hackathonId: place.hackathonId };
	}
	if (matches.some(({ routeId }) => routeId.startsWith("/_shell/explore/"))) {
		return { kind: "explore" };
	}
	return null;
}

/** Signed out, only Explore has a tab row: the Startup and Builder rows read the signed-in person's places. */
export function tabsForSignedOut(tabs: TabsKind): TabsKind {
	return tabs?.kind === "explore" ? tabs : null;
}

/** Only the Founder sees a Startup's ⚙. */
export function canSeeSettings(
	places: Places | undefined,
	slug: string,
): boolean {
	return (
		places?.startups.some((s) => s.slug === slug && s.role === "founder") ??
		false
	);
}
