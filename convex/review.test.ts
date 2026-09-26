import { expect, test } from "vitest";
import { api } from "./_generated/api";
import {
	createTest,
	cyclePulseFor,
	joinAsMember,
	notificationTitles,
	setUpStartup,
} from "./test.helpers";

async function setUpReview() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(t, setup, "Bob");
	const pulse = await cyclePulseFor(t, setup, bob);
	return { t, setup, bob, ...pulse };
}

test("a Member moves a Pulse to review, which asks the Founders to verify it", async () => {
	const { setup, bob, pulseId, statusOf } = await setUpReview();

	await bob.as.mutation(api.pulses.setStatus, { pulseId, status: "review" });

	expect(await statusOf()).toBe("review");
	expect(await notificationTitles(setup.founder.as)).toContain(
		"Hero section is ready for review",
	);
});

test("nobody can drag a Pulse to done; only a Founder's verification gets it there", async () => {
	const { setup, bob, pulseId } = await setUpReview();

	await expect(
		bob.as.mutation(api.pulses.setStatus, { pulseId, status: "done" }),
	).rejects.toThrow("Only a Founder can verify");
	await expect(
		setup.founder.as.mutation(api.pulses.setStatus, {
			pulseId,
			status: "done",
		}),
	).rejects.toThrow("Only a Founder can verify");
	await expect(
		setup.founder.as.mutation(api.pulses.verify, { pulseId }),
	).rejects.toThrow("not awaiting review");
});

test("the assignee cannot move a Pulse out of review", async () => {
	const { bob, pulseId } = await setUpReview();
	await bob.as.mutation(api.pulses.setStatus, { pulseId, status: "review" });

	await expect(
		bob.as.mutation(api.pulses.setStatus, { pulseId, status: "in_progress" }),
	).rejects.toThrow("awaiting review");
});

test("a Member cannot verify a Pulse", async () => {
	const { bob, pulseId } = await setUpReview();
	await bob.as.mutation(api.pulses.setStatus, { pulseId, status: "review" });

	await expect(bob.as.mutation(api.pulses.verify, { pulseId })).rejects.toThrow(
		"Only founders",
	);
});

test("a Founder verifies a Pulse in review, and the assignee hears about it", async () => {
	const { setup, bob, pulseId, statusOf } = await setUpReview();
	await bob.as.mutation(api.pulses.setStatus, { pulseId, status: "review" });

	await setup.founder.as.mutation(api.pulses.verify, { pulseId });

	expect(await statusOf()).toBe("done");
	expect(await notificationTitles(bob.as)).toContain(
		"Hero section was verified",
	);
});

test("a Founder returns a Pulse to in progress with a required note", async () => {
	const { setup, bob, pulseId, statusOf } = await setUpReview();
	await bob.as.mutation(api.pulses.setStatus, { pulseId, status: "review" });

	await expect(
		setup.founder.as.mutation(api.pulses.reject, { pulseId, note: "  " }),
	).rejects.toThrow("Review note is required");
	await setup.founder.as.mutation(api.pulses.reject, {
		pulseId,
		note: "Mobile layout breaks",
	});

	expect(await statusOf()).toBe("in_progress");
	expect(await notificationTitles(bob.as)).toContain(
		"Hero section needs changes",
	);
});

test("a Founder's own Pulse also goes through review", async () => {
	const { t, setup } = await setUpReview();
	const { pulseId, statusOf } = await cyclePulseFor(t, setup, setup.founder);

	await setup.founder.as.mutation(api.pulses.setStatus, {
		pulseId,
		status: "review",
	});
	await setup.founder.as.mutation(api.pulses.verify, { pulseId });

	expect(await statusOf()).toBe("done");
});
