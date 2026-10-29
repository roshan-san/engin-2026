import { describe, expect, it } from "vitest";
import {
	dayLabel,
	PLANS,
	type PlanView,
	publishBlockFor,
	publishBlockMessage,
	tierOf,
} from "./rules";

/** 15 Apr 2027 20:00 UTC is 16 Apr 2027 01:30 in IST. */
const APRIL_16_IST = Date.UTC(2027, 3, 15, 20, 0);

function view(overrides: Partial<PlanView> = {}): PlanView {
	return {
		plan: "six_months",
		periodEnd: APRIL_16_IST,
		allowance: 15,
		hackathonsLeft: 15,
		running: 0,
		...overrides,
	};
}

describe("plans", () => {
	it("the 6-month plan costs $50", () => {
		expect(PLANS.six_months.priceUsd).toBe(50);
	});

	it("a day reads in IST", () => {
		expect(dayLabel(APRIL_16_IST)).toBe("16 Apr 2027");
	});
});

describe("publishBlockFor", () => {
	it("no plan needs Pro", () => {
		expect(publishBlockFor(null)).toEqual({ reason: "no_pro" });
	});

	it("a plan with Hackathons left and room to run may publish", () => {
		expect(publishBlockFor(view({ hackathonsLeft: 1, running: 3 }))).toBeNull();
	});

	it("no Hackathons left waits for the renewal", () => {
		expect(publishBlockFor(view({ hackathonsLeft: 0 }))).toEqual({
			reason: "used_up",
			allowance: 15,
			renewsAt: APRIL_16_IST,
		});
	});

	it("4 running waits for a Decision, even with Hackathons left", () => {
		expect(publishBlockFor(view({ running: 4 }))).toEqual({
			reason: "too_many_running",
		});
	});

	it("an empty allowance is reported before the running cap", () => {
		expect(
			publishBlockFor(view({ hackathonsLeft: 0, running: 4 }))?.reason,
		).toBe("used_up");
	});
});

describe("publishBlockMessage", () => {
	it("says each reason calmly", () => {
		expect(publishBlockMessage({ reason: "no_pro" })).toBe(
			"Publishing needs Pro. Your draft is saved.",
		);
		expect(
			publishBlockMessage({
				reason: "used_up",
				allowance: 1,
				renewsAt: APRIL_16_IST,
			}),
		).toBe("You've published the Hackathon on your plan. More on 16 Apr 2027.");
		expect(
			publishBlockMessage({
				reason: "used_up",
				allowance: 15,
				renewsAt: APRIL_16_IST,
			}),
		).toBe(
			"You've published all 15 Hackathons on your plan. More on 16 Apr 2027.",
		);
		expect(publishBlockMessage({ reason: "too_many_running" })).toBe(
			"4 Hackathons are running. Make your Decisions before you open a fifth.",
		);
	});
});

describe("tierOf", () => {
	it("a Rating under 1000 is Tier 1", () => {
		expect(tierOf(0)).toBe(1);
		expect(tierOf(999)).toBe(1);
	});

	it("1000 to 1149 is Tier 2", () => {
		expect(tierOf(1000)).toBe(2);
		expect(tierOf(1149)).toBe(2);
	});

	it("1150 to 1299 is Tier 3", () => {
		expect(tierOf(1150)).toBe(3);
		expect(tierOf(1299)).toBe(3);
	});

	it("1300 to 1449 is Tier 4", () => {
		expect(tierOf(1300)).toBe(4);
		expect(tierOf(1449)).toBe(4);
	});

	it("1450 and up is Tier 5", () => {
		expect(tierOf(1450)).toBe(5);
		expect(tierOf(2400)).toBe(5);
	});

	it("a fractional Rating takes the band it falls in", () => {
		expect(tierOf(1149.6)).toBe(2);
	});
});
