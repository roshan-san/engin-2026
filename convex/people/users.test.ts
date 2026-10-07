import { expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { createTest, DAY } from "../lib/testing.helpers";
import {
	closeWithVerdict,
	cycleIdOf,
	startedHackathonWith,
} from "../hiring/hackathons.helpers";
import { goStealth, setUpStartup } from "../teams/startups.helpers";
import { submitWithProof } from "../work/cycles.helpers";
import { signUp } from "./users.helpers";

/** A closed Cycle with one Verified Task per given title, all by `userId`. */
async function shipInClosedCycle(
	t: ReturnType<typeof createTest>,
	startupId: Id<"startups">,
	userId: Id<"users">,
	titles: string[],
) {
	await t.run(async (ctx) => {
		const cycleId = await ctx.db.insert("cycles", {
			startupId,
			kind: "team",
			title: "Landing page",
			startAt: Date.now() - 7 * DAY,
			endAt: Date.now(),
			status: "closed",
		});
		for (const title of titles) {
			await ctx.db.insert("tasks", {
				startupId,
				cycleId,
				title,
				status: "done",
				assigneeUserId: userId,
				createdByUserId: userId,
			});
		}
	});
}

test("a profile shows internal Verified Tasks and Cycles as Proof of Work per public Startup", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await setup.founder.as.mutation(api.teams.startups.update, {
		startupId: setup.startupId,
		isPublic: true,
	});
	await shipInClosedCycle(t, setup.startupId, setup.founder.userId, [
		"Hero",
		"Pricing",
	]);

	const profile = await t.query(api.people.users.getByUsername, {
		username: "founder",
	});

	expect(profile?.proofOfWork.startups).toEqual([
		expect.objectContaining({
			name: "Acme",
			verifiedTasks: 2,
			cyclesCompleted: 1,
		}),
	]);
	expect(profile?.evidence.score).toBe(0);
});

test("a hackathon's verified Tasks count as Proof of Work, but its Cycle isn't a completed Cycle", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const hackathonId = await startedHackathonWith(setup, [alice]);
	const cycleId = await cycleIdOf(t, hackathonId);
	const verified = await alice.as.mutation(api.work.tasks.create, {
		startupId: setup.startupId,
		cycleId,
		title: "Build the API",
	});
	const unverified = await alice.as.mutation(api.work.tasks.create, {
		startupId: setup.startupId,
		cycleId,
		title: "Write the docs",
	});
	await submitWithProof(alice, verified);
	await setup.founder.as.mutation(api.work.tasks.verify, { taskId: verified });
	await alice.as.mutation(api.work.tasks.setStatus, {
		taskId: unverified,
		status: "in_progress",
	});

	await closeWithVerdict(setup, hackathonId, alice, "passed");

	const profile = await t.query(api.people.users.getByUsername, {
		username: "alice",
	});
	expect(profile?.proofOfWork.startups).toEqual([
		expect.objectContaining({
			name: "Acme",
			verifiedTasks: 1,
			cyclesCompleted: 0,
		}),
	]);
});

test("work at a private Startup is shown only as aggregate counts", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await goStealth(setup);
	await shipInClosedCycle(t, setup.startupId, setup.founder.userId, ["Hero"]);

	const profile = await (await signUp(t, "Visitor")).as.query(
		api.people.users.getByUsername,
		{ username: "founder" },
	);

	expect(profile?.proofOfWork.startups).toEqual([]);
	expect(profile?.proofOfWork.private).toEqual({
		startups: 1,
		verifiedTasks: 1,
		cyclesCompleted: 1,
	});
	expect(JSON.stringify(profile?.proofOfWork)).not.toContain("Acme");
	expect(JSON.stringify(profile?.proofOfWork)).not.toContain("Hero");
});
