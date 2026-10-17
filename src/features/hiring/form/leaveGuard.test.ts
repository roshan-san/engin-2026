import { describe, expect, it } from "vitest";
import { draftCard, emptyDraft, type HackathonDraft } from "./draft";
import { shouldBlockLeave } from "./leaveGuard";

describe("shouldBlockLeave", () => {
	const initial: HackathonDraft = {
		...emptyDraft(0),
		problem: "Signups drop off",
		cards: [draftCard("Fix signup", "Start with the form")],
	};
	const changed: HackathonDraft = {
		...initial,
		problem: "Signups drop off a lot",
	};

	it("lets the Founder leave an untouched form", () => {
		expect(shouldBlockLeave(initial, initial, null, false)).toBe(false);
	});

	it("asks before leaving changed work", () => {
		expect(shouldBlockLeave(changed, initial, null, false)).toBe(true);
	});

	it("doesn't ask while a save or publish is in flight", () => {
		expect(shouldBlockLeave(changed, initial, "save", false)).toBe(false);
		expect(shouldBlockLeave(changed, initial, "publish", false)).toBe(false);
	});

	it("doesn't ask once the work is saved", () => {
		expect(shouldBlockLeave(changed, initial, null, true)).toBe(false);
	});

	it("ignores the keys that only keep Card rows apart", () => {
		const rekeyed: HackathonDraft = {
			...initial,
			cards: initial.cards.map((card) => ({ ...card, key: "another-key" })),
		};
		expect(shouldBlockLeave(rekeyed, initial, null, false)).toBe(false);
	});

	it("asks when a Card changes", () => {
		const edited: HackathonDraft = {
			...initial,
			cards: initial.cards.map((card) => ({ ...card, title: "Fix login" })),
		};
		expect(shouldBlockLeave(edited, initial, null, false)).toBe(true);
	});
});
