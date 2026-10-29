import { PLANS } from "@convex/billing/rules";
import { describe, expect, it } from "vitest";
import { planLines, planSummary } from "./planLines";

describe("planLines", () => {
	it("one line per plan, in PLANS order", () => {
		expect(planLines().map((plan) => plan.key)).toEqual(Object.keys(PLANS));
	});

	it("says the price, the period and the Hackathons it grants", () => {
		const [monthly, sixMonths, yearly] = planLines();
		expect(monthly).toEqual({
			key: "monthly",
			name: "Monthly",
			price: "$15",
			per: "a month",
			hackathons: "1 Hackathon a month",
			isHighlighted: false,
		});
		expect(sixMonths).toMatchObject({
			price: "$50",
			per: "for 6 months",
			hackathons: "15 Hackathons upfront",
			isHighlighted: true,
		});
		expect(yearly).toMatchObject({
			price: "$90",
			per: "for 12 months",
			hackathons: "30 Hackathons upfront",
		});
	});
});

describe("planSummary", () => {
	it("says the plan, what's left and until when", () => {
		expect(
			planSummary({
				plan: "six_months",
				periodEnd: Date.UTC(2027, 3, 15, 20, 0),
				allowance: 15,
				hackathonsLeft: 14,
				running: 1,
			}),
		).toBe("6 months. 14 of 15 Hackathons left until 16 Apr 2027.");
	});
});
