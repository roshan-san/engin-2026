import { WEEK_MS, weekStart } from "@convex/cycles/rules";
import { describe, expect, it } from "vitest";
import { dayLabel, weekdayLabel } from "~/shared/lib/dates";
import {
	buildFeed,
	type CycleView,
	type EntryView,
	entrySummary,
	findEntry,
	linkLabel,
	quietLabel,
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
	it("a verified entry names who, what and the weekday", () => {
		const verified = entry({});

		expect(entrySummary(verified)).toEqual({
			actor: "Sam",
			text: "Sent welcome sequence",
		});
		expect(weekdayLabel(verified.at)).toBe("Tue");
		expect(dayLabel(verified.at)).toBe("Tue, Oct 13");
	});

	it("an entry without its person says Someone", () => {
		expect(
			entrySummary(entry({ kind: "contributor_joined", actor: null })),
		).toEqual({ actor: "Someone", text: "joined as a Contributor" });
	});

	it("milestones name the job", () => {
		expect(
			entrySummary(
				entry({ kind: "participant_hired", job: { role: "frontend" } }),
			),
		).toEqual({ actor: "Sam", text: "was hired · Frontend" });
		expect(
			entrySummary(entry({ kind: "hackathon_finished", job: null })),
		).toEqual({ actor: null, text: "Hackathon finished · a job" });
	});

	it("a proof link drops its scheme, www and trailing slash", () => {
		expect(linkLabel("https://www.github.com/acme/app/pull/12/")).toBe(
			"github.com/acme/app/pull/12",
		);
		expect(linkLabel("https://acme.dev/")).toBe("acme.dev");
		expect(linkLabel("not a url")).toBe("not a url");
	});
});

describe("feed", () => {
	const now = weekStart("2026-W42") + 1000;

	function cycle(
		week: string,
		number: number,
		overrides: Partial<CycleView> = {},
	) {
		const startsAt = weekStart(week);
		return {
			week,
			number,
			startsAt,
			endsAt: startsAt + WEEK_MS,
			goal: null,
			shippedCount: 0,
			entries: [],
			...overrides,
		} as CycleView;
	}

	it("this week always shows, even when empty", () => {
		const items = buildFeed([cycle("2026-W42", 3)], now);

		expect(items).toEqual([
			expect.objectContaining({ kind: "cycle", isCurrent: true }),
		]);
	});

	it("a run of empty past Cycles folds into one quiet row", () => {
		const items = buildFeed(
			[
				cycle("2026-W42", 5),
				cycle("2026-W41", 4),
				cycle("2026-W40", 3),
				cycle("2026-W39", 2, { shippedCount: 1, entries: [entry({})] }),
				cycle("2026-W38", 1),
			],
			now,
		);

		expect(items.map((item) => item.kind)).toEqual([
			"cycle",
			"quiet",
			"cycle",
			"quiet",
		]);
		const quiet = items[1];
		if (quiet.kind !== "quiet") throw new Error("expected a quiet row");
		expect(quietLabel(quiet)).toEqual({
			name: "Cycles 3–4",
			dates: "Sep 28 – Oct 11",
		});
	});

	it("a past Cycle with a goal keeps its own row", () => {
		const items = buildFeed(
			[cycle("2026-W42", 2), cycle("2026-W41", 1, { goal: "Launch" })],
			now,
		);

		expect(items.map((item) => item.kind)).toEqual(["cycle", "cycle"]);
	});

	it("an open entry is found with its Cycle, or not once it's out of the list", () => {
		const opened = entry({ id: "a7" as EntryView["id"] });
		const cycles = [
			cycle("2026-W42", 2),
			cycle("2026-W41", 1, { entries: [opened] }),
		];

		expect(findEntry(cycles, "a7")).toEqual({
			entry: opened,
			cycle: cycles[1],
		});
		expect(findEntry(cycles, "gone")).toBeNull();
		expect(findEntry(cycles, undefined)).toBeNull();
	});
});
