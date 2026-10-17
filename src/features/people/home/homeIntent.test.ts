import { describe, expect, it } from "vitest";
import { homeIntent } from "./homeIntent";

describe("homeIntent", () => {
	it("does nothing without an intent", () => {
		expect(
			homeIntent(undefined, {
				startups: [{ slug: "b", role: "founder" }],
			}),
		).toBeNull();
	});

	it("waits while places are still loading", () => {
		expect(homeIntent("post", undefined)).toBeNull();
	});

	it("sends a newcomer to onboarding", () => {
		expect(homeIntent("post", { startups: [] })).toEqual({
			to: "/onboarding",
		});
	});

	it("sends a Founder to New hackathon on their first Founder Startup", () => {
		expect(
			homeIntent("post", {
				startups: [
					{ slug: "a", role: "contributor" },
					{ slug: "b", role: "founder" },
				],
			}),
		).toEqual({ to: "/s/$slug/hiring/new", slug: "b" });
	});

	it("sends a Contributor who founded nothing to onboarding", () => {
		expect(
			homeIntent("post", { startups: [{ slug: "a", role: "contributor" }] }),
		).toEqual({ to: "/onboarding" });
	});
});
