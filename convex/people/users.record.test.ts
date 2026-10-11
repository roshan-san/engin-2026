import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import {
	builders,
	decidedHackathon,
	startHackathon,
} from "../hiring/applications.helpers";
import { publishedHackathon } from "../hiring/hackathons.helpers";
import { createTest } from "../lib/testing.helpers";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.helpers";
import { verifyCards } from "../work/rating.helpers";
import { signUp } from "./users.helpers";

async function recordOf(setup: Setup, username: string) {
	return await setup.t.query(api.people.users.getRecord, { username });
}

describe("profile record", () => {
	it("verified work counts per Startup", async () => {
		const acme = await setUpStartup(createTest());
		const sam = await addContributor(acme, "Sam");
		const zed = await signUp(acme.t, "Zed");
		const { startupId, slug } = await zed.as.mutation(
			api.startups.startups.create,
			{ name: "Zeta", stage: "idea", category: "ai", city: "remote" },
		);
		const zeta = { t: acme.t, founder: zed, startupId, slug };
		await acme.t.run(
			async (ctx) =>
				await ctx.db.insert("contributors", { startupId, userId: sam.userId }),
		);
		await verifyCards(acme, sam, 3);
		await verifyCards(zeta, sam, 1);

		const record = await recordOf(acme, "sam");

		expect(record?.work).toMatchObject([
			{ startup: { name: "Zeta", slug: "zeta" }, count: 1, capped: false },
			{ startup: { name: "Acme", slug: "acme" }, count: 3, capped: false },
		]);
	});

	it("self-verified work doesn't count", async () => {
		const setup = await setUpStartup(createTest());
		await verifyCards(setup, setup.founder, 2);

		const record = await recordOf(setup, "fay");

		expect(record?.work).toEqual([]);
	});

	it("Not this time shows as Built", async () => {
		const setup = await setUpStartup(createTest());
		await decidedHackathon(setup, [{ name: "Ana", decision: "not_this_time" }]);

		const record = await recordOf(setup, "ana");

		expect(record?.hackathons).toMatchObject([
			{
				outcome: "built",
				job: { role: "frontend" },
				startup: { name: "Acme", slug: "acme" },
			},
		]);
		expect(JSON.stringify(record)).not.toContain("not_this_time");
	});

	it("a Hackathon still building isn't shown", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		await builders(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);

		const record = await recordOf(setup, "ana");

		expect(record?.hackathons).toEqual([]);
		expect(record?.parts.outcomes).toBe(0);
	});

	it("the profile needs no sign-in", async () => {
		const setup = await setUpStartup(createTest());
		await addContributor(setup, "Sam");

		const sam = await recordOf(setup, "sam");
		const nobody = await recordOf(setup, "nobody");

		expect(sam).toMatchObject({
			name: "Sam",
			username: "sam",
			rating: 1000,
			parts: {
				consistency: { active: 0, weeks: 0 },
				volume: { perWeek: 0 },
				outcomes: 0,
			},
		});
		expect(sam).not.toHaveProperty("email");
		expect(nobody).toBeNull();
	});
});
