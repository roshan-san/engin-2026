import { describe, expect, it } from "vitest";
import { participantOptionLabel } from "./participantOptionLabel";

const asha = {
	name: "Asha",
	decision: null,
	isJoined: false,
	reviewCount: 0,
	unread: false,
} as const;

describe("participantOptionLabel", () => {
	it("a decision wins over everything else", () => {
		expect(
			participantOptionLabel({
				...asha,
				decision: "hired",
				reviewCount: 2,
				unread: true,
			}),
		).toBe("Asha · Offer");
	});

	it("an Offer they took reads Joined", () => {
		expect(
			participantOptionLabel({ ...asha, decision: "hired", isJoined: true }),
		).toBe("Asha · Joined");
	});

	it("names a Not this time decision", () => {
		expect(participantOptionLabel({ ...asha, decision: "not_this_time" })).toBe(
			"Asha · Not this time",
		);
	});

	it("shows Cards to review and an unread thread", () => {
		expect(
			participantOptionLabel({ ...asha, reviewCount: 2, unread: true }),
		).toBe("Asha · 2 to review · unread");
	});

	it("shows only the Cards to review when the thread is read", () => {
		expect(participantOptionLabel({ ...asha, reviewCount: 1 })).toBe(
			"Asha · 1 to review",
		);
	});

	it("shows only unread when nothing is waiting", () => {
		expect(participantOptionLabel({ ...asha, unread: true })).toBe(
			"Asha · unread",
		);
	});

	it("is just the name when all is clear", () => {
		expect(participantOptionLabel(asha)).toBe("Asha");
	});
});
