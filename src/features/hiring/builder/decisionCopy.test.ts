import { describe, expect, it } from "vitest";
import { builderHeaderLine, decisionTitle } from "./decisionCopy";

/** A moment in IST, as a timestamp. */
function ist(day: number, hour = 0) {
	return Date.UTC(2026, 9, day, hour) - 5.5 * 3600_000;
}

describe("decision copy", () => {
	it("names the decision", () => {
		expect(decisionTitle("hired")).toBe("Hired.");
		expect(decisionTitle("not_this_time")).toBe("Not this time.");
	});

	it("while building, the header says when it ends", () => {
		const hackathon = { status: "building" as const, endsAt: ist(26) };

		expect(builderHeaderLine(hackathon, ist(20))).toBe("Ends Sun, Oct 25");
		expect(builderHeaderLine(hackathon, ist(26))).toBe("Ended");
		expect(
			builderHeaderLine({ ...hackathon, status: "deciding" }, ist(20)),
		).toBe("Ended");
	});
});
