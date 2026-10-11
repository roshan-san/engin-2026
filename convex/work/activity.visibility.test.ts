import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { decidedHackathon } from "../hiring/applications.helpers";
import { createTest } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.helpers";
import { verifyCards } from "./rating.helpers";

/** Acme with a goal, one verified Card, a joined Contributor and a hired Builder. */
async function busyStartup(): Promise<Setup> {
	const setup = await setUpStartup(createTest());
	await setup.founder.as.mutation(api.work.cycles.setGoal, {
		startupId: setup.startupId,
		goal: "Get 10 paying users",
	});
	const sam = await addContributor(setup, "Sam");
	await verifyCards(setup, sam, 1);
	await setup.founder.as.mutation(api.startups.invites.create, {
		startupId: setup.startupId,
		email: "jo@example.com",
	});
	const jo = await signUp(setup.t, "Jo");
	const [invite] = await jo.as.query(api.startups.invites.listMine, {});
	await jo.as.mutation(api.startups.invites.accept, {
		inviteId: invite.inviteId,
	});
	await decidedHackathon(setup, [{ name: "Ana", decision: "hired" }]);
	return setup;
}

describe("visibility", () => {
	it("the public sees counts and milestones only", async () => {
		const setup = await busyStartup();

		const page = await setup.t.query(api.work.activity.listPublic, {
			slug: setup.slug,
		});

		expect(page?.full).toBe(false);
		const cycles = page?.cycles ?? [];
		expect(cycles.every((cycle) => cycle.goal === null)).toBe(true);
		expect(cycles.reduce((sum, cycle) => sum + cycle.shippedCount, 0)).toBe(1);
		const entries = cycles.flatMap((cycle) => cycle.entries);
		expect(entries.map((entry) => entry.kind).sort()).toEqual([
			"builder_hired",
			"hackathon_finished",
		]);
		for (const entry of entries) {
			expect(entry).toMatchObject({ line: null, card: null });
		}
	});

	it("the team sees the masked page too", async () => {
		const setup = await busyStartup();

		const signedOut = await setup.t.query(api.work.activity.listPublic, {
			slug: setup.slug,
		});
		const founder = await setup.founder.as.query(api.work.activity.listPublic, {
			slug: setup.slug,
		});

		expect(founder).toEqual(signedOut);
	});

	it("Investor Pro sees everything", async () => {
		const setup = await busyStartup();
		const ivy = await signUp(setup.t, "Ivy");
		await setup.t.run(
			async (ctx) =>
				await ctx.db.patch(ivy.userId, { investorVerifiedAt: Date.now() }),
		);

		const page = await ivy.as.query(api.work.activity.listPublic, {
			slug: setup.slug,
		});

		expect(page?.full).toBe(true);
		const cycles = page?.cycles ?? [];
		expect(cycles.map((cycle) => cycle.goal)).toContain("Get 10 paying users");
		const entries = cycles.flatMap((cycle) => cycle.entries);
		expect(
			entries.find((entry) => entry.kind === "card_verified"),
		).toMatchObject({ line: "Shipped 1", card: { title: "Card 1" } });
		expect(entries.map((entry) => entry.kind)).toContain("contributor_joined");
	});

	it("signals need no sign-in", async () => {
		const setup = await setUpStartup(createTest());
		await verifyCards(setup, setup.founder, 2);

		const signals = await setup.t.query(api.work.activity.getSignals, {
			slug: setup.slug,
		});

		expect(signals?.rating).toBe(1000);
		expect(signals?.isProvisional).toBe(true);
		expect(signals?.strip).toHaveLength(12);
		expect(signals?.strip.at(-1)?.count).toBe(2);
		expect(
			signals?.strip.slice(0, 11).every((cell) => cell.count === null),
		).toBe(true);
		expect(signals?.verifiedTotal12).toBe(2);
	});

	it("the parts count finished weeks only", async () => {
		const setup = await setUpStartup(createTest());
		await verifyCards(setup, setup.founder, 3);

		const signals = await setup.t.query(api.work.activity.getSignals, {
			slug: setup.slug,
		});

		expect(signals?.parts).toEqual({
			consistency: { active: 0, weeks: 0 },
			volume: { perWeek: 0 },
		});
	});

	it("an unknown slug gives null", async () => {
		const t = createTest();
		const args = { slug: "nope" };

		expect(await t.query(api.work.activity.getSignals, args)).toBeNull();
		expect(await t.query(api.work.activity.listPublic, args)).toBeNull();
		expect(await t.query(api.startups.startups.getPublic, args)).toBeNull();
	});
});
