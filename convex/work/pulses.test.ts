import { expect, test } from "vitest";
import { api } from "../_generated/api";
import { createTest, DAY } from "../lib/testing.helpers";
import { setUpStartup } from "../teams/startups.helpers";

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
