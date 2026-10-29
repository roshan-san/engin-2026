import type { Id } from "@convex/_generated/dataModel";
import type { WaitingReason } from "@convex/shared/places";
import { describe, expect, it } from "vitest";
import {
	canSeeSettings,
	currentPlaceView,
	filterPlaces,
	isSamePlace,
	isWaiting,
	othersWaiting,
	type Places,
	placeFromRoute,
	placeHint,
	reasonLine,
	tabsForSignedOut,
	tabsFromRoute,
} from "./places";

const startupId = "startup" as Id<"startups">;
const hackathonId = "hackathon" as Id<"hackathons">;

function startup(slug: string, name: string, waiting: WaitingReason[]) {
	return {
		startupId,
		slug,
		name,
		role: "founder" as const,
		logoUrl: null,
		rating: 1000,
		waiting,
	};
}

function liveHackathon(
	role: "frontend" | "fullstack",
	waiting: WaitingReason[],
) {
	return {
		hackathonId,
		job: { role, pay: "equity", mode: "remote" } as const,
		startupName: "Acme",
		startupSlug: "acme",
		startupLogoUrl: null,
		status: "live" as const,
		startsAt: 0,
		endsAt: 1,
		decision: null,
		waiting,
	};
}

function hackathonRow(id: string, startupName: string) {
	return {
		hackathonId: id as Id<"hackathons">,
		job: { role: "frontend", pay: "6_9l", mode: "remote" } as const,
		startupName,
		startupSlug: startupName.toLowerCase(),
		startupLogoUrl: null,
		status: "live" as const,
		startsAt: 0,
		endsAt: 0,
		decision: null,
		waiting: [],
	};
}

function places(overrides: Partial<Places> = {}): Places {
	return { startups: [], hackathons: [], applied: [], ...overrides };
}

function match(routeId: string, params: Record<string, string> = {}) {
	return { routeId, params };
}

describe("placeFromRoute", () => {
	it("a page inside a Startup is that Startup", () => {
		const matches = [
			match("__root__"),
			match("/_shell"),
			match("/_shell/_authed"),
			match("/_shell/_authed/s/$slug", { slug: "acme" }),
			match("/_shell/_authed/s/$slug/hiring/$id", { slug: "acme", id: "x" }),
		];

		expect(placeFromRoute(matches)).toEqual({ kind: "startup", slug: "acme" });
	});

	it("a Participant's Hackathon page is that Hackathon", () => {
		const matches = [
			match("__root__"),
			match("/_shell"),
			match("/_shell/_authed"),
			match("/_shell/_authed/h/$id", { id: "x" }),
		];

		expect(placeFromRoute(matches)).toEqual({
			kind: "hackathon",
			hackathonId: "x",
		});
	});

	it("the public Startup page, Explore and a Profile are no place", () => {
		const shell = [match("__root__"), match("/_shell")];

		expect(
			placeFromRoute([
				...shell,
				match("/_shell/startups/$slug", { slug: "acme" }),
			]),
		).toBeNull();
		expect(
			placeFromRoute([...shell, match("/_shell/explore/startups")]),
		).toBeNull();
		expect(
			placeFromRoute([
				...shell,
				match("/_shell/u/$username", { username: "ana" }),
			]),
		).toBeNull();
	});
});

describe("othersWaiting", () => {
	const all = places({
		startups: [
			startup("acme", "Acme", [{ kind: "team_unread" }]),
			startup("beta", "Beta", []),
		],
	});

	it("the current place's own dot doesn't count", () => {
		expect(othersWaiting(all, { kind: "startup", slug: "acme" })).toBe(false);
	});

	it("another waiting place counts", () => {
		expect(othersWaiting(all, { kind: "startup", slug: "beta" })).toBe(true);
	});

	it("outside a place, any waiting place counts", () => {
		expect(othersWaiting(all, null)).toBe(true);
		expect(othersWaiting(places(), null)).toBe(false);
	});

	it("places with nothing waiting never count, even an empty list", () => {
		const quiet = places({
			startups: [startup("acme", "Acme", [])],
			hackathons: [liveHackathon("frontend", [])],
		});

		expect(othersWaiting(quiet, null)).toBe(false);
	});

	it("a waiting Hackathon Board counts from a Startup", () => {
		const onBoard = places({
			hackathons: [liveHackathon("frontend", [{ kind: "promise_pending" }])],
		});

		expect(othersWaiting(onBoard, { kind: "startup", slug: "acme" })).toBe(
			true,
		);
		expect(
			othersWaiting(onBoard, { kind: "hackathon", hackathonId: hackathonId }),
		).toBe(false);
	});
});

