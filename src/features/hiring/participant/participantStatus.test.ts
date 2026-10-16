import { describe, expect, it } from "vitest";
import { participantStatus, participantStatusText } from "./participantStatus";

/** A moment in IST, as a timestamp. */
function ist(day: number, hour = 0) {
	return Date.UTC(2026, 9, day, hour) - 5.5 * 3600_000;
}

const hackathon = { startsAt: ist(19), endsAt: ist(26) };

describe("participantStatus", () => {
	it("accepted before the start: it starts Monday, the Cards come later", () => {
		expect(
			participantStatus({ ...hackathon, status: "open" }, null, ist(14)),
		).toEqual({
			line: "Starts Mon, Oct 19",
			note: "Your Cards arrive when it starts.",
		});
	});

	it("while live, it says when it ends", () => {
		expect(
			participantStatus({ ...hackathon, status: "live" }, null, ist(20)),
		).toEqual({ line: "Ends Sun, Oct 25", note: null });
	});

	it("after the end, it waits for the Founder", () => {
		expect(
			participantStatus({ ...hackathon, status: "deciding" }, null, ist(27)),
		).toEqual({
			line: "Ended",
			note: "Waiting for the Founder's decision.",
		});
	});

	it("closed with no decision says so", () => {
		expect(
			participantStatus({ ...hackathon, status: "done" }, null, ist(40)),
		).toEqual({
			line: "Ended",
			note: "It closed without a decision.",
		});
	});

	it("a decision speaks for itself", () => {
		expect(
			participantStatus({ ...hackathon, status: "done" }, "hired", ist(40))
				.note,
		).toBeNull();
	});
});

describe("participantStatusText", () => {
	const hackathon = (status: "open" | "live" | "deciding" | "done") => ({
		status,
		startsAt: ist(19),
		endsAt: ist(26),
	});
	const midway = ist(21);

	it("a decision is the status once it's in", () => {
		expect(participantStatusText(hackathon("done"), "hired", midway)).toBe(
			"Hired",
		);
		expect(
			participantStatusText(hackathon("deciding"), "not_this_time", midway),
		).toBe("Not this time");
	});

	it("before it starts, when it starts", () => {
		expect(participantStatusText(hackathon("open"), null, ist(14))).toBe(
			"Starts Mon, Oct 19",
		);
	});

	it("while live, when it ends", () => {
		expect(participantStatusText(hackathon("live"), null, midway)).toBe(
			"Ends Sun, Oct 25",
		);
	});

	it("after the end without a decision, Deciding", () => {
		expect(participantStatusText(hackathon("deciding"), null, ist(28))).toBe(
			"Deciding",
		);
	});

	it("closed without a decision, Closed", () => {
		expect(participantStatusText(hackathon("done"), null, ist(40))).toBe(
			"Closed",
		);
	});
});
