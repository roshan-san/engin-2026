import { describe, expect, it } from "vitest";
import { showsGoalPrompt } from "./goalPrompt";

const base = { isFounder: true, goal: null, cardCount: 0 };

describe("the goal prompt", () => {
	it("replaces a Founder's empty Board", () => {
		expect(showsGoalPrompt(base)).toBe(true);
	});

	it("leaves a Board with Cards alone", () => {
		expect(showsGoalPrompt({ ...base, cardCount: 1 })).toBe(false);
	});

	it("goes once there's a goal", () => {
		expect(showsGoalPrompt({ ...base, goal: "Ten users" })).toBe(false);
	});

	it("is never shown to a Contributor, who keeps the Board", () => {
		expect(showsGoalPrompt({ ...base, isFounder: false })).toBe(false);
	});
});
