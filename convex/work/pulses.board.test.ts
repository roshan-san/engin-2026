import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import {
	applicationIdOf,
	createTrial,
	enterTrial,
} from "../hiring/trialCycles.helpers";
import { advancePast, createTest, DAY, HOUR } from "../lib/testing.helpers";
import { type Person, signUp } from "../people/users.helpers";
import { joinAsMember, setUpStartup } from "../teams/startups.helpers";

/** A started Trial Cycle with one Challenge, Alice and Bob as Participants. */
async function setUpBoards() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const trialCycleId = await createTrial(setup, {
		startsInMs: DAY,
		challenges: [{ title: "Build the API" }],
	});
	const alice = await signUp(t, "Alice");
	const bob = await signUp(t, "Bob");
	for (const participant of [alice, bob]) {
		await enterTrial(setup, trialCycleId, participant);
	}
	await advancePast(t, DAY + HOUR);

	async function boardOf(viewer: Person, owner?: Person) {
		return await viewer.as.query(api.work.pulses.listBoard, {
			trialCycleId,
			participantUserId: owner?.userId,
		});
	}

	/** Runs out the clock and closes with a Passed Verdict for everyone. */
	async function close() {
		await advancePast(t, 8 * DAY);
		const verdicts = [];
		for (const participant of [alice, bob]) {
			verdicts.push({
				applicationId: await applicationIdOf(
					t,
					trialCycleId,
					participant.userId,
				),
				verdict: "passed" as const,
			});
		}
		await setup.founder.as.mutation(api.hiring.trialCycles.close, {
			trialCycleId,
			verdicts,
		});
	}

	return { t, setup, trialCycleId, alice, bob, boardOf, close };
}

async function firstPulseOf(
	board: Awaited<ReturnType<typeof setUpBoards>>["boardOf"],
	viewer: Person,
) {
	const [pulse] = await board(viewer);
	if (!pulse) {
		throw new Error("Board is empty");
	}
	return pulse;
}

describe("reading a Board", () => {
	test("a Participant cannot read another Participant's Board", async () => {
		const { alice, bob, boardOf } = await setUpBoards();

		await expect(boardOf(alice, bob)).rejects.toThrow("access to this Board");
	});

	test("a Founder can read any Participant's Board", async () => {
		const { setup, alice, bob, boardOf } = await setUpBoards();

		expect(await boardOf(setup.founder, alice)).toHaveLength(1);
		expect(await boardOf(setup.founder, bob)).toHaveLength(1);
	});

	test("a completed Participant still reads their Board after the close but cannot change it", async () => {
		const { alice, boardOf, close } = await setUpBoards();
		const { _id: pulseId } = await firstPulseOf(boardOf, alice);

		await close();

		expect(await boardOf(alice)).toHaveLength(1);
		await expect(
			alice.as.mutation(api.work.pulses.setStatus, { pulseId, status: "done" }),
		).rejects.toThrow("This Pulse is not on your Board");
	});

	test("a Participant who left cannot read their Board", async () => {
		const { trialCycleId, alice, boardOf } = await setUpBoards();

		await alice.as.mutation(api.hiring.applications.leaveTrial, {
			trialCycleId,
		});

		await expect(boardOf(alice)).rejects.toThrow("access to this Board");
	});

	test("a Member who is not a Founder cannot read a Board", async () => {
		const { setup, alice, boardOf } = await setUpBoards();
		const member = await joinAsMember(setup, "Casey");

		await expect(boardOf(member, alice)).rejects.toThrow(
			"access to this Board",
		);
	});
});

