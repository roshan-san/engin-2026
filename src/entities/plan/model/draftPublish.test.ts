import type { PlanView } from "@convex/shared/plans";
import { describe, expect, it } from "vitest";
import { draftPublish, PAYMENT_ISSUE } from "./draftPublish";

const plan: PlanView = {
	plan: "six_months",
	periodEnd: Date.UTC(2027, 3, 15, 20, 0),
	allowance: 15,
	hackathonsLeft: 15,
	running: 0,
};
const free = { plan: null, hasPaymentIssue: false, isBackFromCheckout: false };

describe("draftPublish", () => {
	it("while the plan loads, Publish goes straight to the server", () => {
		expect(draftPublish({ ...free, plan: undefined })).toEqual({
			message: null,
			isDisabled: false,
			opensPlans: false,
			managesBilling: false,
		});
		expect(draftPublish({ ...free, hasPaymentIssue: undefined })).toMatchObject(
			{ isDisabled: false, opensPlans: false },
		);
	});

	it("without Pro, Publish opens the plans", () => {
		expect(draftPublish(free)).toEqual({
			message: null,
			isDisabled: false,
			opensPlans: true,
			managesBilling: false,
		});
	});

	it("back from checkout, Publish waits for the payment instead of offering it again", () => {
		expect(draftPublish({ ...free, isBackFromCheckout: true })).toEqual({
			message: null,
			isDisabled: true,
			opensPlans: false,
			managesBilling: false,
		});
	});

	it("a failed payment sends the Founder to fix their card, not to buy again", () => {
		expect(draftPublish({ ...free, hasPaymentIssue: true })).toEqual({
			message: PAYMENT_ISSUE,
			isDisabled: true,
			opensPlans: false,
			managesBilling: true,
		});
	});

	it("a plan that can publish leaves Publish alone", () => {
		expect(draftPublish({ ...free, plan })).toEqual({
			message: null,
			isDisabled: false,
			opensPlans: false,
			managesBilling: false,
		});
	});

	it("a plan that can't publish now says why", () => {
		expect(draftPublish({ ...free, plan: { ...plan, running: 4 } })).toEqual({
			message:
				"4 Hackathons are running. Make your Decisions before you open a fifth.",
			isDisabled: true,
			opensPlans: false,
			managesBilling: false,
		});
	});
});
