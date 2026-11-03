import { describe, expect, it } from "vitest";
import type { HackathonPhase } from "../hackathons/rules";
import {
	type ApplicationAction,
	applicationRefusal,
	type RuledApplication,
} from "./rules";

const applied: RuledApplication = { status: "applied", shortlisted: false };
const declined: RuledApplication = { status: "declined", shortlisted: false };
const participant: RuledApplication = {
	status: "participating",
	shortlisted: false,
};
const starred: RuledApplication = { ...participant, shortlisted: true };
const requested: RuledApplication = { ...starred, walkthroughRequestedAt: 400 };
const walkedThrough: RuledApplication = {
	...requested,
	walkthroughAt: 500,
};

const ACCEPT: ApplicationAction = { kind: "accept", participants: 0 };
const DECLINE: ApplicationAction = { kind: "decline" };
const STAR: ApplicationAction = { kind: "shortlist", on: true };
const UNSTAR: ApplicationAction = { kind: "shortlist", on: false };
const WALKTHROUGH: ApplicationAction = { kind: "walkthrough" };
const REQUEST: ApplicationAction = { kind: "requestWalkthrough" };
const HIRE: ApplicationAction = { kind: "decide", decision: "hired" };
const PASS: ApplicationAction = { kind: "decide", decision: "not_this_time" };

const DECIDE_STEPS = [STAR, UNSTAR, REQUEST, WALKTHROUGH, HIRE, PASS];
const AFTER_OPEN: HackathonPhase[] = ["live", "deciding", "done"];

describe("Screening", () => {
	it("while Open, the Founder accepts and declines Applicants", () => {
		expect(applicationRefusal(applied, "open", ACCEPT)).toBeNull();
		expect(applicationRefusal(applied, "open", DECLINE)).toBeNull();
	});

	it("a Declined Applicant can be accepted again, and a Participant removed", () => {
		expect(applicationRefusal(declined, "open", ACCEPT)).toBeNull();
		expect(applicationRefusal(participant, "open", DECLINE)).toBeNull();
	});

	it("after Open, nobody is accepted or declined", () => {
		for (const phase of AFTER_OPEN) {
			for (const action of [ACCEPT, DECLINE]) {
				expect(applicationRefusal(applied, phase, action)).toBe(
					"Applications are closed",
				);
			}
		}
	});

	it("the 11th Participant is refused", () => {
		const full: ApplicationAction = { kind: "accept", participants: 10 };

		expect(applicationRefusal(applied, "open", full)).toBe(
			"10 Builders is the limit",
		);
	});

	it("each happens once", () => {
		expect(applicationRefusal(participant, "open", ACCEPT)).toBe(
			"They're already a Builder",
		);
		expect(applicationRefusal(declined, "open", DECLINE)).toBe(
			"They're already declined",
		);
	});
});

describe("the Decide steps", () => {
	it("wait for the start", () => {
		for (const action of DECIDE_STEPS) {
			expect(applicationRefusal(starred, "open", action)).toBe(
				"This Hackathon isn't running",
			);
		}
	});

	it("stop once the Hackathon is Done", () => {
		for (const action of DECIDE_STEPS) {
			expect(applicationRefusal(walkedThrough, "done", action)).toBe(
				"This Hackathon has ended",
			);
		}
	});

	it("are only for Participants", () => {
		for (const application of [applied, declined]) {
			expect(applicationRefusal(application, "live", STAR)).toBe(
				"They're not a Builder",
			);
		}
	});

	it("while Live, the Founder shortlists and walks through, but doesn't decide", () => {
		expect(applicationRefusal(participant, "live", STAR)).toBeNull();
		expect(applicationRefusal(requested, "live", WALKTHROUGH)).toBeNull();
		expect(applicationRefusal(walkedThrough, "live", PASS)).toBe(
			"Decide after the Hackathon ends",
		);
	});

	it("the Walkthrough needs the ★, and happens once", () => {
		expect(applicationRefusal(participant, "live", WALKTHROUGH)).toBe(
			"Shortlist them first",
		);
		expect(applicationRefusal(walkedThrough, "live", WALKTHROUGH)).toBe(
			"The Walkthrough is done",
		);
	});

	it("requesting the Walkthrough needs the ★, and happens once", () => {
		expect(applicationRefusal(participant, "live", REQUEST)).toBe(
			"Shortlist them first",
		);
		expect(applicationRefusal(starred, "live", REQUEST)).toBeNull();
		expect(applicationRefusal(requested, "live", REQUEST)).toBe(
			"The Walkthrough is requested",
		);
	});

	it("the Walkthrough is done only after it's requested", () => {
		expect(applicationRefusal(starred, "live", WALKTHROUGH)).toBe(
			"Request the Walkthrough first",
		);
	});

	it("the ★ stays once the Walkthrough is requested", () => {
		expect(applicationRefusal(requested, "live", UNSTAR)).toBe(
			"The Walkthrough is requested",
		);
	});

	it("an old row walked through without a request counts as requested", () => {
		const old: RuledApplication = { ...starred, walkthroughAt: 500 };
		expect(applicationRefusal(old, "live", REQUEST)).toBe(
			"The Walkthrough is done",
		);
		expect(applicationRefusal(old, "live", UNSTAR)).toBe(
			"The Walkthrough is done",
		);
	});

	it("the ★ comes off until the Walkthrough, then stays", () => {
		expect(applicationRefusal(starred, "live", UNSTAR)).toBeNull();
		expect(applicationRefusal(walkedThrough, "live", UNSTAR)).toBe(
			"The Walkthrough is done",
		);
	});

	it("while Deciding, Not this time is open to anyone, Hired only after the Walkthrough", () => {
		expect(applicationRefusal(participant, "deciding", PASS)).toBeNull();
		expect(applicationRefusal(requested, "deciding", HIRE)).toBe(
			"Do the Walkthrough first",
		);
		expect(applicationRefusal(walkedThrough, "deciding", HIRE)).toBeNull();
	});

	it("once decided, nothing changes", () => {
		const decided: RuledApplication = { ...walkedThrough, decision: "hired" };

		for (const action of DECIDE_STEPS) {
			expect(applicationRefusal(decided, "deciding", action)).toBe(
				"They're already decided",
			);
		}
	});
});

describe("Ask", () => {
	const ASK: ApplicationAction = { kind: "ask", privateThreads: 0 };

	it("the Founder asks Applicants and Builders until the Hackathon is done", () => {
		expect(applicationRefusal(applied, "open", ASK)).toBeNull();
		expect(applicationRefusal(participant, "live", ASK)).toBeNull();
		expect(applicationRefusal(participant, "done", ASK)).toBe(
			"This Hackathon has ended",
		);
	});

	it("a declined Applicant can't be asked", () => {
		expect(applicationRefusal(declined, "open", ASK)).toBe(
			"They're already declined",
		);
	});

	it("Ask stops at 90 threads", () => {
		expect(
			applicationRefusal(applied, "open", { kind: "ask", privateThreads: 90 }),
		).toBe("Ask up to 90 people");
	});
});
