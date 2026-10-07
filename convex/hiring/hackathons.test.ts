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
import {
	goStealth,
	joinAsMember,
	setUpStartup,
} from "../teams/startups.helpers";
import {
	applicationIdOf,
	createDraftHackathon,
	createHackathon,
	cycleIdOf,
	enterHackathon,
	startedHackathonWith,
} from "./hackathons.helpers";

async function evidenceOf(t: TestConvex, username: string) {
	const profile = await t.query(api.people.users.getByUsername, { username });
	return profile?.evidence;
}

async function publish(
	as: Client,
	hackathonId: Id<"hackathons">,
	acceptTerms = true,
) {
	await as.mutation(api.hiring.hackathons.publish, {
		hackathonId,
		acceptTerms,
	});
}

describe("joining and starting", () => {
	test("an accepted applicant becomes a Participant", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup);
		const alice = await signUp(t, "Alice");

		await enterHackathon(setup, hackathonId, alice);

		const hackathon = await alice.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.isParticipant).toBe(true);
		expect(hackathon?.participantCount).toBe(1);
	});

	test("an applicant is not a Participant until accepted", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup);
		const alice = await signUp(t, "Alice");

		await alice.as.mutation(api.hiring.applications.applyToHackathon, {
			acceptTerms: true,
			hackathonId,
		});

		const hackathon = await alice.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.myStatus).toBe("applied");
		expect(hackathon?.isParticipant).toBe(false);
		expect(hackathon?.participantCount).toBe(0);
	});

	test("a Hackathon with Participants becomes active at its start time", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");
		await enterHackathon(setup, hackathonId, alice);

		await advancePast(t, DAY + HOUR);

		const hackathon = await alice.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.status).toBe("active");
	});

	test("a Hackathon nobody joined is cancelled at its start time and the Founder is told", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });

		await advancePast(t, DAY + HOUR);

		const hackathon = await setup.founder.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.status).toBe("cancelled");
		expect(await notificationTitles(setup.founder.as)).toContain(
			"Build a feature was cancelled: nobody joined",
		);
	});

	test("Participants are told when a Hackathon starts", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");
		await enterHackathon(setup, hackathonId, alice);

		await advancePast(t, DAY + HOUR);

		expect(await notificationTitles(alice.as)).toContain(
			"Build a feature has started",
		);
	});

	test("nobody can apply to a Hackathon after its application deadline", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, {
			startsInMs: 2 * DAY,
			applicationDeadlineInMs: DAY,
		});
		const alice = await signUp(t, "Alice");

		vi.advanceTimersByTime(DAY + HOUR);

		await expect(
			alice.as.mutation(api.hiring.applications.applyToHackathon, {
				acceptTerms: true,
				hackathonId,
			}),
		).rejects.toThrow("no longer accepting");
	});

	test("pending applications are rejected when a Hackathon starts", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");
		const bob = await signUp(t, "Bob");
		await alice.as.mutation(api.hiring.applications.applyToHackathon, {
			acceptTerms: true,
			hackathonId,
		});
		await bob.as.mutation(api.hiring.applications.applyToHackathon, {
			acceptTerms: true,
			hackathonId,
		});
		const aliceApplication = await applicationIdOf(
			t,
			hackathonId,
			alice.userId,
		);
		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: aliceApplication,
			status: "accepted",
		});

		await advancePast(t, DAY + HOUR);

		const hackathon = await bob.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.myStatus).toBe("rejected");
	});
});

