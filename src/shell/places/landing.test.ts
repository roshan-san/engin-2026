import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import { pickLanding } from "./landing";
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

function places(overrides: Partial<Places> = {}): Places {
	return { startups: [], building: [], applied: [], ...overrides };
}

describe("pickLanding", () => {
	it("the last place wins while you still belong", () => {
		const all = places({ startups: [startup("beta"), startup("acme")] });

		expect(pickLanding(all, "/s/acme/activity")).toBe("/s/acme/activity");
	});

	it("a last place you left is skipped", () => {
		const all = places({ startups: [startup("acme")] });

		expect(pickLanding(all, "/s/gone/board")).toBe("/s/acme/board");
	});

	it("the last Hackathon Board wins while you are still building", () => {
		const all = places({
			startups: [startup("acme")],
			building: [building(hackathonId)],
		});

		expect(pickLanding(all, `/h/${hackathonId}`)).toBe(`/h/${hackathonId}`);
	});

	it("a last Hackathon no longer building is skipped", () => {
		const all = places({ startups: [startup("acme")] });

		expect(pickLanding(all, `/h/${hackathonId}`)).toBe("/s/acme/board");
	});

	it("a last path outside any place is skipped", () => {
		const all = places({ startups: [startup("acme")] });

		expect(pickLanding(all, "/explore/startups")).toBe("/s/acme/board");
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
