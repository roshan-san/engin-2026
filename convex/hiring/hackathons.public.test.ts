import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { giveCredit } from "../billing/credits.helpers";
import { advancePast, createTest, DAY, HOUR } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";
import { type Setup, setUpStartup } from "../teams/startups.helpers";
import {
	closeWithVerdict,
	createDraftHackathon,
	createHackathon,
	enterHackathon,
} from "./hackathons.helpers";

/** Turns stealth on directly: the Free plan has no API for it. */
async function goStealth(setup: Setup) {
	await setup.t.run(async (ctx) => {
		await ctx.db.patch(setup.startupId, { isPublic: false });
	});
}

async function publicPage(setup: Setup, hackathonId: Id<"hackathons">) {
	return await setup.t.query(api.hiring.hackathons.getPublic, {
		hackathonId,
	});
}

describe("public page", () => {
	test("a signed-out visitor reads an open hackathon", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, {
			startsInMs: 2 * DAY,
			applicationDeadlineInMs: DAY,
			prize: "₹5,000 to the winner",
			starterTasks: [
				{ title: "Build the API", description: "REST is fine" },
				{ title: "Write the docs" },
			],
		});

		const page = await publicPage(setup, hackathonId);

		expect(page).toMatchObject({
			title: "Build a feature",
			status: "open",
			deadline: Date.now() + DAY,
			startsAt: Date.now() + 2 * DAY,
			endsAt: Date.now() + 9 * DAY,
			participantCount: 0,
			maxParticipants: 5,
			prize: "₹5,000 to the winner",
			startup: { name: "Acme", slug: expect.any(String) },
			role: { title: "Engineer", type: "full-time" },
			isMember: false,
		});
		expect(page?.starterTasks.map((c) => [c.title, c.description])).toEqual([
			["Build the API", "REST is fine"],
			["Write the docs", null],
		]);
	});

	test("with no application deadline, the deadline is the start", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });

		const page = await publicPage(setup, hackathonId);

		expect(page?.deadline).toBe(page?.startsAt);
	});

	test("optional details come back when set and null when not", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const plain = await createHackathon(setup);
		const startsAt = Date.now() + DAY;
		const detailed = await setup.founder.as.mutation(
			api.hiring.hackathons.create,
			{
				startupId: setup.startupId,
				roleId: setup.roleId,
				title: "Detailed",
				description: "With details",
				maxParticipants: 5,
				startsAt,
				endsAt: startsAt + 7 * DAY,
				expectedOutcome: "A working API",
				evaluationCriteria: "Code quality",
				compensation: "₹40k/month",
				starterTasks: [{ title: "Ship it" }],
			},
		);
		await giveCredit(t, setup.founder.userId);
		await setup.founder.as.mutation(api.hiring.hackathons.publish, {
			hackathonId: detailed,
			acceptTerms: true,
		});

		const detailedPage = await publicPage(setup, detailed);
		const plainPage = await publicPage(setup, plain);

		expect(detailedPage).toMatchObject({
			expectedOutcome: "A working API",
			evaluationCriteria: "Code quality",
			compensation: "₹40k/month",
		});
		// Expected outcome isn't optional here: publish requires it.
		expect(plainPage).toMatchObject({
			prize: null,
			evaluationCriteria: null,
			compensation: null,
		});
	});

	test("running, closed and cancelled hackathons stay readable with their status", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const cancelled = await createHackathon(setup, { startsInMs: 2 * DAY });
		await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
			hackathonId: cancelled,
		});
		const running = await createHackathon(setup, { startsInMs: DAY });
		await enterHackathon(setup, running, alice);
		await advancePast(t, DAY + HOUR);

		expect((await publicPage(setup, running))?.status).toBe("active");
		expect((await publicPage(setup, cancelled))?.status).toBe("cancelled");

		await closeWithVerdict(setup, running, alice, "passed");

		expect((await publicPage(setup, running))?.status).toBe("closed");
	});

	test("a draft has no public page, signed out or in", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup);
		const alice = await signUp(t, "Alice");

		expect(await publicPage(setup, hackathonId)).toBeNull();
		expect(
			await alice.as.query(api.hiring.hackathons.getPublic, { hackathonId }),
		).toBeNull();
	});

	test("a made-up hackathon address is not found", async () => {
		const t = createTest();

		const page = await t.query(api.hiring.hackathons.getPublic, {
			hackathonId: "not-a-real-id",
		});

		expect(page).toBeNull();
	});

	test("a hackathon whose startup went stealth has no public page", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup);

		await goStealth(setup);

		expect(await publicPage(setup, hackathonId)).toBeNull();
	});

	test("the page reveals no applicants or payment details", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup);
		const alice = await signUp(t, "Alice");
		await alice.as.mutation(api.hiring.applications.applyToHackathon, {
			hackathonId,
			message: "Pick me",
			acceptTerms: true,
		});

		const page = await publicPage(setup, hackathonId);

		expect(page).not.toBeNull();
		for (const key of [
			"applicants",
			"creditId",
			"creditSource",
			"publishedByUserId",
			"searchText",
		]) {
			expect(page).not.toHaveProperty(key);
		}
		expect(JSON.stringify(page)).not.toContain("Pick me");
	});

	test("only members of the startup are told they're members", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup);
		const alice = await signUp(t, "Alice");

		const asFounder = await setup.founder.as.query(
			api.hiring.hackathons.getPublic,
			{ hackathonId },
		);
		const asAlice = await alice.as.query(api.hiring.hackathons.getPublic, {
			hackathonId,
		});
		const signedOut = await publicPage(setup, hackathonId);

		expect(asFounder?.isMember).toBe(true);
		expect(asAlice?.isMember).toBe(false);
		expect(signedOut?.isMember).toBe(false);
	});

	test("an applicant sees their own entry status, and nobody else gets one", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup);
		const alice = await signUp(t, "Alice");
		const bob = await signUp(t, "Bob");
		await alice.as.mutation(api.hiring.applications.applyToHackathon, {
			hackathonId,
			acceptTerms: true,
		});

		const asAlice = await alice.as.query(api.hiring.hackathons.getPublic, {
			hackathonId,
		});
		const asBob = await bob.as.query(api.hiring.hackathons.getPublic, {
			hackathonId,
		});
		const signedOut = await publicPage(setup, hackathonId);

		expect(asAlice?.myApplicationStatus).toBe("applied");
		expect(asBob?.myApplicationStatus).toBeNull();
		expect(signedOut?.myApplicationStatus).toBeNull();
	});
});

