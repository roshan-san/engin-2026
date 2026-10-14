import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import {
	isSamePlace,
	othersWaiting,
	type Places,
	placeFromRoute,
	placeLabel,
} from "./places";

const startupId = "startup" as Id<"startups">;
const hackathonId = "hackathon" as Id<"hackathons">;

function startup(slug: string, name: string, waiting: boolean) {
	return { startupId, slug, name, role: "founder" as const, waiting };
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
		startups: [startup("acme", "Acme", true), startup("beta", "Beta", false)],
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

	it("a waiting Hackathon Board counts from a Startup", () => {
		const building = places({
			building: [
				{
					hackathonId,
					job: { role: "frontend", pay: "equity", mode: "remote" },
					startupName: "Acme",
					waiting: true,
				},
			],
		});

		expect(othersWaiting(building, { kind: "startup", slug: "acme" })).toBe(
			true,
		);
		expect(
			othersWaiting(building, { kind: "hackathon", hackathonId: hackathonId }),
		).toBe(false);
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
		const all = places({ startups: [startup("acme", "Acme", false)] });

		expect(placeLabel(all, { kind: "startup", slug: "acme" })).toBe("Acme");
		expect(placeLabel(all, null)).toBe("Places");
		expect(placeLabel(all, { kind: "startup", slug: "gone" })).toBe("Places");
	});

	it("a Hackathon Board is labelled by its job", () => {
		const all = places({
			building: [
				{
					hackathonId,
					job: { role: "fullstack", pay: "equity", mode: "remote" },
					startupName: "Acme",
					waiting: false,
				},
			],
		});

		expect(placeLabel(all, { kind: "hackathon", hackathonId })).toBe(
			"Full-stack",
		);
	});
});
