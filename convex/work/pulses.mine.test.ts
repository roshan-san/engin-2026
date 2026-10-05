import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import { startedTrialWith } from "../hiring/trialCycles.helpers";
import { createTest } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";
import { joinAsMember, setUpStartup } from "../teams/startups.helpers";
import { cyclePulseFor } from "./cycles.helpers";

async function setUpWork() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(setup, "Bob");
	const pulse = await cyclePulseFor(setup, bob);
	return { t, setup, bob, ...pulse };
}

describe("My Pulses", () => {
	test("lists a Cycle Pulse with its Startup and Cycle", async () => {
		const { bob, cycleId } = await setUpWork();

		const pulses = await bob.as.query(api.work.pulses.listMine, {});

		expect(pulses).toHaveLength(1);
		expect(pulses[0]).toMatchObject({
			title: "Hero section",
			status: "in_progress",
			startupName: "Acme",
			place: { kind: "cycle", cycleId, title: "Landing page" },
		});
	});

	test("lists a participant's Board Pulses with their hackathon", async () => {
		const { setup } = await setUpWork();
		const alice = await signUp(setup.t, "Alice");
		const trialCycleId = await startedTrialWith(setup, [alice]);

		const pulses = await alice.as.query(api.work.pulses.listMine, {});

		expect(pulses).toHaveLength(1);
		expect(pulses[0]).toMatchObject({
			title: "Ship the feature",
			status: "todo",
			startupName: "Acme",
			place: { kind: "trial", trialCycleId, title: "Build a feature" },
		});
	});

	test("hides Board Pulses once the participant left", async () => {
		const { setup } = await setUpWork();
		const alice = await signUp(setup.t, "Alice");
		const trialCycleId = await startedTrialWith(setup, [alice]);

		await alice.as.mutation(api.hiring.applications.leaveTrial, {
			trialCycleId,
		});

		expect(await alice.as.query(api.work.pulses.listMine, {})).toEqual([]);
	});

	test("hides Pulses on a Cycle the user was removed from", async () => {
		const { setup, bob, cycleId } = await setUpWork();

		await setup.founder.as.mutation(api.work.cycles.removeMember, {
			cycleId,
			userId: bob.userId,
		});

		expect(await bob.as.query(api.work.pulses.listMine, {})).toEqual([]);
	});
});

describe("awaiting review", () => {
	test("a Founder sees a submitted Pulse with its assignee and Cycle", async () => {
		const { setup, bob, pulseId, cycleId } = await setUpWork();

		await bob.as.mutation(api.work.pulses.setStatus, {
			pulseId,
			status: "review",
		});

		const queue = await setup.founder.as.query(
			api.work.pulses.listToReview,
			{},
		);
		expect(queue).toHaveLength(1);
		expect(queue[0]).toMatchObject({
			title: "Hero section",
			cycleId,
			cycleTitle: "Landing page",
			assignee: { _id: bob.userId },
		});
	});

	test("a Member who founds nothing has no review queue", async () => {
		const { bob, pulseId } = await setUpWork();
		await bob.as.mutation(api.work.pulses.setStatus, {
			pulseId,
			status: "review",
		});

		expect(await bob.as.query(api.work.pulses.listToReview, {})).toEqual([]);
	});

	test("a verified Pulse leaves the queue", async () => {
		const { setup, bob, pulseId } = await setUpWork();
		await bob.as.mutation(api.work.pulses.setStatus, {
			pulseId,
			status: "review",
		});

		await setup.founder.as.mutation(api.work.pulses.verify, { pulseId });

		expect(
			await setup.founder.as.query(api.work.pulses.listToReview, {}),
		).toEqual([]);
	});
});
