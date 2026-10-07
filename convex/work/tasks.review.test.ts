import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { cycleIdOf, startedHackathonWith } from "../hiring/hackathons.helpers";
import { createTest } from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { type Person, signUp } from "../people/users.helpers";
import {
	joinAsCoFounder,
	joinAsMember,
	setUpStartup,
} from "../teams/startups.helpers";
import { cycleTaskFor, submitWithProof } from "./cycles.helpers";

async function setUpReview() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(setup, "Bob");
	const task = await cycleTaskFor(setup, bob);
	return { t, setup, bob, ...task };
}

describe("team Cycle review", () => {
	test("a Member moves a Task to review, which asks the Founders to verify it", async () => {
		const { setup, bob, taskId, statusOf } = await setUpReview();

		await submitWithProof(bob, taskId);

		expect(await statusOf()).toBe("review");
		expect(await notificationTitles(setup.founder.as)).toContain(
			"Hero section is ready for review",
		);
	});

	test("nobody can drag a Task to done; only a Founder's verification gets it there", async () => {
		const { setup, bob, taskId } = await setUpReview();

		await expect(
			bob.as.mutation(api.work.tasks.setStatus, { taskId, status: "done" }),
		).rejects.toThrow("Only a Founder can verify");
		await expect(
			setup.founder.as.mutation(api.work.tasks.setStatus, {
				taskId,
				status: "done",
			}),
		).rejects.toThrow("Only a Founder can verify");
		await expect(
			setup.founder.as.mutation(api.work.tasks.verify, { taskId }),
		).rejects.toThrow("not awaiting review");
	});

	test("the assignee cannot move a Task out of review", async () => {
		const { bob, taskId } = await setUpReview();
		await submitWithProof(bob, taskId);

		await expect(
			bob.as.mutation(api.work.tasks.setStatus, {
				taskId,
				status: "in_progress",
			}),
		).rejects.toThrow("awaiting review");
	});

	test("a Member cannot verify a Task", async () => {
		const { bob, taskId } = await setUpReview();
		await submitWithProof(bob, taskId);

		await expect(
			bob.as.mutation(api.work.tasks.verify, { taskId }),
		).rejects.toThrow("Only founders");
	});

	test("a Founder verifies a Task in review, and the assignee hears about it", async () => {
		const { setup, bob, taskId, statusOf } = await setUpReview();
		await submitWithProof(bob, taskId);

		await setup.founder.as.mutation(api.work.tasks.verify, { taskId });

		expect(await statusOf()).toBe("done");
		expect(await notificationTitles(bob.as)).toContain(
			"Hero section was verified",
		);
	});

	test("a Founder returns a Task to in progress with a required note", async () => {
		const { setup, bob, taskId, statusOf } = await setUpReview();
		await submitWithProof(bob, taskId);

		await expect(
			setup.founder.as.mutation(api.work.tasks.reject, { taskId, note: "  " }),
		).rejects.toThrow("Review note is required");
		await setup.founder.as.mutation(api.work.tasks.reject, {
			taskId,
			note: "Mobile layout breaks",
		});

		expect(await statusOf()).toBe("in_progress");
		expect(await notificationTitles(bob.as)).toContain(
			"Hero section needs changes",
		);
	});

	test("a Founder's own Task also goes through review", async () => {
		const { setup } = await setUpReview();
		const { taskId, statusOf } = await cycleTaskFor(setup, setup.founder);

		await submitWithProof(setup.founder, taskId);
		await setup.founder.as.mutation(api.work.tasks.verify, { taskId });

		expect(await statusOf()).toBe("done");
	});

	test("a Founder submitting their own Task notifies only the other Founders", async () => {
		const { setup } = await setUpReview();
		const asha = await joinAsCoFounder(setup, "Asha");
		const { taskId } = await cycleTaskFor(setup, setup.founder);

		await submitWithProof(setup.founder, taskId);

		expect(await notificationTitles(asha.as)).toContain(
			"Hero section is ready for review",
		);
		expect(await notificationTitles(setup.founder.as)).not.toContain(
			"Hero section is ready for review",
		);
	});

	test("a Task in review keeps its title and proof until it is reviewed", async () => {
		const { bob, taskId } = await setUpReview();
		await bob.as.mutation(api.work.tasks.addProofLink, {
			taskId,
			kind: "pr",
			url: "https://github.com/acme/web/pull/7",
		});
		await submitWithProof(bob, taskId);

		await expect(
			bob.as.mutation(api.work.tasks.update, { taskId, title: "Renamed" }),
		).rejects.toThrow("This Task is awaiting review");
		await expect(
			bob.as.mutation(api.work.tasks.removeProofLink, {
				taskId,
				url: "https://github.com/acme/web/pull/7",
			}),
		).rejects.toThrow("This Task is awaiting review");
	});

	test("a Task with no proof link cannot go to review", async () => {
		const { bob, taskId, statusOf } = await setUpReview();

		await expect(
			bob.as.mutation(api.work.tasks.setStatus, { taskId, status: "review" }),
		).rejects.toThrow("Add proof before sending this Task for review");

		expect(await statusOf()).toBe("in_progress");
	});
});

