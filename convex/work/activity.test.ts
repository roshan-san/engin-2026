import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { MAX_LISTED_CYCLES } from "../shared/limits";
import {
	endHackathon,
	participants,
	startHackathon,
} from "../testing/applications.setup";
import { cardOn, SHIPPED } from "../testing/cards.setup";
import { publishedHackathon } from "../testing/hackathons.setup";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../testing/startups.setup";
import { advancePast, createTest, DAY } from "../testing/test.setup";
import { signUp } from "../testing/users.setup";

async function verifiedCard(setup: Setup, title: string) {
	const sam = await addContributor(setup, `Sam ${title}`);
	const cardId = await cardOn(setup, sam, title);
	await sam.as.mutation(api.work.cards.submit, {
		cardId,
		shipped: { ...SHIPPED, line: title },
	});
	await setup.founder.as.mutation(api.work.cards.verify, { cardId });
	return { ...sam, cardId };
}

async function list(setup: Setup, count?: number) {
	return await setup.founder.as.query(api.work.activity.list, {
		startupId: setup.startupId,
		count,
	});
}

describe("activity", () => {
	it("Activity groups verified work by Cycle", async () => {
		const setup = await setUpStartup(createTest());
		await setup.founder.as.mutation(api.work.cycles.setGoal, {
			startupId: setup.startupId,
			goal: "Get 10 paying users",
		});
		const first = await verifiedCard(setup, "Welcome emails");
		await advancePast(setup.t, 7 * DAY);
		await verifiedCard(setup, "Pricing page");

		const { cycles } = await list(setup);

		expect(cycles).toHaveLength(2);
		expect(cycles[0]).toMatchObject({
			number: 2,
			goal: null,
			shippedCount: 1,
			entries: [{ kind: "card_verified", line: "Pricing page" }],
		});
		expect(cycles[1]).toMatchObject({
			number: 1,
			goal: "Get 10 paying users",
			shippedCount: 1,
			entries: [
				{
					kind: "card_verified",
					line: "Welcome emails",
					selfVerified: false,
					actor: { _id: first.userId, name: "Sam Welcome emails" },
					card: {
						title: "Welcome emails",
						links: ["https://example.com/doc"],
						imageUrls: [],
						verifier: { name: "Fay" },
					},
				},
			],
		});
		expect(cycles[0].week > cycles[1].week).toBe(true);
	});

	it("a week lists its newest entry first", async () => {
		const setup = await setUpStartup(createTest());
		await verifiedCard(setup, "Older");
		await advancePast(setup.t, 1000);
		await verifiedCard(setup, "Newer");

		const { cycles } = await list(setup);

		expect(cycles).toHaveLength(1);
		expect(cycles[0].entries.map((entry) => entry.line)).toEqual([
			"Newer",
			"Older",
		]);
	});

	it("empty weeks show as empty", async () => {
		const setup = await setUpStartup(createTest());
		await verifiedCard(setup, "Week one");
		await advancePast(setup.t, 14 * DAY);
		await verifiedCard(setup, "Week three");

		const { cycles } = await list(setup);

		expect(cycles.map((cycle) => cycle.number)).toEqual([3, 2, 1]);
		expect(cycles[1]).toMatchObject({ shippedCount: 0, entries: [] });
	});

	it("the list stops at the first Cycle", async () => {
		const setup = await setUpStartup(createTest());

		const result = await list(setup);

		expect(result.cycles).toHaveLength(1);
		expect(result.hasMore).toBe(false);
	});

	it("Show earlier adds older Cycles", async () => {
		const setup = await setUpStartup(createTest());
		await advancePast(setup.t, 10 * 7 * DAY);

		const page = await list(setup, 8);
		const all = await list(setup, 16);

		expect(page.cycles).toHaveLength(8);
		expect(page.hasMore).toBe(true);
		expect(all.cycles).toHaveLength(11);
		expect(all.hasMore).toBe(false);
	});

	it("the list stops at the cap", async () => {
		const setup = await setUpStartup(createTest());
		await advancePast(setup.t, 110 * 7 * DAY);

		const result = await list(setup, 500);

		expect(result.cycles).toHaveLength(MAX_LISTED_CYCLES);
		expect(result.hasMore).toBe(false);
	});

	it("an entry outlives its Card", async () => {
		const setup = await setUpStartup(createTest());
		const { cardId } = await verifiedCard(setup, "Gone soon");
		await setup.t.run(async (ctx) => await ctx.db.delete(cardId));

		const { cycles } = await list(setup);

		expect(cycles[0].entries[0]).toMatchObject({
			line: "Gone soon",
			card: null,
		});
	});

	it("hires and finished Hackathons carry the job", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
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

		const { cycles } = await list(setup);

		const entries = cycles.flatMap((cycle) => cycle.entries);
		expect(
			entries.find((entry) => entry.kind === "participant_hired"),
		).toMatchObject({
			job: { role: "frontend" },
			actor: { name: "Ana" },
			card: null,
		});
		expect(
			entries.find((entry) => entry.kind === "hackathon_finished"),
		).toMatchObject({ job: { role: "frontend" } });
	});

	it("only the team reads the list", async () => {
		const setup = await setUpStartup(createTest());
		const outsider = await signUp(setup.t, "Olly");

		await expect(
			outsider.as.query(api.work.activity.list, {
				startupId: setup.startupId,
			}),
		).rejects.toThrow("You're not on this startup");
	});
});
