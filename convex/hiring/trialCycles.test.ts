import { describe, expect, test, vi } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { balanceOf, giveCredit } from "../billing/credits.helpers";
import {
	advancePast,
	type Client,
	createTest,
	DAY,
	HOUR,
	type TestConvex,
} from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { scoreOf, signUp } from "../people/users.helpers";
import { joinAsMember, setUpStartup } from "../teams/startups.helpers";
import {
	applicationIdOf,
	createDraftTrial,
	createTrial,
	enterTrial,
	startedTrialWith,
} from "./trialCycles.helpers";

async function evidenceOf(t: TestConvex, username: string) {
	const profile = await t.query(api.people.users.getByUsername, { username });
	return profile?.evidence;
}

async function publish(
	as: Client,
	trialCycleId: Id<"trialCycles">,
	acceptTerms = true,
) {
	await as.mutation(api.hiring.trialCycles.publish, {
		trialCycleId,
		acceptTerms,
	});
}

describe("joining and starting", () => {
	test("an accepted applicant becomes a Participant", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup);
		const alice = await signUp(t, "Alice");

		await enterTrial(setup, trialCycleId, alice);

		const trial = await alice.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.isParticipant).toBe(true);
		expect(trial?.participantCount).toBe(1);
	});

	test("an applicant is not a Participant until accepted", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup);
		const alice = await signUp(t, "Alice");

		await alice.as.mutation(api.hiring.applications.applyToTrial, {
			acceptTerms: true,
			trialCycleId,
		});

		const trial = await alice.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.myStatus).toBe("applied");
		expect(trial?.isParticipant).toBe(false);
		expect(trial?.participantCount).toBe(0);
	});

	test("a Trial Cycle with Participants becomes active at its start time", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");
		await enterTrial(setup, trialCycleId, alice);

		await advancePast(t, DAY + HOUR);

		const trial = await alice.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.status).toBe("active");
	});

	test("a Trial Cycle nobody joined is cancelled at its start time and the Founder is told", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup, { startsInMs: DAY });

		await advancePast(t, DAY + HOUR);

		const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.status).toBe("cancelled");
		expect(await notificationTitles(setup.founder.as)).toContain(
			"Build a feature was cancelled: nobody joined",
		);
	});

	test("Participants are told when a Trial Cycle starts", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");
		await enterTrial(setup, trialCycleId, alice);

		await advancePast(t, DAY + HOUR);

		expect(await notificationTitles(alice.as)).toContain(
			"Build a feature has started",
		);
	});

	test("nobody can apply to a Trial Cycle after its application deadline", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup, {
			startsInMs: 2 * DAY,
			applicationDeadlineInMs: DAY,
		});
		const alice = await signUp(t, "Alice");

		vi.advanceTimersByTime(DAY + HOUR);

		await expect(
			alice.as.mutation(api.hiring.applications.applyToTrial, {
				acceptTerms: true,
				trialCycleId,
			}),
		).rejects.toThrow("no longer accepting");
	});

	test("pending applications are rejected when a Trial Cycle starts", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");
		const bob = await signUp(t, "Bob");
		await alice.as.mutation(api.hiring.applications.applyToTrial, {
			acceptTerms: true,
			trialCycleId,
		});
		await bob.as.mutation(api.hiring.applications.applyToTrial, {
			acceptTerms: true,
			trialCycleId,
		});
		const aliceApplication = await applicationIdOf(
			t,
			trialCycleId,
			alice.userId,
		);
		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: aliceApplication,
			status: "joined",
		});

		await advancePast(t, DAY + HOUR);

		const trial = await bob.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.myStatus).toBe("rejected");
	});
});

describe("cancelling", () => {
	test("a Founder can cancel an active Trial Cycle and Participants are told", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");
		await enterTrial(setup, trialCycleId, alice);
		await advancePast(t, DAY + HOUR);

		await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
			trialCycleId,
		});

		const trial = await alice.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.status).toBe("cancelled");
		expect(await notificationTitles(alice.as)).toContain(
			"Build a feature was cancelled",
		);
	});

	test("a cancelled Trial Cycle stays cancelled when its start time passes", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");
		await enterTrial(setup, trialCycleId, alice);
		await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
			trialCycleId,
		});

		await advancePast(t, DAY + HOUR);

		const trial = await alice.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.status).toBe("cancelled");
	});

	test("work stops when a Trial Cycle is cancelled", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const trialCycleId = await startedTrialWith(setup, [alice]);
		const pulseId = await alice.as.mutation(api.work.pulses.create, {
			startupId: setup.startupId,
			title: "Write the API",
			trialCycleId,
		});

		await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
			trialCycleId,
		});

		await expect(
			alice.as.mutation(api.work.pulses.setStatus, { pulseId, status: "done" }),
		).rejects.toThrow("not active");
		expect(await scoreOf(t, alice.userId)).toBe(0);
		expect((await evidenceOf(t, "alice"))?.trialCyclesLeft).toBe(0);
	});

	test("a Founder can cancel a draft", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup);

		await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
			trialCycleId,
		});

		const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.status).toBe("cancelled");
	});
});

