import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { addContributor, setUpStartup } from "../testing/startups.setup";
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

describe("this week's goal", () => {
	it("the Founder sets this week's goal", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		await setup.founder.as.mutation(api.cycles.setGoal, {
			startupId: setup.startupId,
			goal: "Get 10 paying users",
		});

		expect(
			await sam.as.query(api.cycles.getCurrent, {
				startupId: setup.startupId,
			}),
		).toMatchObject({ number: 1, goal: "Get 10 paying users" });
		await expect(
			sam.as.mutation(api.cycles.setGoal, {
				startupId: setup.startupId,
				goal: "Take over",
			}),
		).rejects.toThrow("Only the Founder can do this");
	});

	it("the Cycle runs Monday to Sunday and has no goal until one is set", async () => {
		const setup = await setUpStartup(createTest());

		const cycle = await setup.founder.as.query(api.cycles.getCurrent, {
			startupId: setup.startupId,
		});

		expect(cycle.goal).toBeNull();
		expect(cycle.week).toBe(weekOf(Date.now()));
		expect(cycle.startsAt).toBe(weekStart(cycle.week));
		expect(cycle.endsAt - cycle.startsAt).toBe(7 * DAY);
	});

	it("setting the goal again replaces it, and an empty goal clears it", async () => {
		const setup = await setUpStartup(createTest());
		const args = { startupId: setup.startupId };

		await setup.founder.as.mutation(api.cycles.setGoal, {
			...args,
			goal: "Ship pricing",
		});
		await setup.founder.as.mutation(api.cycles.setGoal, {
			...args,
			goal: "  Ship onboarding  ",
		});
		const replaced = await setup.founder.as.query(api.cycles.getCurrent, args);
		await setup.founder.as.mutation(api.cycles.setGoal, {
			...args,
			goal: "   ",
		});
		const cleared = await setup.founder.as.query(api.cycles.getCurrent, args);

		expect(replaced.goal).toBe("Ship onboarding");
		expect(cleared.goal).toBeNull();
	});

	it("a goal over the limit is rejected", async () => {
		const setup = await setUpStartup(createTest());

		await expect(
			setup.founder.as.mutation(api.cycles.setGoal, {
				startupId: setup.startupId,
				goal: "x".repeat(141),
			}),
		).rejects.toThrow("Goal must be under 140 characters");
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
