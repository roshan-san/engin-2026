import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { publishedHackathon } from "../hackathons/hackathons.setup";
import { verifyCards } from "../rating/rating.setup";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.setup";
import {
	decidedHackathon,
	participants,
	startHackathon,
} from "../testing/applications.setup";
import { createTest } from "../testing/test.setup";
import { signUp } from "./users.setup";

/** The Record as a signed-in person (the Founder) sees it. */
async function recordOf(setup: Setup, username: string) {
	const profile = await setup.founder.as.query(api.users.getRecord, {
		username,
	});
	return profile?.details;
}

describe("profile record", () => {
	it("verified work counts per Startup", async () => {
		const acme = await setUpStartup(createTest());
		const sam = await addContributor(acme, "Sam");
		const zed = await signUp(acme.t, "Zed");
		const { startupId, slug } = await zed.as.mutation(api.startups.create, {
			name: "Zeta",
			stage: "idea",
			category: "ai",
			city: "remote",
		});
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

	it("a Hackathon still live isn't shown", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);

		const record = await recordOf(setup, "ana");

		expect(record?.hackathons).toEqual([]);
		expect(record?.parts.outcomes).toBe(0);
	});

	it("a signed-in person sees the whole Record", async () => {
		const setup = await setUpStartup(createTest());
		await addContributor(setup, "Sam");

		const sam = await recordOf(setup, "sam");

		expect(sam).toMatchObject({
			bio: null,
			parts: {
				consistency: { active: 0, weeks: 0 },
				volume: { perWeek: 0 },
				outcomes: 0,
			},
			hackathons: [],
			work: [],
		});
	});

	it("signed out, a profile shows only the name, Discipline and Rating", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await sam.as.mutation(api.users.updateProfile, {
			discipline: "engineer",
			bio: "Ships the onboarding flow",
		});

		const profile = await setup.t.query(api.users.getRecord, {
			username: "sam",
		});

		expect(profile).toMatchObject({
			name: "Sam",
			username: "sam",
			discipline: "engineer",
			rating: 1000,
			details: null,
		});
		expect(JSON.stringify(profile)).not.toContain("Ships the onboarding flow");
		expect(profile).not.toHaveProperty("email");
	});

	it("an unknown username has no profile", async () => {
		const setup = await setUpStartup(createTest());

		const nobody = await setup.t.query(api.users.getRecord, {
			username: "nobody",
		});

		expect(nobody).toBeNull();
	});
});
