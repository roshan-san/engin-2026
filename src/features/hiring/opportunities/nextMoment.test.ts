import { describe, expect, test } from "vitest";
import { nextMoment } from "./nextMoment";

const hackathon = { deadline: 100, startsAt: 200, endsAt: 300 };

describe("nextMoment", () => {
	test("before the deadline the next moment is applications closing", () => {
		expect(nextMoment(hackathon, 50)).toEqual({
			label: "Applications close",
			at: 100,
		});
	});

	test("between the deadline and the start the next moment is the start", () => {
		expect(nextMoment(hackathon, 100)).toEqual({ label: "Starts", at: 200 });
		expect(nextMoment(hackathon, 150)).toEqual({ label: "Starts", at: 200 });
	});

	test("between the start and the end the next moment is the end", () => {
		expect(nextMoment(hackathon, 200)).toEqual({ label: "Ends", at: 300 });
		expect(nextMoment(hackathon, 250)).toEqual({ label: "Ends", at: 300 });
	});

	test("at exactly the end and after it there is no next moment", () => {
		expect(nextMoment(hackathon, 300)).toBeNull();
		expect(nextMoment(hackathon, 999)).toBeNull();
	});
});
