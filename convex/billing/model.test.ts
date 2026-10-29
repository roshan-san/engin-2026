import { describe, expect, it } from "vitest";
import { planViewFor } from "./model";
import { PLANS } from "./rules";

const monthly = {
	plan: "monthly",
	periodEnd: 123,
} as Parameters<typeof planViewFor>[0];

describe("planViewFor", () => {
	it("planViewFor counts what is left of the allowance", () => {
		expect(planViewFor(monthly, { published: 1, running: 2 })).toEqual({
			plan: "monthly",
			periodEnd: 123,
			allowance: PLANS.monthly.hackathonsPerPeriod,
			hackathonsLeft: PLANS.monthly.hackathonsPerPeriod - 1,
			running: 2,
		});
	});

	it("planViewFor with nothing published leaves the full allowance", () => {
		expect(planViewFor(monthly, { published: 0, running: 0 })).toEqual({
			plan: "monthly",
			periodEnd: 123,
			allowance: PLANS.monthly.hackathonsPerPeriod,
			hackathonsLeft: PLANS.monthly.hackathonsPerPeriod,
			running: 0,
		});
	});
});
