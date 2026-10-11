import { describe, expect, it } from "vitest";
import { spaceStatusLine } from "./spaceStatus";

/** A moment in IST, as a timestamp. */
function ist(day: number, hour = 0) {
	return Date.UTC(2026, 9, day, hour) - 5.5 * 3600_000;
}

const hackathon = {
	startsAt: ist(19),
	endsAt: ist(26),
	decideBy: Date.UTC(2026, 10, 2) - 5.5 * 3600_000,
};

describe("spaceStatusLine", () => {
	it("says where the Hackathon is", () => {
		expect(spaceStatusLine({ ...hackathon, status: "draft" }, 0)).toBe("Draft");
		expect(spaceStatusLine({ ...hackathon, status: "open" }, 0)).toBe(
			"Open · starts Mon, Oct 19",
		);
		expect(spaceStatusLine({ ...hackathon, status: "building" }, 0)).toBe(
			"Building · ends Sun, Oct 25",
		);
		expect(spaceStatusLine({ ...hackathon, status: "deciding" }, 0)).toBe(
			"Deciding · by Sun, Nov 1",
		);
	});

	it("done shows the outcome", () => {
		expect(spaceStatusLine({ ...hackathon, status: "done" }, 1)).toBe(
			"Done · 1 hired",
		);
		expect(spaceStatusLine({ ...hackathon, status: "done" }, 0)).toBe(
			"Done · No hire",
		);
	});
});
