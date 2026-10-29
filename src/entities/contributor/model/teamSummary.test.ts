import { describe, expect, it } from "vitest";
import { teamSummary } from "./teamSummary";

describe("teamSummary", () => {
	it("counts people and pending Invites", () => {
		expect(teamSummary(5, 1)).toBe("5 people · 1 invite pending");
	});

	it("one person, no Invites", () => {
		expect(teamSummary(1, 0)).toBe("1 person");
	});

	it("a Contributor doesn't see Invites", () => {
		expect(teamSummary(3, undefined)).toBe("3 people");
	});

	it("pluralises Invites", () => {
		expect(teamSummary(2, 3)).toBe("2 people · 3 invites pending");
	});
});
