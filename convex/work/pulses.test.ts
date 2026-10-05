import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import { createTest, DAY } from "../lib/testing.helpers";
import { joinAsMember, setUpStartup } from "../teams/startups.helpers";
import { cyclePulseFor } from "./cycles.helpers";

async function setUpCycle() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const cycleId = await setup.founder.as.mutation(api.work.cycles.create, {
		startupId: setup.startupId,
		title: "Landing page",
		startAt: Date.now(),
		endAt: Date.now() + 7 * DAY,
	});
	return { t, setup, cycleId };
}

test("an internal Pulse must belong to a Cycle", async () => {
	const { setup } = await setUpCycle();

	await expect(
		setup.founder.as.mutation(api.work.pulses.create, {
			startupId: setup.startupId,
			title: "Floating work",
		}),
	).rejects.toThrow("Pulse must belong to a Cycle");
});

test("a new internal Pulse starts in todo", async () => {
	const { setup, cycleId } = await setUpCycle();

	await setup.founder.as.mutation(api.work.pulses.create, {
		startupId: setup.startupId,
		title: "Hero section",
		cycleId,
	});

	const pulses = await setup.founder.as.query(api.work.pulses.listForCycle, {
		cycleId,
	});
	expect(pulses.map((pulse) => pulse.status)).toEqual(["todo"]);
});

test("Proof Links can be added to and removed from a Pulse", async () => {
	const { setup, cycleId } = await setUpCycle();
	const pulseId = await setup.founder.as.mutation(api.work.pulses.create, {
		startupId: setup.startupId,
		title: "Hero section",
		cycleId,
	});

	await setup.founder.as.mutation(api.work.pulses.addProofLink, {
		pulseId,
		kind: "pr",
		url: "https://github.com/acme/web/pull/1",
	});
	await setup.founder.as.mutation(api.work.pulses.addProofLink, {
		pulseId,
		kind: "deploy",
		url: "https://acme.dev",
	});
	await setup.founder.as.mutation(api.work.pulses.removeProofLink, {
		pulseId,
		url: "https://github.com/acme/web/pull/1",
	});

	const [pulse] = await setup.founder.as.query(api.work.pulses.listForCycle, {
		cycleId,
	});
	expect(pulse?.proofLinks).toEqual([
		{ kind: "deploy", url: "https://acme.dev" },
	]);
});

test("a Proof Link must be a web address", async () => {
	const { setup, cycleId } = await setUpCycle();
	const pulseId = await setup.founder.as.mutation(api.work.pulses.create, {
		startupId: setup.startupId,
		title: "Hero section",
		cycleId,
	});

	await expect(
		setup.founder.as.mutation(api.work.pulses.addProofLink, {
			pulseId,
			kind: "doc",
			url: "not a link",
		}),
	).rejects.toThrow("must start with http");
});

test("anyone in a Cycle can edit a Pulse's title and description", async () => {
	const { setup, cycleId } = await setUpCycle();
	const pulseId = await setup.founder.as.mutation(api.work.pulses.create, {
		startupId: setup.startupId,
		title: "Hero section",
		cycleId,
	});

	await setup.founder.as.mutation(api.work.pulses.update, {
		pulseId,
		title: "Hero and pricing",
		description: "Two sections",
	});

	const [pulse] = await setup.founder.as.query(api.work.pulses.listForCycle, {
		cycleId,
	});
	expect(pulse?.title).toBe("Hero and pricing");
	expect(pulse?.description).toBe("Two sections");
});

describe("taking and deleting", () => {
	async function setUpTeam() {
		const t = createTest();
		const setup = await setUpStartup(t);
		const bob = await joinAsMember(setup, "Bob");
		const carol = await joinAsMember(setup, "Carol");
		const { cycleId, pulseId, statusOf } = await cyclePulseFor(setup, bob);
		await setup.founder.as.mutation(api.work.cycles.addMember, {
			cycleId,
			userId: carol.userId,
		});
		return { setup, bob, carol, cycleId, pulseId, statusOf };
	}

	test("nobody can take a Pulse someone else holds", async () => {
		const { setup, bob, carol, cycleId, pulseId } = await setUpTeam();

		await expect(
			carol.as.mutation(api.work.pulses.assignToMe, { pulseId }),
		).rejects.toThrow("Someone else has taken this Pulse");

		const pulses = await setup.founder.as.query(api.work.pulses.listForCycle, {
			cycleId,
		});
		expect(pulses[0]?.assignee?._id).toBe(bob.userId);
	});

	test("the creator deletes their Pulse", async () => {
		const { setup, bob, cycleId, pulseId } = await setUpTeam();

		await bob.as.mutation(api.work.pulses.remove, { pulseId });

		expect(
			await setup.founder.as.query(api.work.pulses.listForCycle, { cycleId }),
		).toEqual([]);
	});

	test("another Member cannot delete someone's Pulse", async () => {
		const { carol, pulseId } = await setUpTeam();

		await expect(
			carol.as.mutation(api.work.pulses.remove, { pulseId }),
		).rejects.toThrow("You cannot delete this Pulse");
	});

	test("a Founder deletes any Pulse that is not in review or done", async () => {
		const { setup, cycleId, pulseId } = await setUpTeam();

		await setup.founder.as.mutation(api.work.pulses.remove, { pulseId });

		expect(
			await setup.founder.as.query(api.work.pulses.listForCycle, { cycleId }),
		).toEqual([]);
	});

	test("a Pulse in review or verified cannot be deleted", async () => {
		const { setup, bob, pulseId } = await setUpTeam();
		await bob.as.mutation(api.work.pulses.setStatus, {
			pulseId,
			status: "review",
		});

		await expect(
			setup.founder.as.mutation(api.work.pulses.remove, { pulseId }),
		).rejects.toThrow("This Pulse is awaiting review");
		await setup.founder.as.mutation(api.work.pulses.verify, { pulseId });
		await expect(
			setup.founder.as.mutation(api.work.pulses.remove, { pulseId }),
		).rejects.toThrow("This Pulse is already verified");
	});
});
