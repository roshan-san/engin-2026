import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	endHackathon,
	participants,
	startHackathon,
} from "../applications/applications.setup";
import { SHIPPED } from "../cards/cards.setup";
import { shiftWeek } from "../cycles/rules";
import { publishedHackathon } from "../hackathons/hackathons.setup";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.setup";
import { createTest, type TestConvex } from "../testing/test.setup";
import { type Person, signUp } from "../users/users.setup";
import { runMomentum, toNextWeek, verifyCards } from "./momentum.setup";
import { nextTrust, type TrustProgress } from "./trust";

const NONE: TrustProgress = {
	weeks: 0,
	highWeeks: 0,
	highStartups: 0,
	hackathon: false,
};
const W = "2026-W30";

describe("nextTrust", () => {
	it("everyone starts Low", () => {
		expect(
			nextTrust({ current: "low", held: false, week: W, progress: NONE }),
		).toMatchObject({ trust: "low" });
	});

	it("4 weeks of outside approval reach Mid, 3 don't", () => {
		const at = (weeks: number) =>
			nextTrust({
				current: "low",
				held: false,
				week: W,
				lastOutsideWeek: W,
				progress: { ...NONE, weeks },
			});

		expect(at(3).trust).toBe("low");
		expect(at(4)).toEqual({ trust: "mid", since: W });
	});

	it("a paid Hackathon whose promise was kept reaches Mid", () => {
		expect(
			nextTrust({
				current: "low",
				held: false,
				week: W,
				progress: { ...NONE, hackathon: true },
			}).trust,
		).toBe("mid");
	});

	it("High needs 12 weeks from Mid or High people at 2 unrelated startups", () => {
		const at = (highWeeks: number, highStartups: 0 | 1 | 2) =>
			nextTrust({
				current: "mid",
				held: false,
				since: W,
				week: W,
				lastOutsideWeek: W,
				progress: { weeks: 12, highWeeks, highStartups, hackathon: false },
			}).trust;

		expect(at(12, 2)).toBe("high");
		expect(at(12, 1)).toBe("mid");
		expect(at(11, 2)).toBe("mid");
	});

	it("12 weeks with no outside approval drops one level and restarts the count", () => {
		const fall = (week: string) =>
			nextTrust({
				current: "high",
				held: false,
				since: "2026-W10",
				week,
				lastOutsideWeek: "2026-W18",
				progress: {
					weeks: 20,
					highWeeks: 12,
					highStartups: 2,
					hackathon: false,
				},
			});

		expect(fall(shiftWeek("2026-W18", 11)).trust).toBe("high");
		expect(fall(shiftWeek("2026-W18", 12))).toEqual({
			trust: "mid",
			since: shiftWeek("2026-W18", 12),
			countsFrom: shiftWeek("2026-W18", 12),
		});
	});

	it("a flag holds Trust where it is, up or down", () => {
		expect(
			nextTrust({
				current: "mid",
				held: true,
				since: "2026-W01",
				week: W,
				progress: NONE,
			}).trust,
		).toBe("mid");
		expect(
			nextTrust({
				current: "low",
				held: true,
				week: W,
				progress: { ...NONE, weeks: 10 },
			}).trust,
		).toBe("low");
	});
});

async function trustOf(t: TestConvex, userId: Id<"users">) {
	return (await t.run(async (ctx) => await ctx.db.get(userId)))?.trust ?? "low";
}

async function setTrust(t: TestConvex, person: Person, trust: "mid" | "high") {
	await t.run(async (ctx) => {
		await ctx.db.patch(person.userId, { trust });
	});
}

/** Each week: each startup's Founder approves one of `person`'s Cards, then the run. */
async function approvedWeeks(
	startups: Setup[],
	person: Person,
	weeks: number,
): Promise<void> {
	for (let week = 0; week < weeks; week++) {
		for (const setup of startups) {
			await verifyCards(setup, person, 1);
		}
		await toNextWeek(startups[0].t);
		await runMomentum(startups[0].t);
	}
}

async function joinTeam(setup: Setup, person: Person) {
	await setup.t.run(async (ctx) => {
		await ctx.db.insert("contributors", {
			startupId: setup.startupId,
			userId: person.userId,
			discipline: "developer",
		});
	});
}

/** A second startup in the same test, with its own Founder. */
async function otherStartup(t: TestConvex, name: string): Promise<Setup> {
	const founder = await signUp(t, name);
	const { startupId, slug } = await founder.as.mutation(api.startups.create, {
		name: `${name} Co`,
		stage: "building",
		city: "remote",
	});
	return { t, founder, startupId, slug };
}

/** A Hackathon run to the end with Bea as its Builder, who answers whether the promise was kept. */
async function finishedHackathon(
	setup: Setup,
	options: {
		participantsGet?: string;
		answers: boolean[];
		approveFirst?: boolean;
	},
) {
	const hackathonId = await publishedHackathon(setup, {
		participantsGet: options.participantsGet ?? "₹3,000 per finalist",
	});
	const builders = await participants(
		setup,
		hackathonId,
		options.answers.map((_, i) => `Builder${i}`),
	);
	await startHackathon(setup, hackathonId);
	if (options.approveFirst) {
		const [card] = await builders[0].as.query(api.cards.listParticipantBoard, {
			hackathonId,
			participantId: builders[0].userId,
		});
		await builders[0].as.mutation(api.cards.submit, {
			cardId: card._id,
			shipped: SHIPPED,
		});
		await setup.founder.as.mutation(api.cards.verify, { cardId: card._id });
	}
	await endHackathon(setup, hackathonId);
	for (const [i, builder] of builders.entries()) {
		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: builder.applicationId,
			decision: "not_this_time",
		});
		await builder.as.mutation(api.applications.keepPromise, {
			applicationId: builder.applicationId,
			kept: options.answers[i],
		});
	}
	return builders;
}

