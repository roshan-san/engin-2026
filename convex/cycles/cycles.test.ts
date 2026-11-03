import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { setUpStartup } from "../startups/startups.setup";
import { createTest, DAY } from "../testing/test.setup";
import { signUp } from "../users/users.setup";
import { cycleNumber, shiftWeek, weekOf, weekStart } from "./rules";

describe("cycles", () => {
	it("weeks run Monday to Sunday in IST", () => {
		expect(weekOf(Date.parse("2026-10-18T18:29:00Z"))).toBe("2026-W42");
		expect(weekOf(Date.parse("2026-10-18T18:30:00Z"))).toBe("2026-W43");
		expect(weekStart("2026-W43")).toBe(Date.parse("2026-10-18T18:30:00Z"));
	});

	it("a year boundary uses ISO weeks", () => {
		expect(weekOf(Date.parse("2026-12-31T12:00:00Z"))).toBe("2026-W53");
		expect(weekOf(Date.parse("2027-01-03T12:00:00Z"))).toBe("2026-W53");
		expect(weekOf(Date.parse("2027-01-04T12:00:00Z"))).toBe("2027-W01");
		expect(weekStart("2027-W01")).toBe(Date.parse("2027-01-03T18:30:00Z"));
	});

	it("shifting a week crosses year boundaries", () => {
		expect(shiftWeek("2026-W01", -1)).toBe("2025-W52");
		expect(shiftWeek("2026-W52", 1)).toBe("2026-W53");
		expect(shiftWeek("2026-W42", 0)).toBe("2026-W42");
	});

	it("the first Cycle is the signup week", () => {
		const created = Date.parse("2026-10-14T09:00:00Z");

		expect(cycleNumber(created, created)).toBe(1);
		expect(cycleNumber(created, created + 7 * DAY)).toBe(2);
		expect(cycleNumber(created, created + 21 * DAY)).toBe(4);
	});
});

describe("the current Cycle", () => {
	it("the Cycle runs Monday to Sunday", async () => {
		const setup = await setUpStartup(createTest());

		const cycle = await setup.founder.as.query(api.cycles.getCurrent, {
			startupId: setup.startupId,
		});

		expect(cycle.number).toBe(1);
		expect(cycle.week).toBe(weekOf(Date.now()));
		expect(cycle.startsAt).toBe(weekStart(cycle.week));
		expect(cycle.endsAt - cycle.startsAt).toBe(7 * DAY);
	});

	it("only the team can see the Cycle", async () => {
		const setup = await setUpStartup(createTest());
		const outsider = await signUp(setup.t, "Olly");

		await expect(
			outsider.as.query(api.cycles.getCurrent, {
				startupId: setup.startupId,
			}),
		).rejects.toThrow("You're not on this startup");
	});
});
