import { describe, expect, it } from "vitest";
import { shiftWeek, weekOf, weekStart } from "../cycles/rules";
import { DAY } from "../testing/test.setup";
import {
	buildParts,
	consistencyOf,
	countedWeeks,
	nextMomentum,
	outcomeOf,
	outcomeScore,
	personTarget,
	startupTarget,
	weekVolume,
} from "./model";

describe("momentum math", () => {
	it("each Card counts fully up to 5 a week, and barely after", () => {
		expect(weekVolume(0)).toBe(0);
		expect(weekVolume(3)).toBe(0.6);
		expect(weekVolume(5)).toBe(1);
		expect(weekVolume(10)).toBeCloseTo(1.1);
		expect(weekVolume(40)).toBeCloseTo(1.2);
	});

	it("the parts read consistency and volume from weekly counts", () => {
		const parts = buildParts([0, 2, 0, 6]);

		expect(parts).toMatchObject({
			active: 2,
			weeks: 4,
			consistency: 0.5,
			perWeek: 2,
		});
		expect(parts.volume).toBeCloseTo((0 + 0.4 + 0 + 1.02) / 4);
	});

	it("no counted weeks gives all-zero parts", () => {
		expect(buildParts([])).toEqual({
			active: 0,
			weeks: 0,
			consistency: 0,
			volume: 0,
			perWeek: 0,
		});
	});

	it("a Startup that ships 5 every week targets 1600, a silent one 800", () => {
		expect(startupTarget(buildParts(Array(12).fill(5)))).toBe(1600);
		expect(startupTarget(buildParts(Array(12).fill(0)))).toBe(800);
	});

	it("a week's credit is its best approval, and only active weeks count", () => {
		const week = (active: boolean, credit: number) => ({ active, credit });

		expect(
			consistencyOf([
				week(true, 1),
				week(false, 0),
				week(true, 0.25),
				week(true, 1),
				week(false, 0),
				week(true, 0.25),
			]),
		).toEqual({ consistency: 0.625, active: 4, shipped: 4 });
	});

	it("under 4 active weeks, the missing ones count as 0.25", () => {
		expect(
			consistencyOf([
				{ active: true, credit: 1 },
				{ active: false, credit: 0 },
				{ active: true, credit: 0.25 },
			]),
		).toEqual({ consistency: 0.4375, active: 2, shipped: 2 });
		expect(consistencyOf([{ active: true, credit: 1 }]).consistency).toBe(
			0.4375,
		);
		expect(consistencyOf([{ active: true, credit: 0.25 }]).consistency).toBe(
			0.25,
		);
	});

	it("an active week with nothing approved counts as 0", () => {
		expect(
			consistencyOf([
				{ active: true, credit: 1 },
				{ active: true, credit: 1 },
				{ active: true, credit: 1 },
				{ active: true, credit: 0 },
			]),
		).toEqual({ consistency: 0.75, active: 4, shipped: 3 });
	});

	it("a steady self-approving Founder targets 1000", () => {
		expect(personTarget(0.25, 0)).toBe(1000);
		expect(personTarget(1, 1)).toBe(1660);
	});

	it("outcomes sum their points and cap at 1", () => {
		expect(outcomeScore(["hired", "finalist"])).toBe(1);
		expect(outcomeScore(["built"])).toBe(0.2);
		expect(outcomeScore([])).toBe(0);
	});

	it("a Participant's outcome is Hired, then Finalist, then Built", () => {
		expect(
			outcomeOf(
				{ status: "participating", decision: "hired", shortlisted: true },
				true,
			),
		).toBe("hired");
		expect(
			outcomeOf(
				{
					status: "participating",
					decision: "not_this_time",
					shortlisted: true,
				},
				true,
			),
		).toBe("finalist");
		expect(
			outcomeOf(
				{
					status: "participating",
					decision: "not_this_time",
					shortlisted: false,
				},
				true,
			),
		).toBe("built");
		for (const status of ["declined", "applied"]) {
			expect(outcomeOf({ status, shortlisted: false }, true)).toBeNull();
		}
	});

	it("only Hired counts without a Done Card", () => {
		expect(
			outcomeOf(
				{ status: "participating", decision: "hired", shortlisted: true },
				false,
			),
		).toBe("hired");
		for (const shortlisted of [true, false]) {
			expect(
				outcomeOf({ status: "participating", shortlisted }, false),
			).toBeNull();
		}
	});

	it("the Momentum rises faster than it falls", () => {
		expect(nextMomentum(1000, 1400)).toBe(1100);
		expect(nextMomentum(1000, 800)).toBe(980);
	});

	describe("counted weeks", () => {
		const throughWeek = "2026-W40";
		const throughStart = weekStart(throughWeek);

		it("a Startup created this week has no finished week yet", () => {
			const created = weekStart(shiftWeek(throughWeek, 1)) + DAY;

			expect(countedWeeks(created, throughWeek)).toEqual([]);
		});

		it("a young Startup counts only the weeks since it signed up", () => {
			const created = throughStart - 3 * 7 * DAY + DAY;

			expect(countedWeeks(created, throughWeek)).toEqual([
				"2026-W37",
				"2026-W38",
				"2026-W39",
				"2026-W40",
			]);
		});

		it("an older Startup counts the last 12 weeks", () => {
			const created = throughStart - 30 * 7 * DAY;

			const weeks = countedWeeks(created, throughWeek);

			expect(weeks).toHaveLength(12);
			expect(weeks[0]).toBe("2026-W29");
			expect(weeks[11]).toBe(throughWeek);
			expect(weekOf(created) < weeks[0]).toBe(true);
		});
	});
});