describe("listings", () => {
	test("a stealth startup's open hackathons aren't listed on its page", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		await createHackathon(setup);

		await goStealth(setup);

		expect(
			await t.query(api.hiring.hackathons.listOpenByStartup, {
				startupId: setup.startupId,
			}),
		).toEqual([]);
	});

	test("an open hackathon is listed with its Role and deadline", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, {
			startsInMs: 2 * DAY,
			applicationDeadlineInMs: DAY,
		});

		const { hackathons } = await t.query(api.hiring.opportunities.search, {});

		expect(hackathons).toEqual([
			expect.objectContaining({
				_id: hackathonId,
				roleTitle: "Engineer",
				deadline: Date.now() + DAY,
			}),
		]);
	});

	test("the newest open hackathon is listed first", async () => {
		const t = createTest();
		const older = await createHackathon(await setUpStartup(t));
		const newer = await createHackathon(await setUpStartup(t));

		const { hackathons } = await t.query(api.hiring.opportunities.search, {});

		expect(hackathons.map((hackathon) => hackathon._id)).toEqual([
			newer,
			older,
		]);
	});

	test("drafts and stealth startups' hackathons aren't listed", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		await createDraftHackathon(setup);
		const stealthy = await setUpStartup(t);
		await createHackathon(stealthy);
		await goStealth(stealthy);

		const { hackathons } = await t.query(api.hiring.opportunities.search, {});

		expect(hackathons).toEqual([]);
	});

	test("running and cancelled hackathons aren't listed", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const cancelled = await createHackathon(setup, { startsInMs: 2 * DAY });
		await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
			hackathonId: cancelled,
		});
		await createHackathon(setup, { startsInMs: DAY });
		await advancePast(t, DAY + HOUR);

		const { hackathons } = await t.query(api.hiring.opportunities.search, {});

		expect(hackathons).toEqual([]);
	});
});
