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
	it("What Builders get starts unpicked and blocks saving", () => {
		const draft = emptyDraft(Date.now());

		expect(draft.participantsGet.choice).toBe("");
		expect(missingParts(draft)).toContain("what Builders get");
		expect(
			missingParts({
				...draft,
				participantsGet: { choice: "Nothing", custom: "" },
			}),
		).not.toContain("what Builders get");
	});

	it("Nothing is stored as Nothing", () => {
		expect(toParticipantsGet("Nothing", "")).toBe("Nothing");
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
		expect(fromParticipantsGet("Nothing")).toEqual({
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
		job: {
			title: "Frontend",
			discipline: "developer",
			pay: "6_9l",
			mode: "remote",
		},
		problem: "Signups drop off",
		participantsGet: { choice: "Nothing", custom: "" },
		cards: [
			draftCard("Fix signup"),
			draftCard("Add onboarding"),
			draftCard("Track drop-off"),
		],
	};

	it("needs the job, the problem, 3 titled Cards, a start and what Builders get", () => {
		expect(isDraftReady(ready)).toBe(true);
		expect(
			isDraftReady({ ...ready, job: { ...ready.job, discipline: null } }),
		).toBe(false);
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
		expect(
			isDraftReady({ ...ready, participantsGet: { choice: "", custom: "" } }),
		).toBe(false);
	});
});

describe("missingParts", () => {
	it("a new draft still needs the job, the problem, its Cards and what Builders get", () => {
		expect(missingParts(emptyDraft(Date.now()))).toEqual([
			"a title",
			"a discipline",
			"the pay",
			"where",
			"the problem",
			"at least 3 Cards",
			"what Builders get",
		]);
	});

	it("a title of only spaces still needs writing", () => {
		const draft: HackathonDraft = {
			...emptyDraft(Date.now()),
			job: { title: "   ", discipline: "sales", pay: "6_9l", mode: "remote" },
		};

		expect(missingParts(draft)).toContain("a title");
		expect(missingParts(draft)).not.toContain("a discipline");
	});

	it("one untitled Card is named once", () => {
		const draft: HackathonDraft = {
			...emptyDraft(Date.now()),
			job: {
				title: "Frontend",
				discipline: "developer",
				pay: "6_9l",
				mode: "remote",
			},
			problem: "Signup drops people",
			participantsGet: { choice: "Nothing", custom: "" },
			cards: [draftCard("A"), draftCard("B"), draftCard(" ")],
		};

		expect(missingParts(draft)).toEqual(["a Card title"]);
	});

	it("an empty Custom line is named; a written one isn't", () => {
		const draft: HackathonDraft = {
			...emptyDraft(Date.now()),
			job: {
				title: "Frontend",
				discipline: "developer",
				pay: "6_9l",
				mode: "remote",
			},
			problem: "Signup drops people",
			cards: [draftCard("A"), draftCard("B"), draftCard("C")],
		};

		expect(
			missingParts({
				...draft,
				participantsGet: { choice: "Custom", custom: "  " },
			}),
		).toContain("what Builders get");
		expect(
			missingParts({
				...draft,
				participantsGet: { choice: "Custom", custom: "A laptop" },
			}),
		).not.toContain("what Builders get");
	});
});
