import { expect, test } from "vitest";
import { api } from "../_generated/api";
import { createTest } from "../lib/testing.helpers";
import { MAX_CYCLE_PULSES } from "../lib/limits";
import { joinAsMember, setUpStartup } from "../teams/startups.helpers";
import { cyclePulseFor } from "./cycles.helpers";

async function setUpBoard() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(setup, "Bob");
	const cycle = await cyclePulseFor(setup, bob);
	return { t, setup, bob, ...cycle };
}

test("taking an unassigned Todo Pulse assigns it and moves it to In progress", async () => {
	const { setup, bob, cycleId } = await setUpBoard();
	const pulseId = await bob.as.mutation(api.work.pulses.create, {
		startupId: setup.startupId,
		title: "Pricing table",
		cycleId,
	});

	await bob.as.mutation(api.work.pulses.assignToMe, { pulseId });

	const pulses = await bob.as.query(api.work.pulses.listForCycle, { cycleId });
	const pulse = pulses.find((item) => item._id === pulseId);
	expect(pulse?.status).toBe("in_progress");
	expect(pulse?.assignee?.name).toBe("Bob");
});

test("a Member moves work between Todo, In progress and Review", async () => {
	const { bob, pulseId, statusOf } = await setUpBoard();

	await bob.as.mutation(api.work.pulses.setStatus, { pulseId, status: "todo" });
	expect(await statusOf()).toBe("todo");
	await bob.as.mutation(api.work.pulses.setStatus, {
		pulseId,
		status: "in_progress",
	});
	expect(await statusOf()).toBe("in_progress");
});

test("a Done Pulse is final", async () => {
	const { setup, bob, pulseId } = await setUpBoard();
	await bob.as.mutation(api.work.pulses.setStatus, {
		pulseId,
		status: "review",
	});
	await setup.founder.as.mutation(api.work.pulses.verify, { pulseId });

	await expect(
		setup.founder.as.mutation(api.work.pulses.setStatus, {
			pulseId,
			status: "in_progress",
		}),
	).rejects.toThrow("This Pulse is already verified");
});

test("a closed Cycle's board is read-only", async () => {
	const { setup, bob, cycleId, pulseId } = await setUpBoard();
	const inReview = await bob.as.mutation(api.work.pulses.create, {
		startupId: setup.startupId,
		title: "Review me",
		cycleId,
	});
	await bob.as.mutation(api.work.pulses.setStatus, {
		pulseId: inReview,
		status: "review",
	});

	await setup.founder.as.mutation(api.work.cycles.close, { cycleId });

	const refusals = [
		bob.as.mutation(api.work.pulses.setStatus, { pulseId, status: "todo" }),
		bob.as.mutation(api.work.pulses.create, {
			startupId: setup.startupId,
			title: "Late",
			cycleId,
		}),
		bob.as.mutation(api.work.pulses.assignToMe, { pulseId }),
		bob.as.mutation(api.work.pulses.remove, { pulseId }),
		setup.founder.as.mutation(api.work.pulses.verify, { pulseId: inReview }),
		setup.founder.as.mutation(api.work.pulses.reject, {
			pulseId: inReview,
			note: "Redo",
		}),
	];
	for (const refusal of refusals) {
		await expect(refusal).rejects.toThrow("This Cycle is closed");
	}
});

test("a Cycle holds at most 200 Pulses", async () => {
	const { t, setup, bob, cycleId } = await setUpBoard();
	await t.run(async (ctx) => {
		for (let index = 1; index < MAX_CYCLE_PULSES; index++) {
			await ctx.db.insert("pulses", {
				startupId: setup.startupId,
				cycleId,
				title: `Pulse ${index}`,
				status: "todo",
				createdByUserId: bob.userId,
			});
		}
	});

	await expect(
		bob.as.mutation(api.work.pulses.create, {
			startupId: setup.startupId,
			title: "One too many",
			cycleId,
		}),
	).rejects.toThrow("A Cycle can have at most 200 Pulses");
});
