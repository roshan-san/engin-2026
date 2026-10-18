import type { Id } from "@convex/_generated/dataModel";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	landingView,
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
		logoUrl: null,
		rating: 1000,
		waiting: [],
	};
}

function liveHackathon(id: Id<"hackathons">) {
	return {
		hackathonId: id,
		job,
		startupName: "Acme",
		startupSlug: "acme",
		startupLogoUrl: null,
		status: "live" as const,
		startsAt: 0,
		endsAt: 1,
		decision: null,
		waiting: [],
	};
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
	return { startups: [], hackathons: [], applied: [], ...overrides };
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

	it("with no remembered place you land on Home", () => {
		expect(pickLanding(places({ startups: [startup("acme")] }), null)).toBe(
			"/home",
		);
		expect(pickLanding(places(), null)).toBe("/home");
	});

	it("a remembered place you've left lands on Home", () => {
		const all = places({ startups: [startup("acme")] });

		expect(pickLanding(all, inStartup("gone", "/s/gone/board"))).toBe("/home");
	});

	it("the last Hackathon Board wins while you're still in it", () => {
		const all = places({
			startups: [startup("acme")],
			hackathons: [liveHackathon(hackathonId)],
		});

		expect(pickLanding(all, inHackathon(hackathonId))).toBe(
			`/h/${hackathonId}`,
		);
	});

	it("a last Hackathon you're no longer in lands on Home", () => {
		const all = places({ startups: [startup("acme")] });

		expect(pickLanding(all, inHackathon(hackathonId))).toBe("/home");
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

describe("landingView", () => {
	const signedIn = { isLoading: false, isAuthenticated: true };
	const signedOut = { isLoading: false, isAuthenticated: false };

	it("waits while sign-in state is loading", () => {
		expect(landingView({ isLoading: true, isAuthenticated: false }, true)).toBe(
			"wait",
		);
	});

	it("sends a signed-in visitor to their last place", () => {
		expect(landingView(signedIn, false)).toBe("redirect");
	});

	it("signs out a signed-in visitor who arrived through Sign out, instead of sending them back", () => {
		expect(landingView(signedIn, true)).toBe("signOut");
	});

	it("shows the landing page once signed out, whether or not Sign out brought them", () => {
		expect(landingView(signedOut, true)).toBe("page");
		expect(landingView(signedOut, false)).toBe("page");
	});
});
