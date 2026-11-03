import { describe, expect, it } from "vitest";
import { LENGTHS, START_TIMES, timeLabel } from "./slotOptions";

describe("meeting slot options", () => {
	it("labels minutes from midnight as a 24-hour time", () => {
		expect(timeLabel(0)).toBe("00:00");
		expect(timeLabel(600)).toBe("10:00");
		expect(timeLabel(1020)).toBe("17:00");
		expect(timeLabel(1425)).toBe("23:45");
	});

	it("offers every quarter hour and the usual lengths", () => {
		expect(START_TIMES).toHaveLength(96);
		expect(START_TIMES.at(-1)).toBe(1425);
		expect(LENGTHS).toEqual([15, 30, 45, 60, 90, 120]);
	});
});
