import { describe, expect, it } from "vitest";
import { showsGoalPrompt } from "./goalPrompt";

const base = {
	isFounder: true,
	goal: null,
	cardCount: 0,
	view: "list",
} as const;

describe("the goal prompt", () => {
	it("asks a Founder with no goal in the List, with or without Cards", () => {
		expect(showsGoalPrompt(base)).toBe(true);
		expect(showsGoalPrompt({ ...base, cardCount: 3 })).toBe(true);
	});

	it("goes once there's a goal", () => {
		expect(showsGoalPrompt({ ...base, goal: "Ten users" })).toBe(false);
	});

	it("is never shown to a Contributor", () => {
		expect(showsGoalPrompt({ ...base, isFounder: false })).toBe(false);
	});

	it("replaces only an empty Board", () => {
		expect(showsGoalPrompt({ ...base, view: "board" })).toBe(true);
		expect(showsGoalPrompt({ ...base, view: "board", cardCount: 1 })).toBe(
			false,
		);
	});
});
