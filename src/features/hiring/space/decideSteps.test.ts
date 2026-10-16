import { describe, expect, it } from "vitest";
import { decideState } from "./decideSteps";

const endsAt = 1_000;
const live = { status: "live" as const, endsAt };
const fresh = { shortlisted: false, walkthroughAt: null, decision: null };

describe("decideState", () => {
	it("while live, shortlist but don't decide", () => {
		const state = decideState(fresh, live, endsAt - 1);

		expect(state).toMatchObject({ canShortlist: true, canDecide: false });
	});

	it("the Walkthrough follows the shortlist", () => {
		expect(decideState(fresh, live, 0).canWalkthrough).toBe(false);
		expect(
			decideState({ ...fresh, shortlisted: true }, live, 0).canWalkthrough,
		).toBe(true);
	});

	it("after the end, Hired waits for the Walkthrough", () => {
		const state = decideState(
			{ ...fresh, shortlisted: true },
			{ status: "deciding", endsAt },
			endsAt + 1,
		);

		expect(state).toMatchObject({
			canDecide: true,
			canHire: false,
			hireHint: "Do the Walkthrough first",
		});
	});

	it("walked through, Hired opens", () => {
		const state = decideState(
			{ shortlisted: true, walkthroughAt: 500, decision: null },
			{ status: "deciding", endsAt },
			endsAt + 1,
		);

		expect(state).toMatchObject({ canHire: true, hireHint: null });
	});

	it("once done, nothing can change", () => {
		const state = decideState(
			{ ...fresh, shortlisted: true },
			{ status: "done", endsAt },
			endsAt + 1,
		);

		expect(state).toMatchObject({
			canShortlist: false,
			canWalkthrough: false,
			canDecide: false,
			canHire: false,
			hireHint: null,
		});
	});

	it("once decided, the decision stands", () => {
		const state = decideState(
			{ shortlisted: true, walkthroughAt: 500, decision: "hired" },
			{ status: "deciding", endsAt },
			endsAt + 1,
		);

		expect(state).toMatchObject({
			decided: "hired",
			canShortlist: false,
			canWalkthrough: false,
			canDecide: false,
			canHire: false,
		});
	});
});