describe("drafts and publishing", () => {
	test("publishing spends one credit, opens the hackathon and schedules its start", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup, {
			startsInMs: DAY,
			prize: "₹5,000 to the winner",
		});
		await giveCredit(t, setup.founder.userId);

		await publish(setup.founder.as, trialCycleId);

		expect(await balanceOf(setup.founder.as)).toBe(0);
		const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.status).toBe("open");
		expect(trial?.creditSource).toBe("purchase");
		expect(trial?.ipAcknowledgedAt).toBeDefined();
		const { trials } = await t.query(api.hiring.opportunities.search, {});
		expect(trials.map((card) => card.prize)).toEqual(["₹5,000 to the winner"]);

		const alice = await signUp(t, "Alice");
		await enterTrial(setup, trialCycleId, alice);
		await advancePast(t, DAY + HOUR);
		expect(
			(await alice.as.query(api.hiring.trialCycles.get, { trialCycleId }))
				?.status,
		).toBe("active");
	});

	test("publishing a second time is rejected and spends nothing", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup);
		await giveCredit(t, setup.founder.userId);
		await giveCredit(t, setup.founder.userId);
		await publish(setup.founder.as, trialCycleId);

		await expect(publish(setup.founder.as, trialCycleId)).rejects.toThrow(
			"Only a draft",
		);
		expect(await balanceOf(setup.founder.as)).toBe(1);
	});

	test("publishing without a credit fails and leaves the draft", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup);

		await expect(publish(setup.founder.as, trialCycleId)).rejects.toThrow(
			"no hackathon credits",
		);
		const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.status).toBe("draft");
	});

	test("only a Founder can publish, and only with their own credits", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup);
		const member = await joinAsMember(setup, "Mia");
		await giveCredit(t, member.userId);

		await expect(publish(member.as, trialCycleId)).rejects.toThrow(
			"Only founders",
		);

		const cofounder = await signUp(t, "Cody");
		await t.run(async (ctx) => {
			await ctx.db.insert("memberships", {
				startupId: setup.startupId,
				userId: cofounder.userId,
				role: "founder",
			});
		});
		await giveCredit(t, setup.founder.userId);
		await expect(publish(cofounder.as, trialCycleId)).rejects.toThrow(
			"no hackathon credits",
		);
		expect(await balanceOf(setup.founder.as)).toBe(1);
	});

	test("a stealth startup can't publish a public hackathon", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup);
		await giveCredit(t, setup.founder.userId);
		await setup.founder.as.mutation(api.teams.startups.update, {
			startupId: setup.startupId,
			isPublic: false,
		});

		await expect(publish(setup.founder.as, trialCycleId)).rejects.toThrow(
			"Turn off stealth mode",
		);
	});

	test("a draft for a closed Role can't be published", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup);
		await giveCredit(t, setup.founder.userId);
		await t.run(async (ctx) => {
			await ctx.db.patch(setup.roleId, { status: "closed" });
		});

		await expect(publish(setup.founder.as, trialCycleId)).rejects.toThrow(
			"This Role is closed",
		);
	});

	test("publishing requires the IP acknowledgment", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup);
		await giveCredit(t, setup.founder.userId);

		await expect(
			publish(setup.founder.as, trialCycleId, false),
		).rejects.toThrow("IP terms");
		expect(await balanceOf(setup.founder.as)).toBe(1);
	});
});