describe("Trust in the weekly run", () => {
	it("self-approval never raises Trust", async () => {
		const setup = await setUpStartup(createTest());

		await approvedWeeks([setup], setup.founder, 6);

		expect(await trustOf(setup.t, setup.founder.userId)).toBe("low");
	});

	it("someone else approving in 4 different weeks reaches Mid", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		await approvedWeeks([setup], sam, 3);
		expect(await trustOf(setup.t, sam.userId)).toBe("low");
		await approvedWeeks([setup], sam, 1);

		expect(await trustOf(setup.t, sam.userId)).toBe("mid");
	});

	it("a solo Founder reaches Mid through a paid Hackathon whose promise was kept", async () => {
		const setup = await setUpStartup(createTest());
		await finishedHackathon(setup, { answers: [true] });
		await toNextWeek(setup.t);

		await runMomentum(setup.t);

		expect(await trustOf(setup.t, setup.founder.userId)).toBe("mid");
	});

	it("a Nothing Hackathon, or one with more not-kept answers, doesn't", async () => {
		const nothing = await setUpStartup(createTest());
		await finishedHackathon(nothing, {
			participantsGet: "Nothing",
			answers: [true],
		});
		const broken = await otherStartup(nothing.t, "Bo");
		await finishedHackathon(broken, { answers: [true, false, false] });
		await toNextWeek(nothing.t);

		await runMomentum(nothing.t);

		expect(await trustOf(nothing.t, nothing.founder.userId)).toBe("low");
		expect(await trustOf(nothing.t, broken.founder.userId)).toBe("low");
	});

	it("a Builder with an Approved Card in that Hackathon reaches Mid", async () => {
		const setup = await setUpStartup(createTest());
		const [bea, other] = await finishedHackathon(setup, {
			answers: [true, true],
			approveFirst: true,
		});
		await toNextWeek(setup.t);

		await runMomentum(setup.t);

		expect(await trustOf(setup.t, bea.userId)).toBe("mid");
		expect(await trustOf(setup.t, other.userId)).toBe("low");
	});

	it("High needs Mid approvers at 2 unrelated startups across 12 weeks", async () => {
		const x = await setUpStartup(createTest());
		const y = await otherStartup(x.t, "Yan");
		const sam = await addContributor(x, "Sam");
		await joinTeam(y, sam);
		await setTrust(x.t, x.founder, "mid");
		await setTrust(x.t, y.founder, "high");

		await approvedWeeks([x, y], sam, 11);
		expect(await trustOf(x.t, sam.userId)).toBe("mid");
		await approvedWeeks([x, y], sam, 1);

		expect(await trustOf(x.t, sam.userId)).toBe("high");
	});

	it("12 weeks from one startup stays Mid", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await setTrust(setup.t, setup.founder, "high");

		await approvedWeeks([setup], sam, 12);

		expect(await trustOf(setup.t, sam.userId)).toBe("mid");
	});

	it("startups that shared a Contributor stay related", async () => {
		const x = await setUpStartup(createTest());
		const y = await otherStartup(x.t, "Yan");
		const sam = await addContributor(x, "Sam");
		await joinTeam(y, sam);
		const lee = await addContributor(x, "Lee");
		await joinTeam(y, lee);
		await setTrust(x.t, x.founder, "mid");
		await setTrust(x.t, y.founder, "mid");

		await approvedWeeks([x, y], sam, 12);

		expect(await trustOf(x.t, sam.userId)).toBe("mid");
	});

	it("a Low approver's weeks don't count toward High", async () => {
		const x = await setUpStartup(createTest());
		const y = await otherStartup(x.t, "Yan");
		const sam = await addContributor(x, "Sam");
		await joinTeam(y, sam);
		await setTrust(x.t, x.founder, "mid");

		await approvedWeeks([x, y], sam, 12);

		expect(await trustOf(x.t, sam.userId)).toBe("mid");
	});

	it("Trust drops one level after 12 weeks with no outside approval, and the old approvals don't lift it back", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await approvedWeeks([setup], sam, 4);
		expect(await trustOf(setup.t, sam.userId)).toBe("mid");

		for (let week = 0; week < 11; week++) {
			await toNextWeek(setup.t);
			await runMomentum(setup.t);
		}
		expect(await trustOf(setup.t, sam.userId)).toBe("mid");
		await toNextWeek(setup.t);
		await runMomentum(setup.t);
		expect(await trustOf(setup.t, sam.userId)).toBe("low");

		await toNextWeek(setup.t);
		await runMomentum(setup.t);
		expect(await trustOf(setup.t, sam.userId)).toBe("low");
	});

	it("a flag holds Trust where it is", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await approvedWeeks([setup], sam, 4);
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(sam.userId, { trustHeld: true });
		});

		for (let week = 0; week < 13; week++) {
			await toNextWeek(setup.t);
			await runMomentum(setup.t);
		}

		expect(await trustOf(setup.t, sam.userId)).toBe("mid");
	});
});

describe("myTrust", () => {
	it("shows only your own Trust and progress", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await approvedWeeks([setup], sam, 2);

		expect(await sam.as.query(api.users.myTrust, {})).toEqual({
			trust: "low",
			held: false,
			progress: { weeks: 2, highWeeks: 0, highStartups: 0, hackathon: false },
		});
		expect(await setup.t.query(api.users.myTrust, {})).toBeNull();
	});
});
