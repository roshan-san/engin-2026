import { describe, expect, it } from "vitest";
import {
	draftCard,
	emptyDraft,
	fromBuildersGet,
	type HackathonDraft,
	isDraftReady,
	toBuildersGet,
} from "./draft";

describe("what Builders get", () => {
	it("Nothing stores nothing", () => {
		expect(toBuildersGet("Nothing", "")).toBeUndefined();
	});

	it("Custom stores the trimmed text", () => {
		expect(toBuildersGet("Custom", "  Lunch  ")).toBe("Lunch");
		expect(toBuildersGet("Custom", "   ")).toBeUndefined();
	});

	it("a chip stores its label", () => {
		expect(toBuildersGet("₹1,000 per finalist", "")).toBe(
			"₹1,000 per finalist",
		);
	});

	it("reads back as the chip, or as Custom", () => {
		expect(fromBuildersGet(null)).toEqual({ choice: "Nothing", custom: "" });
		expect(fromBuildersGet("₹5,000 to the hire")).toEqual({
			choice: "₹5,000 to the hire",
			custom: "",
		});
		expect(fromBuildersGet("Lunch")).toEqual({
			choice: "Custom",
			custom: "Lunch",
		});
	});
});

describe("isDraftReady", () => {
	const ready: HackathonDraft = {
		...emptyDraft(0),
		job: { role: "frontend", pay: "6_9l", mode: "remote" },
		problem: "Signups drop off",
		cards: [
			draftCard("Fix signup"),
			draftCard("Add onboarding"),
			draftCard("Track drop-off"),
		],
	};

	it("needs the job, the problem, 3 titled Cards and a start", () => {
		expect(isDraftReady(ready)).toBe(true);
		expect(isDraftReady({ ...ready, job: { ...ready.job, role: null } })).toBe(
			false,
		);
		expect(isDraftReady({ ...ready, problem: "  " })).toBe(false);
		expect(isDraftReady({ ...ready, cards: ready.cards.slice(0, 2) })).toBe(
			false,
		);
		expect(
			isDraftReady({
				...ready,
				cards: [...ready.cards.slice(0, 2), draftCard(" ")],
			}),
		).toBe(false);
		expect(isDraftReady({ ...ready, startsAt: null })).toBe(false);
	});
});
