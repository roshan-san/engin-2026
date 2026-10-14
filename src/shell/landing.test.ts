import type { Id } from "@convex/_generated/dataModel";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	pickLanding,
	readLastPlace,
	rememberedFrom,
	writeLastPlace,
} from "./landing";
import type { Places } from "./places";

const startupId = "startup" as Id<"startups">;
const hackathonId = "hackathon" as Id<"hackathons">;
const job = { role: "frontend", pay: "equity", mode: "remote" } as const;

function startup(slug: string) {
	return {
		startupId,
		slug,
		name: slug,
		role: "founder" as const,
		waiting: false,
	};
}

function building(id: Id<"hackathons">) {
	return { hackathonId: id, job, startupName: "Acme", waiting: false };
}

function inStartup(slug: string, path: string) {
	return { place: { kind: "startup" as const, slug }, path };
}

function inHackathon(id: string) {
	return {
		place: { kind: "hackathon" as const, hackathonId: id },
		path: `/h/${id}`,
	};
}

function places(overrides: Partial<Places> = {}): Places {
	return { startups: [], building: [], applied: [], ...overrides };
}

describe("rememberedFrom", () => {
	it("remembers the page you're on, taken from the same route as its place", () => {
		const matches = [
			{ routeId: "__root__", params: {}, pathname: "/" },
			{
				routeId: "/_shell/_authed/s/$slug",
				params: { slug: "acme" },
				pathname: "/s/acme",
			},
			{
				routeId: "/_shell/_authed/s/$slug/activity",
				params: { slug: "acme" },
				pathname: "/s/acme/activity",
			},
		];

		expect(rememberedFrom(matches)).toEqual(
			inStartup("acme", "/s/acme/activity"),
		);
	});

	it("a page outside any place is not remembered", () => {
		const matches = [
			{ routeId: "__root__", params: {}, pathname: "/" },
			{ routeId: "/", params: {}, pathname: "/" },
		];

		expect(rememberedFrom(matches)).toBeNull();
	});
});

describe("pickLanding", () => {
	it("the last place wins while you still belong", () => {
		const all = places({ startups: [startup("beta"), startup("acme")] });

		expect(pickLanding(all, inStartup("acme", "/s/acme/activity"))).toBe(
			"/s/acme/activity",
		);
	});

	it("a last place you left is skipped", () => {
		const all = places({ startups: [startup("acme")] });

		expect(pickLanding(all, inStartup("gone", "/s/gone/board"))).toBe(
			"/s/acme/board",
		);
	});

	it("the last Hackathon Board wins while you are still building", () => {
		const all = places({
			startups: [startup("acme")],
			building: [building(hackathonId)],
		});

		expect(pickLanding(all, inHackathon(hackathonId))).toBe(
			`/h/${hackathonId}`,
		);
	});

	it("a last Hackathon no longer building is skipped", () => {
		const all = places({ startups: [startup("acme")] });

		expect(pickLanding(all, inHackathon(hackathonId))).toBe("/s/acme/board");
	});

	it("no Startup goes to the Hackathon you build in", () => {
		const all = places({ building: [building(hackathonId)] });

		expect(pickLanding(all, null)).toBe(`/h/${hackathonId}`);
	});

	it("only an application goes to its Hackathon page", () => {
		const all = places({
			applied: [{ hackathonId, job, startupName: "Acme", status: "applied" }],
		});

		expect(pickLanding(all, null)).toBe(`/hackathons/${hackathonId}`);
	});

	it("nothing goes to onboarding", () => {
		expect(pickLanding(places(), null)).toBe("/onboarding");
	});
});

describe("remembered place with blocked storage", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("reads nothing and writes nothing instead of throwing", () => {
		vi.stubGlobal("localStorage", {
			getItem: () => {
				throw new Error("SecurityError");
			},
			setItem: () => {
				throw new Error("SecurityError");
			},
		});

		expect(readLastPlace()).toBeNull();
		expect(() =>
			writeLastPlace(inStartup("acme", "/s/acme/board")),
		).not.toThrow();
	});

	it("reads back the place that was written", () => {
		const store = new Map<string, string>();
		vi.stubGlobal("localStorage", {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => store.set(key, value),
		});

		writeLastPlace(inStartup("acme", "/s/acme/board"));

		expect(readLastPlace()).toEqual(inStartup("acme", "/s/acme/board"));
	});

	it("a stored value that isn't a remembered place reads as nothing", () => {
		vi.stubGlobal("localStorage", {
			getItem: () => "/s/acme/board",
			setItem: () => {},
		});

		expect(readLastPlace()).toBeNull();
	});
});
