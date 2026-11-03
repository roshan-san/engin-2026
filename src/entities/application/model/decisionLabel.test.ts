import { describe, expect, it } from "vitest";
import { decisionLabel } from "./decisionLabel";

describe("decisionLabel", () => {
	it("an Offer reads Offer until they join", () => {
		expect(decisionLabel({ decision: "hired", joinedAt: null })).toBe("Offer");
		expect(decisionLabel({ decision: "hired", joinedAt: 5 })).toBe("Joined");
	});

	it("Not this time, or nothing yet", () => {
		expect(decisionLabel({ decision: "not_this_time", joinedAt: null })).toBe(
			"Not this time",
		);
		expect(decisionLabel({ decision: null, joinedAt: null })).toBeNull();
	});
});
