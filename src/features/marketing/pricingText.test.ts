import { PLANS } from "@convex/shared/plans";
import { describe, expect, it } from "vitest";
import { planLines } from "./pricingText";

describe("planLines", () => {
	it("one line per plan, in PLANS order", () => {
		expect(planLines().map((plan) => plan.key)).toEqual(Object.keys(PLANS));
	});

	it("says the price, the period and the hackathons it grants", () => {
		expect(planLines()[0]).toEqual({
			key: "monthly",
			name: "Monthly",
			price: "$15",
			per: "per month",
			hackathons: "1 hackathon to publish",
		});
		expect(planLines()[2].per).toBe("per 12 months");
	});
});