describe("editing a Board", () => {
	test("a Participant adds Pulses to their own Board, private from other Participants", async () => {
		const { setup, trialCycleId, alice, bob, boardOf } = await setUpBoards();

		await alice.as.mutation(api.work.pulses.create, {
			startupId: setup.startupId,
			trialCycleId,
			title: "Design the schema",
		});

		const titles = (await boardOf(alice)).map((pulse) => pulse.title).sort();
		expect(titles).toEqual(["Build the API", "Design the schema"]);
		expect((await boardOf(bob)).map((pulse) => pulse.title)).toEqual([
			"Build the API",
		]);
	});

	test("a Participant moves their own Pulse to done without review, and back", async () => {
		const { alice, boardOf } = await setUpBoards();
		const { _id: pulseId } = await firstPulseOf(boardOf, alice);
		const statusOf = async () => (await firstPulseOf(boardOf, alice)).status;

		await alice.as.mutation(api.work.pulses.setStatus, {
			pulseId,
			status: "in_progress",
		});
		expect(await statusOf()).toBe("in_progress");

		await alice.as.mutation(api.work.pulses.setStatus, {
			pulseId,
			status: "done",
		});
		expect(await statusOf()).toBe("done");

		await alice.as.mutation(api.work.pulses.setStatus, {
			pulseId,
			status: "todo",
		});
		expect(await statusOf()).toBe("todo");
	});

	test("a Participant edits and deletes Pulses on their own Board", async () => {
		const { alice, boardOf } = await setUpBoards();
		const { _id: pulseId } = await firstPulseOf(boardOf, alice);

		await alice.as.mutation(api.work.pulses.update, {
			pulseId,
			title: "Build the REST API",
			description: "Start with auth",
		});
		const edited = await firstPulseOf(boardOf, alice);
		expect(edited.title).toBe("Build the REST API");
		expect(edited.description).toBe("Start with auth");

		await alice.as.mutation(api.work.pulses.remove, { pulseId });
		expect(await boardOf(alice)).toEqual([]);
	});

	test("a Participant cannot change another Participant's Pulse", async () => {
		const { alice, bob, boardOf } = await setUpBoards();
		const { _id: pulseId } = await firstPulseOf(boardOf, alice);

		await expect(
			bob.as.mutation(api.work.pulses.setStatus, { pulseId, status: "done" }),
		).rejects.toThrow("not on your Board");
		await expect(
			bob.as.mutation(api.work.pulses.update, { pulseId, title: "Mine now" }),
		).rejects.toThrow("not on your Board");
		await expect(
			bob.as.mutation(api.work.pulses.remove, { pulseId }),
		).rejects.toThrow("not on your Board");
		expect((await firstPulseOf(boardOf, alice)).status).toBe("todo");
	});

	test("a Founder can read a Board but not change it", async () => {
		const { setup, trialCycleId, alice, boardOf } = await setUpBoards();
		const { _id: pulseId } = await firstPulseOf(boardOf, alice);

		await expect(
			setup.founder.as.mutation(api.work.pulses.setStatus, {
				pulseId,
				status: "done",
			}),
		).rejects.toThrow("not on your Board");
		await expect(
			setup.founder.as.mutation(api.work.pulses.create, {
				startupId: setup.startupId,
				trialCycleId,
				title: "Founder-added",
			}),
		).rejects.toThrow("Only Participants have a Board");
	});

	test("a Board cannot be edited once the Trial Cycle has ended", async () => {
		const { setup, trialCycleId, alice, boardOf } = await setUpBoards();
		const { _id: pulseId } = await firstPulseOf(boardOf, alice);

		await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
			trialCycleId,
		});

		await expect(
			alice.as.mutation(api.work.pulses.setStatus, { pulseId, status: "done" }),
		).rejects.toThrow("not active");
		await expect(
			alice.as.mutation(api.work.pulses.create, {
				startupId: setup.startupId,
				trialCycleId,
				title: "Too late",
			}),
		).rejects.toThrow("not active");
	});

	test("a Board cannot be edited before the Trial Cycle starts", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");
		await enterTrial(setup, trialCycleId, alice);

		await expect(
			alice.as.mutation(api.work.pulses.create, {
				startupId: setup.startupId,
				trialCycleId,
				title: "Too early",
			}),
		).rejects.toThrow("not active");
	});

	test("Founders do not review Pulses on a Board", async () => {
		const { setup, alice, boardOf } = await setUpBoards();
		const { _id: pulseId } = await firstPulseOf(boardOf, alice);

		await expect(
			setup.founder.as.mutation(api.work.pulses.verify, { pulseId }),
		).rejects.toThrow("not reviewed");
	});
});

describe("proof links", () => {
	test("a Participant adds and removes proof links on a Board Pulse while it runs", async () => {
		const { alice, boardOf } = await setUpBoards();
		const { _id: pulseId } = await firstPulseOf(boardOf, alice);
		const url = "https://github.com/acme/api/pull/12";

		await alice.as.mutation(api.work.pulses.addProofLink, {
			pulseId,
			kind: "pr",
			url,
		});
		expect((await firstPulseOf(boardOf, alice)).proofLinks).toEqual([
			{ kind: "pr", url },
		]);

		await alice.as.mutation(api.work.pulses.removeProofLink, { pulseId, url });
		expect((await firstPulseOf(boardOf, alice)).proofLinks ?? []).toEqual([]);
	});

	test("the eleventh proof link on a Pulse is refused", async () => {
		const { alice, boardOf } = await setUpBoards();
		const { _id: pulseId } = await firstPulseOf(boardOf, alice);
		for (let i = 0; i < 10; i++) {
			await alice.as.mutation(api.work.pulses.addProofLink, {
				pulseId,
				kind: "commit",
				url: `https://github.com/acme/api/commit/${i}`,
			});
		}

		await expect(
			alice.as.mutation(api.work.pulses.addProofLink, {
				pulseId,
				kind: "commit",
				url: "https://github.com/acme/api/commit/10",
			}),
		).rejects.toThrow("A Pulse can have at most 10 Proof Links");
	});
});
