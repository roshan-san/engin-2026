import { expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { createTest, DAY, setUpStartup, signUp } from "../test.helpers";

/** A closed Cycle with one Verified Pulse per given title, all by `userId`. */
async function shipInClosedCycle(
	t: ReturnType<typeof createTest>,
	startupId: Id<"startups">,
	userId: Id<"users">,
	titles: string[],
) {
	await t.run(async (ctx) => {
		const cycleId = await ctx.db.insert("cycles", {
			startupId,
			title: "Landing page",
			startAt: Date.now() - 7 * DAY,
			endAt: Date.now(),
			status: "closed",
		});
		for (const title of titles) {
			await ctx.db.insert("pulses", {
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

test("a profile shows internal Verified Pulses and Cycles as Proof of Work per public Startup", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await setup.founder.as.mutation(api.startups.update, {
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
			verifiedPulses: 2,
			cyclesCompleted: 1,
		}),
	]);
	expect(profile?.evidence.score).toBe(0);
});

test("work at a private Startup is shown only as aggregate counts", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await setup.founder.as.mutation(api.startups.update, {
		startupId: setup.startupId,
		isPublic: false,
	});
	await shipInClosedCycle(t, setup.startupId, setup.founder.userId, ["Hero"]);

	const profile = await (await signUp(t, "Visitor")).as.query(
		api.people.users.getByUsername,
		{ username: "founder" },
	);

	expect(profile?.proofOfWork.startups).toEqual([]);
	expect(profile?.proofOfWork.private).toEqual({
		startups: 1,
		verifiedPulses: 1,
		cyclesCompleted: 1,
	});
	expect(JSON.stringify(profile?.proofOfWork)).not.toContain("Acme");
	expect(JSON.stringify(profile?.proofOfWork)).not.toContain("Hero");
});
