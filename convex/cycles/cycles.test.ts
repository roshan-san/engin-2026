import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { cardOn, SHIPPED } from "../cards/cards.setup";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.setup";
import { advancePast, createTest, DAY } from "../testing/test.setup";
import { signUp } from "../users/users.setup";
import {
	cycleNumber,
	DEFAULT_SLOTS,
	shiftWeek,
	weekOf,
	weekStart,
} from "./rules";

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

/** A time in IST, as UTC ms. */
const ist = (date: string, time: string) =>
	Date.parse(`${date}T${time}:00+05:30`);
/** The Monday after the test clock's Saturday. */
const MONDAY = "2026-06-08";

async function goTo(setup: Setup, at: number) {
	await advancePast(setup.t, at - Date.now());
}

async function current(setup: Setup, who = setup.founder) {
	return await who.as.query(api.cycles.getCurrent, {
		startupId: setup.startupId,
	});
}

/** Meetings planning next week: the test clock is a Saturday, so the Board is locked until Monday's meeting. */
async function planNextWeek(setup: Setup) {
	await setup.t.run(async (ctx) => {
		await ctx.db.patch(setup.startupId, {
			meetings: {
				...DEFAULT_SLOTS,
				firstWeek: shiftWeek(weekOf(Date.now()), 1),
				invited: [],
			},
		});
	});
}

describe("meetings", () => {
	it("a solo Founder has no meetings and an open Board", async () => {
		const setup = await setUpStartup(createTest());

		expect(await current(setup)).toMatchObject({
			isSolo: true,
			state: "open",
			meetings: null,
		});
		await expect(
			setup.founder.as.mutation(api.cycles.setMeetings, {
				startupId: setup.startupId,
				...DEFAULT_SLOTS,
			}),
		).rejects.toThrow("Meetings start when someone joins your team");
	});

	it("a team without meetings stays open", async () => {
		const setup = await setUpStartup(createTest());
		await addContributor(setup, "Sam");

		expect(await current(setup)).toMatchObject({
			isSolo: false,
			state: "open",
			meetings: null,
		});
	});

	it("the Founder sets the two meetings", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		await setup.founder.as.mutation(api.cycles.setMeetings, {
			startupId: setup.startupId,
			...DEFAULT_SLOTS,
			openingLink: "https://meet.google.com/abc-defg-hij",
		});

		expect(await current(setup, sam)).toMatchObject({
			state: "open",
			meetings: {
				...DEFAULT_SLOTS,
				openingLink: "https://meet.google.com/abc-defg-hij",
				closingLink: null,
			},
		});
		await expect(
			sam.as.mutation(api.cycles.setMeetings, {
				startupId: setup.startupId,
				...DEFAULT_SLOTS,
			}),
		).rejects.toThrow("Only the Founder can do this");
		await expect(
			setup.founder.as.mutation(api.cycles.setMeetings, {
				startupId: setup.startupId,
				...DEFAULT_SLOTS,
				opening: { startMinutes: 605, minutes: 45 },
			}),
		).rejects.toThrow("Pick a time on the quarter hour");
	});

	it("the page passes its own clock, so the lock shows on time", async () => {
		const setup = await setUpStartup(createTest());
		await addContributor(setup, "Sam");
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(setup.startupId, {
				meetings: {
					...DEFAULT_SLOTS,
					firstWeek: weekOf(Date.now()),
					invited: [],
				},
			});
		});

		const at = (now: number) =>
			setup.founder.as.query(api.cycles.getCurrent, {
				startupId: setup.startupId,
				now,
			});

		expect((await at(ist(MONDAY, "10:30"))).state).toBe("planning");
		expect((await at(ist(MONDAY, "10:30"))).showsScopeHint).toBe(true);
		expect((await at(ist("2026-06-12", "17:10"))).state).toBe("closing");
	});

	it("only the Founder sees team emails", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await setup.founder.as.mutation(api.cycles.setMeetings, {
			startupId: setup.startupId,
			...DEFAULT_SLOTS,
		});

		expect((await current(setup)).guests).toEqual([
			"fay@example.com",
			"sam@example.com",
		]);
		expect((await current(setup, sam)).guests).toBeNull();
		await setup.founder.as.mutation(api.cycles.markInvited, {
			startupId: setup.startupId,
		});
		await addContributor(setup, "Jo");
		expect((await current(setup)).uninvited).toEqual(["jo@example.com"]);
	});
});

describe("Start the week", () => {
	const start = (setup: Setup) =>
		setup.founder.as.mutation(api.cycles.startWeek, {
			startupId: setup.startupId,
		});

	it("waits for the opening meeting to end", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await planNextWeek(setup);
		await goTo(setup, ist(MONDAY, "09:00"));
		await cardOn(setup, setup.founder, "Pricing page");
		await cardOn(setup, sam, "Signup flow");

		await expect(start(setup)).rejects.toThrow(
			"The Board opens when Monday's meeting ends",
		);
		await goTo(setup, ist(MONDAY, "10:46"));
		await start(setup);

		expect((await current(setup)).state).toBe("open");
	});

	it("everyone needs a Card, or is off", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await planNextWeek(setup);
		await goTo(setup, ist(MONDAY, "10:46"));
		await cardOn(setup, setup.founder, "Pricing page");

		await expect(start(setup)).rejects.toThrow(
			"Everyone needs a Card this week, or mark them off: Sam",
		);
		await setup.founder.as.mutation(api.cycles.setOff, {
			startupId: setup.startupId,
			userId: sam.userId,
			off: true,
		});
		expect((await current(setup)).offUserIds).toEqual([sam.userId]);
		await start(setup);
	});

	it("Review must be empty to start", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Welcome emails");
		await sam.as.mutation(api.cards.submit, { cardId, shipped: SHIPPED });
		await planNextWeek(setup);
		await goTo(setup, ist(MONDAY, "10:46"));
		await cardOn(setup, setup.founder, "Pricing page");
		await cardOn(setup, sam, "Signup flow");

		await expect(start(setup)).rejects.toThrow(
			"Approve or send back the Cards in Review first",
		);
	});

	it("only the Founder starts the week, and only once", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await planNextWeek(setup);
		await goTo(setup, ist(MONDAY, "10:46"));
		await cardOn(setup, setup.founder, "Pricing page");
		await cardOn(setup, sam, "Signup flow");

		await expect(
			sam.as.mutation(api.cycles.startWeek, { startupId: setup.startupId }),
		).rejects.toThrow("Only the Founder can do this");
		await start(setup);
		await expect(start(setup)).rejects.toThrow("This week has already started");
	});
});
