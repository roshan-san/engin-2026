import type { Id } from "@convex/_generated/dataModel";
import type { WaitingReason } from "@convex/shared/places";
import { describe, expect, it } from "vitest";
import {
	canSeeSettings,
	isSamePlace,
	isWaiting,
	othersWaiting,
	type Places,
	placeFromRoute,
	placeLabel,
	reasonLine,
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

function building(role: "frontend" | "fullstack", waiting: WaitingReason[]) {
	return {
		hackathonId,
		job: { role, pay: "equity", mode: "remote" } as const,
		startupName: "Acme",
		startupSlug: "acme",
		startupLogoUrl: null,
		status: "building" as const,
		startsAt: 0,
		endsAt: 1,
		decision: null,
		waiting,
	};
}

function places(overrides: Partial<Places> = {}): Places {
	return { startups: [], building: [], applied: [], ...overrides };
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

	it("a Builder's Hackathon page is that Hackathon", () => {
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
			building: [building("frontend", [])],
		});

		expect(othersWaiting(quiet, null)).toBe(false);
	});

	it("a waiting Hackathon Board counts from a Startup", () => {
		const onBoard = places({
			building: [building("frontend", [{ kind: "promise_pending" }])],
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
			{ kind: "builder_cards_to_review", role: "frontend", count: 1 },
			"1 Builder Card to review on Frontend",
		],
		[
			{ kind: "hackathon_unread", role: "frontend" },
			"Unread messages on Frontend",
		],
		[
			{ kind: "builders_to_decide", role: "frontend", count: 2 },
			"2 Builders to decide on Frontend",
		],
		[{ kind: "messages_unread" }, "Unread messages"],
		[{ kind: "promise_pending" }, "Did they keep their promise?"],
	] as const)("%o reads %s", (reason, line) => {
		expect(reasonLine(reason)).toBe(line);
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

describe("placeLabel", () => {
	it("the label is the Startup name, else Places", () => {
		const all = places({ startups: [startup("acme", "Acme", [])] });

		expect(placeLabel(all, { kind: "startup", slug: "acme" })).toBe("Acme");
		expect(placeLabel(all, null)).toBe("Places");
		expect(placeLabel(all, { kind: "startup", slug: "gone" })).toBe("Places");
	});

	it("a Hackathon Board is labelled by its job", () => {
		const all = places({
			building: [building("fullstack", [])],
		});

		expect(placeLabel(all, { kind: "hackathon", hackathonId })).toBe(
			"Full-stack",
		);
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

	it("a Builder's Hackathon shows the Builder tabs", () => {
		expect(
			tabsFromRoute([
				...shell,
				match("/_shell/_authed"),
				match("/_shell/_authed/h/$id", { id: "x" }),
			]),
		).toEqual({ kind: "builder", hackathonId: "x" });
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
