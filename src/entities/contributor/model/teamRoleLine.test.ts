import { describe, expect, it } from "vitest";
import { teamRoleLine } from "./teamRoleLine";

describe("teamRoleLine", () => {
	it("is the discipline", () => {
		expect(teamRoleLine({ discipline: "developer", label: null })).toBe(
			"Developer",
		);
	});

	it("adds the label when there is one", () => {
		expect(
			teamRoleLine({ discipline: "marketing", label: "Growth lead" }),
		).toBe("Marketing · Growth lead");
	});
});