describe("isWaiting", () => {
	it("an empty list is not waiting", () => {
		expect(isWaiting({ waiting: [] })).toBe(false);
	});

	it("any reason is waiting", () => {
		expect(isWaiting({ waiting: [{ kind: "team_unread" }] })).toBe(true);
	});
});

describe("reasonLine", () => {
	it.each([
		[{ kind: "team_unread" }, "Unread team messages"],
		[{ kind: "cards_to_verify", count: 1 }, "1 Card to verify"],
		[{ kind: "cards_to_verify", count: 2 }, "2 Cards to verify"],
		[
			{ kind: "new_applicants", role: "frontend", count: 3 },
			"3 new applicants on Frontend",
		],
		[
			{ kind: "participant_cards_to_review", role: "frontend", count: 1 },
			"1 Participant Card to review on Frontend",
		],
		[
			{ kind: "hackathon_unread", role: "frontend" },
			"Unread messages on Frontend",
		],
		[
			{ kind: "participants_to_decide", role: "frontend", count: 2 },
			"2 Participants to decide on Frontend",
		],
		[{ kind: "messages_unread" }, "Unread messages"],
		[{ kind: "promise_pending" }, "Did they keep their promise?"],
	] as const)("%o reads %s", (reason, line) => {
		expect(reasonLine(reason)).toBe(line);
	});
});

describe("placeHint", () => {
	it("nothing waiting shows who you are there", () => {
		expect(placeHint([], "Founder")).toBe("Founder");
	});

	it("one reason reads in plain words", () => {
		expect(placeHint([{ kind: "cards_to_verify", count: 2 }], "Founder")).toBe(
			"2 Cards to verify",
		);
	});

	it("more reasons show the first and how many more", () => {
		expect(
			placeHint(
				[{ kind: "team_unread" }, { kind: "cards_to_verify", count: 1 }],
				"Founder",
			),
		).toBe("Unread team messages · +1 more");
	});
});

describe("isSamePlace", () => {
	it("matches the same Startup or Hackathon only", () => {
		expect(
			isSamePlace(
				{ kind: "startup", slug: "acme" },
				{ kind: "startup", slug: "acme" },
			),
		).toBe(true);
		expect(
			isSamePlace(
				{ kind: "startup", slug: "acme" },
				{ kind: "hackathon", hackathonId: "acme" },
			),
		).toBe(false);
		expect(isSamePlace(null, null)).toBe(false);
	});
});

describe("currentPlaceView", () => {
	it("a Startup shows its name, logo and your role", () => {
		expect(
			currentPlaceView(places({ startups: [startup("acme", "Acme", [])] }), {
				kind: "startup",
				slug: "acme",
			}),
		).toEqual({
			name: "Acme",
			logoName: "Acme",
			logoUrl: null,
			role: "Founder",
		});
	});

	it("a logo passes through to the trigger", () => {
		const withLogo = {
			...startup("acme", "Acme", []),
			logoUrl: "https://x/l.png",
		};

		expect(
			currentPlaceView(places({ startups: [withLogo] }), {
				kind: "startup",
				slug: "acme",
			})?.logoUrl,
		).toBe("https://x/l.png");
	});

	it("a Participant's Hackathon shows the job and the Startup", () => {
		const view = currentPlaceView(
			places({ hackathons: [hackathonRow("h1", "Zest")] }),
			{ kind: "hackathon", hackathonId: "h1" },
		);

		expect(view).toEqual({
			name: "Frontend",
			logoName: "Zest",
			logoUrl: null,
			role: "Participant · Zest",
		});
	});

	it("outside a place, or a place you've left, is no place", () => {
		expect(currentPlaceView(places(), null)).toBeNull();
		expect(
			currentPlaceView(places(), { kind: "startup", slug: "gone" }),
		).toBeNull();
	});
});

