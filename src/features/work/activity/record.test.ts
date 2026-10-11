import { WEEK_COUNT_CAP } from "@convex/lib/limits";
import { weekStart } from "@convex/work/cycles.rules";
import { describe, expect, it } from "vitest";
import {
	type EntryView,
	entryText,
	ratingChangeLabel,
	stripLevel,
	stripTooltip,
} from "./record";

const sam = { _id: "u1", name: "Sam", username: "sam", image: null };

function entry(overrides: Partial<EntryView>): EntryView {
	return {
		id: "a1",
		kind: "card_verified",
		// Tuesday Oct 13 2026, 10:00 IST.
		at: Date.parse("2026-10-13T04:30:00Z"),
		actor: sam,
		line: "Sent welcome sequence",
		selfVerified: false,
		card: null,
		job: null,
		...overrides,
	} as EntryView;
}

describe("record", () => {
	it("a Rating change reads as a quiet arrow", () => {
		expect(ratingChangeLabel(12)).toEqual({ text: "▲ 12", direction: "up" });
		expect(ratingChangeLabel(-8)).toEqual({ text: "▼ 8", direction: "down" });
		expect(ratingChangeLabel(0)).toEqual({ text: "", direction: "flat" });
	});

	it("the strip shades by count, blank before Engin", () => {
		expect([null, 0, 1, 3, 5, 9].map(stripLevel)).toEqual([
			null,
			0,
			1,
			2,
			3,
			4,
		]);
	});

	it("a strip cell names its week and count", () => {
		const startsAt = weekStart("2026-W42");

		expect(stripTooltip({ startsAt, count: 3 })).toBe(
			"Oct 12 – 18 · 3 verified",
		);
		expect(stripTooltip({ startsAt, count: WEEK_COUNT_CAP })).toBe(
			"Oct 12 – 18 · 50+ verified",
		);
		expect(stripTooltip({ startsAt, count: null })).toBe("Before Engin");
	});

	it("a verified entry names who, what and the weekday", () => {
		expect(entryText(entry({}))).toBe(
			"Sam · Sent welcome sequence · verified · Tue",
		);
		expect(entryText(entry({ selfVerified: true }))).toBe(
			"Sam · Sent welcome sequence · Self-verified · Tue",
		);
	});

	it("an entry without its person says Someone", () => {
		expect(entryText(entry({ kind: "contributor_joined", actor: null }))).toBe(
			"Someone joined",
		);
	});

	it("milestones name the job", () => {
		expect(
			entryText(entry({ kind: "builder_hired", job: { role: "frontend" } })),
		).toBe("Hired Sam · Frontend");
		expect(entryText(entry({ kind: "hackathon_finished", job: null }))).toBe(
			"Hackathon finished · a job",
		);
	});
});
