import { describe, expect, it } from "vitest";
import { decisionTitle } from "./decisionCopy";

describe("decision copy", () => {
	it("names the decision", () => {
		expect(decisionTitle("hired")).toBe("Offer.");
		expect(decisionTitle("not_this_time")).toBe("Not this time.");
	});
});
