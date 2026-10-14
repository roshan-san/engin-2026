import { describe, expect, it } from "vitest";
import { builderStatus, builderStatusText } from "./builderStatus";

/** A moment in IST, as a timestamp. */
function ist(day: number, hour = 0) {
	return Date.UTC(2026, 9, day, hour) - 5.5 * 3600_000;
}

const hackathon = { startsAt: ist(19), endsAt: ist(26) };

describe("builderStatus", () => {
	it("accepted before the start: it starts Monday, nothing to work yet", () => {
		expect(
			builderStatus({ ...hackathon, status: "open" }, null, ist(14)),
		).toEqual({
			line: "Starts Mon, Oct 19",
			isClosed: true,
			note: "Your Cards arrive when it starts.",
		});
	});

	it("while building, it says when it ends and the Board is open", () => {
		expect(
			builderStatus({ ...hackathon, status: "building" }, null, ist(20)),
		).toEqual({ line: "Ends Sun, Oct 25", isClosed: false, note: null });
	});

	it("after the end, it waits for the Founder", () => {
		expect(
			builderStatus({ ...hackathon, status: "deciding" }, null, ist(27)),
		).toEqual({
			line: "Ended",
			isClosed: true,
			note: "Waiting for the Founder's decision.",
		});
	});

	it("closed with no decision says so", () => {
		expect(
			builderStatus({ ...hackathon, status: "done" }, null, ist(40)),
		).toEqual({
			line: "Ended",
			isClosed: true,
			note: "It closed without a decision.",
		});
	});

	it("a decision speaks for itself", () => {
		expect(
			builderStatus({ ...hackathon, status: "done" }, "hired", ist(40)).note,
		).toBeNull();
	});
});

describe("builderStatusText", () => {
	const hackathon = (status: "open" | "building" | "deciding" | "done") => ({
		status,
		startsAt: ist(19),
		endsAt: ist(26),
	});
	const midway = ist(21);

	it("a decision is the status once it's in", () => {
		expect(builderStatusText(hackathon("done"), "hired", midway)).toBe("Hired");
		expect(
			builderStatusText(hackathon("deciding"), "not_this_time", midway),
		).toBe("Not this time");
	});

	it("before it starts, when it starts", () => {
		expect(builderStatusText(hackathon("open"), null, ist(14))).toBe(
			"Starts Mon, Oct 19",
		);
	});

	it("while building, when it ends", () => {
		expect(builderStatusText(hackathon("building"), null, midway)).toBe(
			"Ends Sun, Oct 25",
		);
	});

	it("after the end without a decision, Deciding", () => {
		expect(builderStatusText(hackathon("deciding"), null, ist(28))).toBe(
			"Deciding",
		);
	});

	it("closed without a decision, Closed", () => {
		expect(builderStatusText(hackathon("done"), null, ist(40))).toBe("Closed");
	});
});