describe("filterPlaces", () => {
	it("keeps Startups and Hackathons whose name matches, ignoring case", () => {
		const all = places({
			startups: [startup("acme", "Acme", []), startup("kite", "Kitebase", [])],
			hackathons: [hackathonRow("h1", "Zest")],
		});

		const found = filterPlaces(all, "KI");

		expect(found.startups.map((s) => s.name)).toEqual(["Kitebase"]);
		expect(found.hackathons).toEqual([]);
	});

	it("keeps a Hackathon whose Startup or job matches", () => {
		const all = places({
			startups: [startup("acme", "Acme", [])],
			hackathons: [hackathonRow("h1", "Zest")],
		});

		expect(filterPlaces(all, "zes").hackathons).toHaveLength(1);
		expect(filterPlaces(all, "front").hackathons).toHaveLength(1);
		expect(filterPlaces(all, "zes").startups).toEqual([]);
	});

	it("spaces around the query are ignored", () => {
		const all = places({ startups: [startup("kite", "Kitebase", [])] });

		expect(filterPlaces(all, "  kite ").startups).toHaveLength(1);
	});

	it("an empty query keeps everything", () => {
		const all = places({ startups: [startup("acme", "Acme", [])] });

		expect(filterPlaces(all, "  ")).toEqual(all);
	});
});

describe("tabsFromRoute", () => {
	const shell = [match("__root__"), match("/_shell")];

	it("inside a Startup shows its tabs", () => {
		expect(
			tabsFromRoute([
				...shell,
				match("/_shell/_authed"),
				match("/_shell/_authed/s/$slug", { slug: "acme" }),
				match("/_shell/_authed/s/$slug/team", { slug: "acme" }),
			]),
		).toEqual({ kind: "startup", slug: "acme" });
	});

	it("a Participant's Hackathon shows the Participant tabs", () => {
		expect(
			tabsFromRoute([
				...shell,
				match("/_shell/_authed"),
				match("/_shell/_authed/h/$id", { id: "x" }),
			]),
		).toEqual({ kind: "participant", hackathonId: "x" });
	});

	it("Explore shows its tabs, signed in or out", () => {
		expect(
			tabsFromRoute([...shell, match("/_shell/explore/startups")]),
		).toEqual({ kind: "explore" });
	});

	it("a Profile, a public page or Home has no tab row", () => {
		expect(
			tabsFromRoute([
				...shell,
				match("/_shell/u/$username", { username: "a" }),
			]),
		).toBeNull();
		expect(
			tabsFromRoute([...shell, match("/_shell/startups/$slug", { slug: "a" })]),
		).toBeNull();
		expect(
			tabsFromRoute([
				...shell,
				match("/_shell/_authed"),
				match("/_shell/_authed/home"),
			]),
		).toBeNull();
	});
});

describe("tabsForSignedOut", () => {
	it("keeps Explore's tabs", () => {
		expect(tabsForSignedOut({ kind: "explore" })).toEqual({ kind: "explore" });
	});

	it("drops the Startup and Participant rows, which need a signed-in person", () => {
		expect(tabsForSignedOut({ kind: "startup", slug: "acme" })).toBeNull();
		expect(
			tabsForSignedOut({ kind: "participant", hackathonId: "x" }),
		).toBeNull();
		expect(tabsForSignedOut(null)).toBeNull();
	});
});

describe("canSeeSettings", () => {
	it("the Founder sees the gear", () => {
		expect(
			canSeeSettings(
				places({ startups: [startup("acme", "Acme", [])] }),
				"acme",
			),
		).toBe(true);
	});

	it("a Contributor doesn't", () => {
		const contributor = {
			...startup("acme", "Acme", []),
			role: "contributor" as const,
		};

		expect(canSeeSettings(places({ startups: [contributor] }), "acme")).toBe(
			false,
		);
	});

	it("nobody sees it while places load", () => {
		expect(canSeeSettings(undefined, "acme")).toBe(false);
	});
});
