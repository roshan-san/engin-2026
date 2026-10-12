import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import {
	currentPlace,
	isSamePlace,
	othersWaiting,
	type Places,
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

describe("currentPlace", () => {
	it("a workspace path is its Startup", () => {
		expect(currentPlace("/s/acme/team")).toEqual({
			kind: "startup",
			slug: "acme",
		});
		expect(currentPlace("/s/acme/hiring/abc")).toEqual({
			kind: "startup",
			slug: "acme",
		});
	});

	it("a Builder Board path is its Hackathon", () => {
		expect(currentPlace("/h/x")).toEqual({
			kind: "hackathon",
			hackathonId: "x",
		});
	});

	it("the public Startup page is no place", () => {
		expect(currentPlace("/startups/acme")).toBeNull();
		expect(currentPlace("/explore/startups")).toBeNull();
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