/** A started hackathon with Alice in it, and her copy of its Starter Task. */
async function setUpHackathonReview() {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const hackathonId = await startedHackathonWith(setup, [alice]);
	const cycleId = await cycleIdOf(t, hackathonId);
	const [task] = await alice.as.query(api.work.tasks.listLane, { cycleId });
	if (!task) {
		throw new Error("Lane is empty");
	}
	const taskId: Id<"tasks"> = task._id;

	async function statusOf() {
		const lane = await alice.as.query(api.work.tasks.listLane, { cycleId });
		return lane.find((item) => item._id === taskId)?.status;
	}
	async function hrefsOf(person: Person) {
		const { notifications } = await person.as.query(
			api.people.notifications.list,
			{},
		);
		return notifications.map((item) => [item.title, item.href]);
	}

	return { t, setup, alice, hackathonId, taskId, statusOf, hrefsOf };
}

describe("hackathon review", () => {
	test("a Participant's Task with no proof link cannot go to review", async () => {
		const { alice, taskId, statusOf } = await setUpHackathonReview();

		await expect(
			alice.as.mutation(api.work.tasks.setStatus, { taskId, status: "review" }),
		).rejects.toThrow("Add proof before sending this Task for review");

		expect(await statusOf()).toBe("todo");
	});

	test("a Participant cannot move their Task straight to done", async () => {
		const { alice, taskId } = await setUpHackathonReview();

		await expect(
			alice.as.mutation(api.work.tasks.setStatus, { taskId, status: "done" }),
		).rejects.toThrow("Only a Founder can verify a Task, once it is in review");
	});

	test("a Participant's submission asks the Founders to review it on the Hackathon screen", async () => {
		const { setup, alice, hackathonId, taskId, hrefsOf } =
			await setUpHackathonReview();

		await submitWithProof(alice, taskId);

		expect(await hrefsOf(setup.founder)).toContainEqual([
			"Ship the feature is ready for review",
			`/s/acme/hackathons/${hackathonId}`,
		]);
	});

	test("a Founder verifies a Participant's Task and the Participant hears about it", async () => {
		const { setup, alice, hackathonId, taskId, statusOf, hrefsOf } =
			await setUpHackathonReview();
		await submitWithProof(alice, taskId);

		await setup.founder.as.mutation(api.work.tasks.verify, { taskId });

		expect(await statusOf()).toBe("done");
		expect(await hrefsOf(alice)).toContainEqual([
			"Ship the feature was verified",
			`/s/acme/hackathons/${hackathonId}`,
		]);
	});

	test("a Founder sends a Participant's Task back and the Participant hears about it", async () => {
		const { setup, alice, taskId, statusOf } = await setUpHackathonReview();
		await submitWithProof(alice, taskId);

		await setup.founder.as.mutation(api.work.tasks.reject, {
			taskId,
			note: "Add tests",
		});

		expect(await statusOf()).toBe("in_progress");
		expect(await notificationTitles(alice.as)).toContain(
			"Ship the feature needs changes",
		);
	});
});
