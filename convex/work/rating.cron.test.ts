import { describe, expect, it } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	builders,
	endHackathon,
	startHackathon,
} from "../hiring/applications.helpers";
import { publishedHackathon } from "../hiring/hackathons.helpers";
import { createTest, type TestConvex } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";
import { addContributor, setUpStartup } from "../startups/startups.helpers";
import { runRating, toNextWeek, verifyCards } from "./rating.helpers";

async function startupRow(t: TestConvex, startupId: Id<"startups">) {
	const startup = await t.run(async (ctx) => await ctx.db.get(startupId));
	if (!startup) {
		throw new Error("Startup not found");
	}
	return startup;
}

describe("rating", () => {
	it("a Startup that verifies work every week rises", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		for (let week = 0; week < 4; week++) {
			await verifyCards(setup, sam, 5);
			await toNextWeek(setup.t);
			await runRating(setup.t);
		}

		const startup = await startupRow(setup.t, setup.startupId);
		expect(startup.rating).toBeGreaterThan(1000);
		expect(startup.ratingChange).toBeGreaterThan(0);
		expect(startup.ratedWeeks).toBe(4);
		expect(startup.provisional).toBe(false);
	});

	it("a rating run writes the last 12 weeks of rhythm", async () => {
		const setup = await setUpStartup(createTest());
		await verifyCards(setup, setup.founder, 2);
		await toNextWeek(setup.t);

		await runRating(setup.t);

		const startup = await startupRow(setup.t, setup.startupId);
		expect(startup.rhythm.at(-1)).toBe(2);
		expect(startup.rhythm.length).toBeLessThanOrEqual(12);
	});

	it("the rhythm keeps only the last 12 weeks", async () => {
		const setup = await setUpStartup(createTest());
		await toNextWeek(setup.t);
		for (let week = 0; week < 14; week++) {
			await verifyCards(setup, setup.founder, week === 13 ? 3 : 1);
			await toNextWeek(setup.t);
			await runRating(setup.t);
		}

		const startup = await startupRow(setup.t, setup.startupId);

		expect(startup.rhythm).toHaveLength(12);
		expect(startup.rhythm.at(-1)).toBe(3);
	});

	it("a Startup rated no weeks has an empty rhythm", async () => {
		const setup = await setUpStartup(createTest());

		await runRating(setup.t);

		expect((await startupRow(setup.t, setup.startupId)).rhythm).toEqual([]);
	});

	it("a quiet week pulls the Rating down slowly", async () => {
		const setup = await setUpStartup(createTest());
		await setup.t.run(
			async (ctx) => await ctx.db.patch(setup.startupId, { rating: 1400 }),
		);
		await toNextWeek(setup.t);

		await runRating(setup.t);

		expect(await startupRow(setup.t, setup.startupId)).toMatchObject({
			rating: 1340,
			ratingChange: -60,
		});
	});

	it("rating the same week twice changes nothing", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await verifyCards(setup, sam, 3);
		await toNextWeek(setup.t);
		await runRating(setup.t);
		const first = await startupRow(setup.t, setup.startupId);

		await setup.t.mutation(internal.work.rating.rateStartups, {
			week: first.ratedThrough,
		});
		await setup.t.finishInProgressScheduledFunctions();

		const second = await startupRow(setup.t, setup.startupId);
		expect(first.ratedThrough).toBeDefined();
		expect(second).toMatchObject({
			rating: first.rating,
			ratingChange: first.ratingChange,
			ratedWeeks: first.ratedWeeks,
		});
	});

	it("a Startup created this week waits for its first full week", async () => {
		const setup = await setUpStartup(createTest());

		await runRating(setup.t);

		const startup = await startupRow(setup.t, setup.startupId);
		expect(startup.rating).toBe(1000);
		expect(startup.ratedThrough).toBeDefined();
	});

	it("every Startup is rated across pages", async () => {
		const t = createTest();
		const startupIds: Id<"startups">[] = [];
		for (let i = 0; i < 25; i++) {
			const founder = await signUp(t, `Founder${i}`);
			const { startupId, slug } = await founder.as.mutation(
				api.startups.startups.create,
				{
					name: `Startup ${i}`,
					stage: "building",
					category: "saas",
					city: "remote",
				},
			);
			await verifyCards({ t, founder, startupId, slug }, founder, 1);
			startupIds.push(startupId);
		}
		await toNextWeek(t);

		await runRating(t);

		const rows = await Promise.all(startupIds.map((id) => startupRow(t, id)));
		const weeks = new Set(rows.map((row) => row.ratedThrough));
		expect(weeks.size).toBe(1);
		expect([...weeks][0]).toBeDefined();
		expect(rows.every((row) => row.rating > 1000)).toBe(true);
	});

	it("people are rated after Startups", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await verifyCards(setup, sam, 3);
		await toNextWeek(setup.t);

		await runRating(setup.t);

		const profile = await setup.t.query(api.people.users.getByUsername, {
			username: "sam",
		});
		expect(profile?.rating).toBeGreaterThan(1000);
	});

	it("self-verified work never raises a person", async () => {
		const setup = await setUpStartup(createTest());
		await verifyCards(setup, setup.founder, 3);
		await toNextWeek(setup.t);

		await runRating(setup.t);

		const founder = await setup.t.query(api.people.users.getByUsername, {
			username: "fay",
		});
		expect(founder?.rating).toBeLessThanOrEqual(1000);
		expect((await startupRow(setup.t, setup.startupId)).rating).toBeGreaterThan(
			1000,
		);
	});

	it("ratedWeeks counts only active weeks", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await verifyCards(setup, sam, 2);
		await toNextWeek(setup.t);
		await runRating(setup.t);

		await toNextWeek(setup.t);
		await runRating(setup.t);

		expect((await startupRow(setup.t, setup.startupId)).ratedWeeks).toBe(1);
	});

	it("a Hired Builder's Rating counts the outcome", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await builders(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		await setup.founder.as.mutation(api.hiring.applications.shortlist, {
			applicationId: ana.applicationId,
			shortlisted: true,
		});
		await setup.founder.as.mutation(api.hiring.applications.markWalkthrough, {
			applicationId: ana.applicationId,
		});
		await endHackathon(setup, hackathonId);
		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: ana.applicationId,
			decision: "hired",
		});
		await toNextWeek(setup.t);

		await runRating(setup.t);

		const profile = await setup.t.query(api.people.users.getByUsername, {
			username: "ana",
		});
		expect(profile).toMatchObject({ rating: 996, isProvisional: false });
	});
});