describe("cancelling", () => {
	test("a Founder can cancel an active Hackathon and Participants are told", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");
		await enterHackathon(setup, hackathonId, alice);
		await advancePast(t, DAY + HOUR);

		await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
			hackathonId,
		});

		const hackathon = await alice.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.status).toBe("cancelled");
		expect(await notificationTitles(alice.as)).toContain(
			"Build a feature was cancelled",
		);
	});

	test("a cancelled Hackathon stays cancelled when its start time passes", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");
		await enterHackathon(setup, hackathonId, alice);
		await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
			hackathonId,
		});

		await advancePast(t, DAY + HOUR);

		const hackathon = await alice.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.status).toBe("cancelled");
	});

	test("work stops when a Hackathon is cancelled", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const hackathonId = await startedHackathonWith(setup, [alice]);
		const taskId = await alice.as.mutation(api.work.tasks.create, {
			startupId: setup.startupId,
			title: "Write the API",
			cycleId: await cycleIdOf(t, hackathonId),
		});

		await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
			hackathonId,
		});

		await expect(
			alice.as.mutation(api.work.tasks.setStatus, {
				taskId,
				status: "in_progress",
			}),
		).rejects.toThrow("This Hackathon is not active");
		expect(await scoreOf(t, alice.userId)).toBe(0);
		expect((await evidenceOf(t, "alice"))?.hackathonsLeft).toBe(0);
	});

	test("a Founder can cancel a draft", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup);

		await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
			hackathonId,
		});

		const hackathon = await setup.founder.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.status).toBe("cancelled");
	});
});

describe("drafts and publishing", () => {
	test("publishing spends one credit, opens the hackathon and schedules its start", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup, {
			startsInMs: DAY,
			prize: "₹5,000 to the winner",
		});
		await giveCredit(t, setup.founder.userId);

		await publish(setup.founder.as, hackathonId);

		expect(await balanceOf(setup.founder.as)).toBe(0);
		const hackathon = await setup.founder.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.status).toBe("open");
		expect(hackathon?.creditSource).toBe("purchase");
		expect(hackathon?.ipAcknowledgedAt).toBeDefined();
		const { hackathons } = await t.query(api.hiring.opportunities.search, {});
		expect(hackathons.map((card) => card.prize)).toEqual([
			"₹5,000 to the winner",
		]);

		const alice = await signUp(t, "Alice");
		await enterHackathon(setup, hackathonId, alice);
		await advancePast(t, DAY + HOUR);
		expect(
			(await alice.as.query(api.hiring.hackathons.get, { hackathonId }))
				?.status,
		).toBe("active");
	});

	test("publishing a second time is rejected and spends nothing", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup);
		await giveCredit(t, setup.founder.userId);
		await giveCredit(t, setup.founder.userId);
		await publish(setup.founder.as, hackathonId);

		await expect(publish(setup.founder.as, hackathonId)).rejects.toThrow(
			"Only a draft",
		);
		expect(await balanceOf(setup.founder.as)).toBe(1);
	});

	test("publishing without a credit fails and leaves the draft", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup);

		await expect(publish(setup.founder.as, hackathonId)).rejects.toThrow(
			"no hackathon credits",
		);
		const hackathon = await setup.founder.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.status).toBe("draft");
	});

	test("only a Founder can publish, and only with their own credits", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup);
		const member = await joinAsMember(setup, "Mia");
		await giveCredit(t, member.userId);

		await expect(publish(member.as, hackathonId)).rejects.toThrow(
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
		await expect(publish(cofounder.as, hackathonId)).rejects.toThrow(
			"no hackathon credits",
		);
		expect(await balanceOf(setup.founder.as)).toBe(1);
	});

	test("a stealth startup can't publish a public hackathon", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup);
		await giveCredit(t, setup.founder.userId);
		await goStealth(setup);

		await expect(publish(setup.founder.as, hackathonId)).rejects.toThrow(
			"Turn off stealth mode",
		);
	});

	test("a draft for a closed Role can't be published", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup);
		await giveCredit(t, setup.founder.userId);
		await t.run(async (ctx) => {
			await ctx.db.patch(setup.roleId, { status: "closed" });
		});

		await expect(publish(setup.founder.as, hackathonId)).rejects.toThrow(
			"This Role is closed",
		);
	});

	test("publishing requires the IP acknowledgment", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup);
		await giveCredit(t, setup.founder.userId);

		await expect(publish(setup.founder.as, hackathonId, false)).rejects.toThrow(
			"IP terms",
		);
		expect(await balanceOf(setup.founder.as)).toBe(1);
	});
});

