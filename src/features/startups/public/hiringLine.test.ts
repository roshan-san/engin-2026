import { describe, expect, it } from "vitest";
import { hiringLine } from "./hiringLine";

const NOTHING = {
	finished: 0,
	hires: 0,
	promisesKept: 0,
	promisesAnswered: 0,
	undecided: 0,
};

describe("hiringLine", () => {
	it("a Startup with no Hackathons has no hiring line", () => {
		expect(hiringLine(NOTHING)).toBeNull();
	});

	it("finished Hackathons list hires and promises kept", () => {
		expect(
			hiringLine({
				finished: 2,
				hires: 1,
				promisesKept: 3,
				promisesAnswered: 3,
				undecided: 0,
			}),
		).toBe("2 hackathons · 1 hire · promises kept 3/3");
	});

	it("Builders left waiting show as undecided", () => {
		expect(hiringLine({ ...NOTHING, finished: 1, undecided: 1 })).toBe(
			"1 hackathon · didn't decide 1",
		);
	});
});
