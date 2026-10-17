import { describe, expect, it } from "vitest";
import {
	draftCard,
	emptyDraft,
	fromParticipantsGet,
	type HackathonDraft,
	isDraftReady,
	missingParts,
	toParticipantsGet,
} from "./draft";

describe("what Participants get", () => {
	it("Nothing stores nothing", () => {
		expect(toParticipantsGet("Nothing", "")).toBeUndefined();
	});

	it("Custom stores the trimmed text", () => {
		expect(toParticipantsGet("Custom", "  Lunch  ")).toBe("Lunch");
		expect(toParticipantsGet("Custom", "   ")).toBeUndefined();
	});

	it("a chip stores its label", () => {
		expect(toParticipantsGet("₹1,000 per finalist", "")).toBe(
			"₹1,000 per finalist",
		);
	});

	it("reads back as the chip, or as Custom", () => {
		expect(fromParticipantsGet(null)).toEqual({
			choice: "Nothing",
			custom: "",
		});
		expect(fromParticipantsGet("₹5,000 to the hire")).toEqual({
			choice: "₹5,000 to the hire",
			custom: "",
		});
		expect(fromParticipantsGet("Lunch")).toEqual({
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

describe("missingParts", () => {
	it("a new draft still needs the job, the problem and its Cards", () => {
		expect(missingParts(emptyDraft(Date.now()))).toEqual([
			"a role",
			"the pay",
			"where",
			"the problem",
			"at least 3 Cards",
		]);
	});

	it("one untitled Card is named once", () => {
		const draft: HackathonDraft = {
			...emptyDraft(Date.now()),
			job: { role: "frontend", pay: "6_9l", mode: "remote" },
			problem: "Signup drops people",
			cards: [draftCard("A"), draftCard("B"), draftCard(" ")],
		};

		expect(missingParts(draft)).toEqual(["a Card title"]);
	});

	it("an empty Custom line is named; a written one isn't", () => {
		const draft: HackathonDraft = {
			...emptyDraft(Date.now()),
			job: { role: "frontend", pay: "6_9l", mode: "remote" },
			problem: "Signup drops people",
			cards: [draftCard("A"), draftCard("B"), draftCard("C")],
		};

		expect(
			missingParts({
				...draft,
				participantsGet: { choice: "Custom", custom: "  " },
			}),
		).toContain("what Participants get");
		expect(
			missingParts({
				...draft,
				participantsGet: { choice: "Custom", custom: "A laptop" },
			}),
		).not.toContain("what Participants get");
	});
});
