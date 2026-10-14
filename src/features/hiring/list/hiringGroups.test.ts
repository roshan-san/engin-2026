import { describe, expect, it } from "vitest";
import {
	groupHackathons,
	type HiringRow,
	hiringSummary,
	needsYou,
	promiseLine,
	rowNumber,
} from "./hiringGroups";

function row(overrides: Partial<HiringRow>): HiringRow {
	return {
		_id: "h1" as HiringRow["_id"],
		job: { role: "frontend", pay: "6_9l", mode: "remote" },
		status: "open",
		weeks: 1,
		startsAt: 0,
		endsAt: 0,
		decideBy: 0,
		applicantCount: 0,
		builderCount: 0,
		toReview: 0,
		toDecide: 0,
		hires: 0,
		promisesKept: 0,
		promisesAnswered: 0,
		undecided: 0,
		...overrides,
	};
}

describe("groups", () => {
	it("open, building and deciding are Now; drafts and done are their own", () => {
		const rows = [
			row({ _id: "a" as HiringRow["_id"], status: "open" }),
			row({ _id: "b" as HiringRow["_id"], status: "draft" }),
			row({ _id: "c" as HiringRow["_id"], status: "building" }),
			row({ _id: "d" as HiringRow["_id"], status: "done" }),
			row({ _id: "e" as HiringRow["_id"], status: "deciding" }),
		];

		const groups = groupHackathons(rows, true);

		expect(groups.now.map((r) => r._id)).toEqual(["a", "c", "e"]);
		expect(groups.drafts.map((r) => r._id)).toEqual(["b"]);
		expect(groups.past.map((r) => r._id)).toEqual(["d"]);
	});

	it("Contributors get no drafts", () => {
		const groups = groupHackathons([row({ status: "draft" })], false);

		expect(groups.drafts).toEqual([]);
	});
});

describe("row number", () => {
	it("open shows how many applied", () => {
		expect(rowNumber(row({ status: "open", applicantCount: 12 }))).toBe(
			"12 applied",
		);
	});

	it("building shows what's waiting for review", () => {
		expect(rowNumber(row({ status: "building", toReview: 4 }))).toBe(
			"4 to review",
		);
	});

	it("deciding shows who's left to decide", () => {
		expect(rowNumber(row({ status: "deciding", toDecide: 3 }))).toBe(
			"3 to decide",
		);
	});

	it("a draft says so", () => {
		expect(rowNumber(row({ status: "draft" }))).toBe("Draft");
	});

	it("done shows the outcome", () => {
		expect(rowNumber(row({ status: "done", hires: 1 }))).toBe("1 hired");
		expect(rowNumber(row({ status: "done" }))).toBe("No hire");
		expect(rowNumber(row({ status: "done", undecided: 2 }))).toBe(
			"2 didn't decide",
		);
		expect(rowNumber(row({ status: "done", hires: 1, undecided: 1 }))).toBe(
			"1 hired · 1 didn't decide",
		);
	});
});

describe("promise line", () => {
	it("shows only once Builders answered", () => {
		expect(promiseLine(row({ status: "done" }))).toBeNull();
		expect(
			promiseLine(
				row({ status: "done", promisesKept: 3, promisesAnswered: 3 }),
			),
		).toBe("promises kept 3/3");
	});
});

describe("needsYou", () => {
	it("Cards to review and Builders to decide wait on the Founder", () => {
		expect(needsYou(row({ status: "building", toReview: 2 }))).toBe(true);
		expect(needsYou(row({ status: "deciding", toDecide: 1 }))).toBe(true);
	});

	it("applicants and finished Hackathons don't", () => {
		expect(needsYou(row({ status: "building", toReview: 0 }))).toBe(false);
		expect(needsYou(row({ status: "open", applicantCount: 9 }))).toBe(false);
		expect(needsYou(row({ status: "done", hires: 1 }))).toBe(false);
	});
});

describe("hiringSummary", () => {
	const withStatus = (status: HiringRow["status"]) => row({ status });

	it("counts running, drafts and past for the Founder", () => {
		expect(
			hiringSummary(
				[
					withStatus("open"),
					withStatus("building"),
					withStatus("draft"),
					withStatus("done"),
				],
				true,
			),
		).toBe("2 running · 1 draft · 1 past");
	});

	it("hides drafts from a Contributor", () => {
		expect(
			hiringSummary([withStatus("draft"), withStatus("deciding")], false),
		).toBe("1 running");
	});

	it("says nothing with no Hackathons", () => {
		expect(hiringSummary([], true)).toBeNull();
	});

	it("pluralises drafts", () => {
		expect(
			hiringSummary([withStatus("draft"), withStatus("draft")], true),
		).toBe("2 drafts");
	});
});
