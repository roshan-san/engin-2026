import type { Id } from "@convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import { canCloseReview, type ReviewDraft, toCloseArgs } from "./reviewDraft";

const draft: ReviewDraft = {
	goalMet: null,
	dropped: new Set(),
	nextGoal: "",
};
const week = "2026-W44";

describe("canCloseReview", () => {
	it("a week with a goal needs an answer", () => {
		expect(canCloseReview(draft, true)).toBe(false);
		expect(canCloseReview({ ...draft, goalMet: false }, true)).toBe(true);
	});

	it("a goalless week closes without one", () => {
		expect(canCloseReview(draft, false)).toBe(true);
	});
});

describe("toCloseArgs", () => {
	it("sends the answer and the Cards to drop, and leaves out a blank goal", () => {
		const args = toCloseArgs(
			{ goalMet: true, dropped: new Set(["a" as Id<"cards">]), nextGoal: "  " },
			{ week, currentGoal: null },
		);

		expect(args).toEqual({ week, goalMet: true, dropCardIds: ["a"] });
	});

	it("leaves out an unanswered goal", () => {
		expect(toCloseArgs(draft, { week, currentGoal: null })).toEqual({
			week,
			dropCardIds: [],
		});
	});

	it("sends a changed goal, trimmed", () => {
		const args = toCloseArgs(
			{ ...draft, nextGoal: " Twenty users " },
			{ week, currentGoal: "Ten users" },
		);

		expect(args.nextGoal).toBe("Twenty users");
	});

	it("leaves out a goal the Founder never touched, whatever it is by now", () => {
		const args = toCloseArgs(
			{ ...draft, nextGoal: null },
			{ week, currentGoal: "Edited in the bar" },
		);

		expect(args).not.toHaveProperty("nextGoal");
	});

	it("leaves out a goal that didn't change", () => {
		const args = toCloseArgs(
			{ ...draft, nextGoal: "Ten users" },
			{ week, currentGoal: "Ten users" },
		);

		expect(args).not.toHaveProperty("nextGoal");
	});
});
