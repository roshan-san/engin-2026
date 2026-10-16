import { describe, expect, it } from "vitest";
import { decisionTitle } from "./decisionCopy";

describe("decision copy", () => {
	it("names the decision", () => {
		expect(decisionTitle("hired")).toBe("Hired.");
		expect(decisionTitle("not_this_time")).toBe("Not this time.");
	});
});