describe("publish checks", () => {
	test("a draft with no Starting Pulse can't be published", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup, { challenges: [] });
		await giveCredit(t, setup.founder.userId);

		await expect(publish(setup.founder.as, trialCycleId)).rejects.toThrow(
			"Add at least one Starting Pulse before publishing",
		);

		expect(await balanceOf(setup.founder.as)).toBe(1);
	});

	test("stealth is reported before a missing Starting Pulse, and that before passed dates", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup, {
			startsInMs: DAY,
			challenges: [],
		});
		await giveCredit(t, setup.founder.userId);
		await setup.founder.as.mutation(api.teams.startups.update, {
			startupId: setup.startupId,
			isPublic: false,
		});
		vi.advanceTimersByTime(2 * DAY);

		await expect(publish(setup.founder.as, trialCycleId)).rejects.toThrow(
			"Turn off stealth mode",
		);
		await setup.founder.as.mutation(api.teams.startups.update, {
			startupId: setup.startupId,
			isPublic: true,
		});
		await expect(publish(setup.founder.as, trialCycleId)).rejects.toThrow(
			"Starting Pulse",
		);
		await setup.founder.as.mutation(api.hiring.challenges.add, {
			trialCycleId,
			title: "Build the API",
		});
		await expect(publish(setup.founder.as, trialCycleId)).rejects.toThrow(
			"Pick new dates",
		);

		const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
			trialCycleId,
		});
		expect(trial?.status).toBe("draft");
		expect(trial?.ipAcknowledgedAt).toBeUndefined();
		expect(await balanceOf(setup.founder.as)).toBe(1);
	});

	test("publishing tells the other co-founders and logs the activity", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const cofounder = await signUp(t, "Cody");
		await t.run(async (ctx) => {
			await ctx.db.insert("memberships", {
				startupId: setup.startupId,
				userId: cofounder.userId,
				role: "founder",
			});
		});
		const trialCycleId = await createDraftTrial(setup);
		await giveCredit(t, setup.founder.userId);

		await publish(setup.founder.as, trialCycleId);

		expect(await notificationTitles(cofounder.as)).toContain(
			"Build a feature is published",
		);
		expect(await notificationTitles(setup.founder.as)).not.toContain(
			"Build a feature is published",
		);
		const { activity } = await setup.founder.as.query(
			api.teams.activity.dashboard,
			{ startupId: setup.startupId },
		);
		expect(
			activity.filter((row) => row.kind === "trial_cycle_published"),
		).toHaveLength(1);
	});
});

describe("spending credits", () => {
	test("publishing spends Pro credits first, then re-runs, then the signup credit, then purchases", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		for (const source of ["purchase", "signup", "rerun"] as const) {
			await giveCredit(t, setup.founder.userId, { source });
		}
		await giveCredit(t, setup.founder.userId, {
			source: "pro_monthly",
			expiresAt: Date.now() + 20 * DAY,
		});

		const spent = [];
		for (let index = 0; index < 4; index += 1) {
			const trialCycleId = await createDraftTrial(setup);
			await publish(setup.founder.as, trialCycleId);
			const trial = await setup.founder.as.query(api.hiring.trialCycles.get, {
				trialCycleId,
			});
			spent.push(trial?.creditSource);
		}

		expect(spent).toEqual(["pro_monthly", "rerun", "signup", "purchase"]);
	});

	test("within one source, the credit expiring soonest is spent first", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const later = Date.now() + 30 * DAY;
		await giveCredit(t, setup.founder.userId, {
			source: "rerun",
			expiresAt: later,
		});
		await giveCredit(t, setup.founder.userId, {
			source: "rerun",
			expiresAt: Date.now() + 10 * DAY,
		});

		await publish(setup.founder.as, await createDraftTrial(setup));

		const { credits } = await setup.founder.as.query(
			api.billing.credits.balance,
			{},
		);
		expect(credits.map((credit) => credit.expiresAt)).toEqual([later]);
	});

	test("an expired credit is never spent", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		await giveCredit(t, setup.founder.userId, {
			source: "rerun",
			expiresAt: Date.now() - 1,
		});

		await expect(
			publish(setup.founder.as, await createDraftTrial(setup)),
		).rejects.toThrow("no hackathon credits");
	});
});

describe("rescheduling", () => {
	test("a draft whose dates passed must get new dates before it can publish", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup, { startsInMs: DAY });
		await giveCredit(t, setup.founder.userId);
		vi.advanceTimersByTime(2 * DAY);

		await expect(publish(setup.founder.as, trialCycleId)).rejects.toThrow(
			"Pick new dates",
		);
		expect(await balanceOf(setup.founder.as)).toBe(1);

		const startsAt = Date.now() + DAY;
		await setup.founder.as.mutation(api.hiring.trialCycles.reschedule, {
			trialCycleId,
			startsAt,
			endsAt: startsAt + 7 * DAY,
		});
		await publish(setup.founder.as, trialCycleId);
		expect(await balanceOf(setup.founder.as)).toBe(0);
	});

	test("only a draft can be rescheduled", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup);
		const startsAt = Date.now() + 3 * DAY;

		await expect(
			setup.founder.as.mutation(api.hiring.trialCycles.reschedule, {
				trialCycleId,
				startsAt,
				endsAt: startsAt + 7 * DAY,
			}),
		).rejects.toThrow("Only a draft");
	});
});
