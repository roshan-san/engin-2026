import { describe, expect, it } from "vitest";
import { meetingLabel } from "./meetingLabel";

describe("meetingLabel", () => {
	it("names the meeting, its day and its start time", () => {
		expect(
			meetingLabel("Opening", { startMinutes: 600, minutes: 45 }, "Mon"),
		).toBe("Opening · Mon 10:00 IST");
		expect(
			meetingLabel("Closing", { startMinutes: 1020, minutes: 30 }, "Fri"),
		).toBe("Closing · Fri 17:00 IST");
	});
});