describe("publish checks", () => {
	test("a draft with no expected outcome can't be published", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup, {
			expectedOutcome: null,
		});
		await giveCredit(t, setup.founder.userId);

		await expect(publish(setup.founder.as, hackathonId)).rejects.toThrow(
			"Add an expected outcome before publishing",
		);

		expect(await balanceOf(setup.founder.as)).toBe(1);
	});

	test("a missing Starter Task is reported before a missing expected outcome", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup, {
			starterTasks: [],
			expectedOutcome: null,
		});
		await giveCredit(t, setup.founder.userId);

		await expect(publish(setup.founder.as, hackathonId)).rejects.toThrow(
			"Add at least one Starter Task before publishing",
		);
	});

	test("publishing makes the expected outcome the Cycle's goal", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup, {
			expectedOutcome: "A working payments API",
		});
		await giveCredit(t, setup.founder.userId);

		await publish(setup.founder.as, hackathonId);

		const view = await setup.founder.as.query(api.work.cycles.get, {
			cycleId: await cycleIdOf(t, hackathonId),
		});
		expect(view?.cycle.goal).toBe("A working payments API");
	});

	test("a draft with no Starter Task can't be published", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup, { starterTasks: [] });
		await giveCredit(t, setup.founder.userId);

		await expect(publish(setup.founder.as, hackathonId)).rejects.toThrow(
			"Add at least one Starter Task before publishing",
		);

		expect(await balanceOf(setup.founder.as)).toBe(1);
	});

	test("stealth is reported before a missing Starter Task, and that before passed dates", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup, {
			startsInMs: DAY,
			starterTasks: [],
		});
		await giveCredit(t, setup.founder.userId);
		await goStealth(setup);
		vi.advanceTimersByTime(2 * DAY);

		await expect(publish(setup.founder.as, hackathonId)).rejects.toThrow(
			"Turn off stealth mode",
		);
		await setup.founder.as.mutation(api.teams.startups.update, {
			startupId: setup.startupId,
			isPublic: true,
		});
		await expect(publish(setup.founder.as, hackathonId)).rejects.toThrow(
			"Starter Task",
		);
		await setup.founder.as.mutation(api.hiring.hackathons.addStarterTask, {
			hackathonId,
			title: "Build the API",
		});
		await expect(publish(setup.founder.as, hackathonId)).rejects.toThrow(
			"Pick new dates",
		);

		const hackathon = await setup.founder.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});
		expect(hackathon?.status).toBe("draft");
		expect(hackathon?.ipAcknowledgedAt).toBeUndefined();
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
		const hackathonId = await createDraftHackathon(setup);
		await giveCredit(t, setup.founder.userId);

		await publish(setup.founder.as, hackathonId);

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
			activity.filter((row) => row.kind === "hackathon_published"),
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
			const hackathonId = await createDraftHackathon(setup);
			await publish(setup.founder.as, hackathonId);
			const hackathon = await setup.founder.as.query(
				api.hiring.hackathons.get,
				{
					hackathonId,
				},
			);
			spent.push(hackathon?.creditSource);
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

		await publish(setup.founder.as, await createDraftHackathon(setup));

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
			publish(setup.founder.as, await createDraftHackathon(setup)),
		).rejects.toThrow("no hackathon credits");
	});
});

describe("rescheduling", () => {
	test("a draft whose dates passed must get new dates before it can publish", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createDraftHackathon(setup, { startsInMs: DAY });
		await giveCredit(t, setup.founder.userId);
		vi.advanceTimersByTime(2 * DAY);

		await expect(publish(setup.founder.as, hackathonId)).rejects.toThrow(
			"Pick new dates",
		);
		expect(await balanceOf(setup.founder.as)).toBe(1);

		const startsAt = Date.now() + DAY;
		await setup.founder.as.mutation(api.hiring.hackathons.reschedule, {
			hackathonId,
			startsAt,
			endsAt: startsAt + 7 * DAY,
		});
		await publish(setup.founder.as, hackathonId);
		expect(await balanceOf(setup.founder.as)).toBe(0);
	});

	test("only a draft can be rescheduled", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup);
		const startsAt = Date.now() + 3 * DAY;

		await expect(
			setup.founder.as.mutation(api.hiring.hackathons.reschedule, {
				hackathonId,
				startsAt,
				endsAt: startsAt + 7 * DAY,
			}),
		).rejects.toThrow("Only a draft");
	});
});
