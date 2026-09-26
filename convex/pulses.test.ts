import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import {
	createTest,
	DAY,
	notificationTitles,
	scoreOf,
	setUpStartup,
	signUp,
	startedTrialWith,
} from "./test.helpers";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

async function setUpTrialPulse() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(t, setup, [alice]);
	const pulseId = await setup.founder.as.mutation(api.pulses.create, {
		startupId: setup.startupId,
		title: "Write the API",
		trialCycleId,
	});
	await alice.as.mutation(api.pulses.assignToMe, { pulseId });
	await alice.as.mutation(api.pulses.setStatus, { pulseId, status: "done" });

	async function pulseStatus() {
		const pulses = await alice.as.query(api.pulses.listForTrial, {
			trialCycleId,
		});
		return pulses.find((pulse) => pulse._id === pulseId);
	}

	return { t, setup, alice, pulseId, pulseStatus };
}

test("a Participant marking a trial Pulse done submits it without earning Score", async () => {
	const { t, alice, pulseStatus } = await setUpTrialPulse();

	expect((await pulseStatus())?.status).toBe("review");
	expect(await scoreOf(t, alice.userId)).toBe(0);
});

test("verifying a Submitted Pulse marks it done without earning Score", async () => {
	const { t, setup, alice, pulseId, pulseStatus } = await setUpTrialPulse();

	await setup.founder.as.mutation(api.pulses.verify, { pulseId });

	expect((await pulseStatus())?.status).toBe("done");
	expect(await scoreOf(t, alice.userId)).toBe(0);
});

test("a Member rejecting a Submitted Pulse sends it back with a note", async () => {
	const { setup, alice, pulseId, pulseStatus } = await setUpTrialPulse();

	await setup.founder.as.mutation(api.pulses.reject, {
		pulseId,
		note: "Missing tests",
	});

	const pulse = await pulseStatus();
	expect(pulse?.status).toBe("in_progress");
	expect(pulse?.reviewNote).toBe("Missing tests");
	expect(await notificationTitles(alice.as)).toContain(
		"Write the API needs changes",
	);
});

test("a Participant cannot verify their own Pulse", async () => {
	const { alice, pulseId } = await setUpTrialPulse();

	await expect(
		alice.as.mutation(api.pulses.verify, { pulseId }),
	).rejects.toThrow("not a member");
});

test("a Participant cannot pull back a Submitted Pulse or undo a Verified one", async () => {
	const { setup, alice, pulseId } = await setUpTrialPulse();

	await expect(
		alice.as.mutation(api.pulses.setStatus, { pulseId, status: "in_progress" }),
	).rejects.toThrow("awaiting review");

	await setup.founder.as.mutation(api.pulses.verify, { pulseId });

	await expect(
		alice.as.mutation(api.pulses.setStatus, { pulseId, status: "todo" }),
	).rejects.toThrow("already verified");
});

async function setUpCycle() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const cycleId = await setup.founder.as.mutation(api.cycles.create, {
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
		setup.founder.as.mutation(api.pulses.create, {
			startupId: setup.startupId,
			title: "Floating work",
		}),
	).rejects.toThrow("Pulse must belong to a Cycle");
});

test("a new internal Pulse starts in todo", async () => {
	const { setup, cycleId } = await setUpCycle();

	await setup.founder.as.mutation(api.pulses.create, {
		startupId: setup.startupId,
		title: "Hero section",
		cycleId,
	});

	const pulses = await setup.founder.as.query(api.pulses.listForCycle, {
		cycleId,
	});
	expect(pulses.map((pulse) => pulse.status)).toEqual(["todo"]);
});

test("Proof Links can be added to and removed from a Pulse", async () => {
	const { setup, cycleId } = await setUpCycle();
	const pulseId = await setup.founder.as.mutation(api.pulses.create, {
		startupId: setup.startupId,
		title: "Hero section",
		cycleId,
	});

	await setup.founder.as.mutation(api.pulses.addProofLink, {
		pulseId,
		kind: "pr",
		url: "https://github.com/acme/web/pull/1",
	});
	await setup.founder.as.mutation(api.pulses.addProofLink, {
		pulseId,
		kind: "deploy",
		url: "https://acme.dev",
	});
	await setup.founder.as.mutation(api.pulses.removeProofLink, {
		pulseId,
		url: "https://github.com/acme/web/pull/1",
	});

	const [pulse] = await setup.founder.as.query(api.pulses.listForCycle, {
		cycleId,
	});
	expect(pulse?.proofLinks).toEqual([
		{ kind: "deploy", url: "https://acme.dev" },
	]);
});

test("a Proof Link must be a web address", async () => {
	const { setup, cycleId } = await setUpCycle();
	const pulseId = await setup.founder.as.mutation(api.pulses.create, {
		startupId: setup.startupId,
		title: "Hero section",
		cycleId,
	});

	await expect(
		setup.founder.as.mutation(api.pulses.addProofLink, {
			pulseId,
			kind: "doc",
			url: "not a link",
		}),
	).rejects.toThrow("must start with http");
});
