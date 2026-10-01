import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "../_generated/api";
import {
	advancePast,
	createTest,
	createTrial,
	DAY,
	HOUR,
	joinAsMember,
	setUpStartup,
	signUp,
} from "../test.helpers";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

test("only Users with a username and evidence appear as contributors", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await joinAsMember(t, setup, "Alice");

	// A signed-up user with no membership, Verdict, or Verified Pulse: no evidence.
	await signUp(t, "NoEvidence");

	const contributors = await t.query(api.teams.explore.contributors, {});
	const usernames = contributors.map((c) => c.username);

	expect(usernames).toContain("alice");
	expect(usernames).not.toContain("noevidence");
	expect(usernames).toContain("founder");
});

test("hiding from Explore removes a contributor from the list", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await joinAsMember(t, setup, "Alice");

	await alice.as.mutation(api.people.users.updateProfile, {
		hideFromExplore: true,
	});

	const contributors = await t.query(api.teams.explore.contributors, {});
	expect(contributors.map((c) => c.username)).not.toContain("alice");
});

test("skill and location filters narrow the contributor list", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await joinAsMember(t, setup, "Alice");
	const bob = await joinAsMember(t, setup, "Bob");

	await alice.as.mutation(api.people.users.updateProfile, {
		skills: ["rust"],
		location: "Berlin",
	});
	await bob.as.mutation(api.people.users.updateProfile, {
		skills: ["typescript"],
		location: "Remote",
	});

	const bySkill = await t.query(api.teams.explore.contributors, {
		skill: "rust",
	});
	expect(bySkill.map((c) => c.username)).toEqual(["alice"]);

	const byLocation = await t.query(api.teams.explore.contributors, {
		location: "berlin",
	});
	expect(byLocation.map((c) => c.username)).toEqual(["alice"]);
});

test("contributors are sorted by Score, highest first", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await joinAsMember(t, setup, "Alice");
	await joinAsMember(t, setup, "Bob");

	await t.run(async (ctx) => {
		const alice = await ctx.db
			.query("users")
			.withIndex("by_username", (q) => q.eq("username", "alice"))
			.unique();
		if (alice) {
			await ctx.db.patch(alice._id, { score: 200 });
		}
		const bob = await ctx.db
			.query("users")
			.withIndex("by_username", (q) => q.eq("username", "bob"))
			.unique();
		if (bob) {
			await ctx.db.patch(bob._id, { score: 50 });
		}
	});

	const contributors = await t.query(api.teams.explore.contributors, {});
	const ranked = contributors
		.filter((c) => c.username === "alice" || c.username === "bob")
		.map((c) => c.username);
	expect(ranked).toEqual(["alice", "bob"]);
});

test("finishing a Board Pulse is not evidence: only a Verdict or membership is", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await setup.founder.as.mutation(api.hiring.challenges.add, {
		trialCycleId: await createTrial(setup, { startsInMs: DAY }),
		title: "Build the API",
	});
	const [trial] = await setup.founder.as.query(api.hiring.trialCycles.list, {
		startupId: setup.startupId,
	});
	const alice = await signUp(t, "Alice");
	await alice.as.mutation(api.hiring.applications.joinTrial, {
		acceptTerms: true,
		trialCycleId: trial._id,
	});
	await advancePast(t, DAY + HOUR);

	const [pulse] = await alice.as.query(api.work.pulses.listBoard, {
		trialCycleId: trial._id,
	});
	await alice.as.mutation(api.work.pulses.setStatus, {
		pulseId: pulse._id,
		status: "done",
	});

	const contributors = await t.query(api.teams.explore.contributors, {});
	expect(contributors.map((c) => c.username)).not.toContain("alice");
});
