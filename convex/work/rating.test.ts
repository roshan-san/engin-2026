import { describe, expect, it } from "vitest";
import { DAY } from "../lib/testing.helpers";
import { shiftWeek, weekOf, weekStart } from "../shared/cycles";
import {
	buildParts,
	countedWeeks,
	nextRating,
	outcomeOf,
	outcomeScore,
	personTarget,
	startupTarget,
	weekVolume,
} from "../model/rating";

describe("rating math", () => {
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

	it("a person's target adds Hackathon outcomes at 20%", () => {
		expect(personTarget(buildParts([]), 1)).toBe(960);
	});

	it("outcomes sum their points and cap at 1", () => {
		expect(outcomeScore(["hired", "finalist"])).toBe(1);
		expect(outcomeScore(["built"])).toBe(0.2);
		expect(outcomeScore([])).toBe(0);
	});

	it("a Builder's outcome is Hired, then Finalist, then Built", () => {
		expect(
			outcomeOf({ status: "building", decision: "hired", shortlisted: true }),
		).toBe("hired");
		expect(
			outcomeOf({
				status: "building",
				decision: "not_this_time",
				shortlisted: true,
			}),
		).toBe("finalist");
		expect(
			outcomeOf({
				status: "building",
				decision: "not_this_time",
				shortlisted: false,
			}),
		).toBe("built");
		for (const status of ["left", "declined", "applied"]) {
			expect(outcomeOf({ status, shortlisted: false })).toBeNull();
		}
	});

	it("the Rating rises faster than it falls", () => {
		expect(nextRating(1000, 1400)).toBe(1100);
		expect(nextRating(1000, 800)).toBe(980);
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
