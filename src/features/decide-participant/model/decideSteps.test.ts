import { describe, expect, it } from "vitest";
import { decideState } from "./decideSteps";

const endsAt = 1_000;
const deciding = { status: "deciding" as const, endsAt };
const shortlisted = {
	status: "participating" as const,
	shortlisted: true,
	walkthroughRequestedAt: 400,
	walkthroughAt: null,
	decision: null,
};

describe("decideState", () => {
	it("starred but not requested, the request opens and the done step waits", () => {
		const state = decideState(
			{ ...shortlisted, walkthroughRequestedAt: null },
			{ status: "live", endsAt },
			0,
		);

		expect(state).toMatchObject({
			canRequestWalkthrough: true,
			canWalkthrough: false,
		});
	});

	it("while live, the steps are open but the decision isn't, and nothing hints", () => {
		const state = decideState(shortlisted, { status: "live", endsAt }, 0);

		expect(state).toMatchObject({
			// Requested, so the ★ stays.
			canShortlist: false,
			canWalkthrough: true,
			canDecide: false,
			hireHint: null,
		});
	});

	it("after the end, Hired says it waits for the Walkthrough", () => {
		const state = decideState(shortlisted, deciding, endsAt + 1);

		expect(state).toMatchObject({
			canDecide: true,
			canHire: false,
			hireHint: "Do the Walkthrough first",
		});
	});

	it("walked through, the ★ stays and Hired opens", () => {
		const state = decideState(
			{ ...shortlisted, walkthroughAt: 500 },
			deciding,
			endsAt + 1,
		);

		expect(state).toMatchObject({
			canShortlist: false,
			canHire: true,
			hireHint: null,
		});
	});

	it("once decided, it says what was decided", () => {
		const state = decideState(
			{ ...shortlisted, walkthroughAt: 500, decision: "hired" },
			deciding,
			endsAt + 1,
		);

		expect(state).toMatchObject({ decided: "hired", canDecide: false });
	});
});
