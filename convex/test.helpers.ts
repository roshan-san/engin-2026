import { convexTest } from "convex-test";
import { vi } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./test.setup";

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

export function createTest() {
	return convexTest(schema, modules);
}

export type TestConvex = ReturnType<typeof createTest>;

export async function signUp(
	t: TestConvex,
	name: string,
	planTier: "free" | "pro" = "free",
) {
	const userId: Id<"users"> = await t.run(
		async (ctx) =>
			await ctx.db.insert("users", {
				name,
				email: `${name.toLowerCase()}@example.com`,
				username: name.toLowerCase(),
				planTier,
				score: 0,
			}),
	);
	return { userId, as: t.withIdentity({ subject: `${userId}|session` }) };
}

export async function setUpStartup(t: TestConvex, headcount = 1) {
	const founder = await signUp(t, "Founder");
	const { startupId } = await founder.as.mutation(api.teams.startups.create, {
		name: "Acme",
	});
	const roleId = await founder.as.mutation(api.hiring.roles.create, {
		startupId,
		title: "Engineer",
		type: "full-time",
		skills: ["typescript"],
		description: "Build things",
		headcount,
	});
	return { founder, startupId, roleId };
}

export async function createTrial(
	setup: Awaited<ReturnType<typeof setUpStartup>>,
	overrides: {
		admission?: "open" | "application";
		maxContributors?: number;
		startsInMs?: number;
		applicationDeadlineInMs?: number;
	} = {},
) {
	const now = Date.now();
	const startsAt = now + (overrides.startsInMs ?? DAY);
	return await setup.founder.as.mutation(api.hiring.trialCycles.create, {
		startupId: setup.startupId,
		roleId: setup.roleId,
		title: "Build a feature",
		description: "Ship it",
		admission: overrides.admission ?? "open",
		maxContributors: overrides.maxContributors ?? 5,
		startsAt,
		endsAt: startsAt + 7 * DAY,
		applicationDeadline:
			overrides.applicationDeadlineInMs === undefined
				? undefined
				: now + overrides.applicationDeadlineInMs,
	});
}

export async function scoreOf(t: TestConvex, userId: Id<"users">) {
	const user = await t.run(async (ctx) => await ctx.db.get(userId));
	const profile = await t.query(api.people.users.getByUsername, {
		username: user?.username ?? "",
	});
	return profile?.evidence.score ?? 0;
}

export async function notificationTitles(
	as: ReturnType<TestConvex["withIdentity"]>,
) {
	const { notifications } = await as.query(api.notifications.list, {});
	return notifications.map((notification) => notification.title);
}

export async function advancePast(t: TestConvex, ms: number) {
	vi.advanceTimersByTime(ms);
	await t.finishInProgressScheduledFunctions();
}

/** A Trial Cycle that has started, with the given people as Participants. */
export async function startedTrialWith(
	t: TestConvex,
	setup: Awaited<ReturnType<typeof setUpStartup>>,
	participants: Awaited<ReturnType<typeof signUp>>[],
) {
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });
	for (const participant of participants) {
		await participant.as.mutation(api.hiring.applications.joinTrial, {
			trialCycleId,
		});
	}
	await advancePast(t, DAY + HOUR);
	return trialCycleId;
}

export async function applicationIdOf(
	t: TestConvex,
	trialCycleId: Id<"trialCycles">,
	userId: Id<"users">,
) {
	const application = await t.run(
		async (ctx) =>
			await ctx.db
				.query("applications")
				.withIndex("by_trial_and_user", (q) =>
					q.eq("trialCycleId", trialCycleId).eq("userId", userId),
				)
				.unique(),
	);
	if (!application) {
		throw new Error("No application");
	}
	return application._id;
}

export async function closeWithVerdict(
	t: TestConvex,
	setup: Awaited<ReturnType<typeof setUpStartup>>,
	trialCycleId: Id<"trialCycles">,
	participant: Awaited<ReturnType<typeof signUp>>,
	verdict: "passed_with_offer" | "passed" | "not_passed",
) {
	await setup.founder.as.mutation(api.hiring.trialCycles.close, {
		trialCycleId,
		verdicts: [
			{
				applicationId: await applicationIdOf(
					t,
					trialCycleId,
					participant.userId,
				),
				verdict,
			},
		],
	});
}

/** Signs someone up and adds them to the setup's Startup as a Member. */
export async function joinAsMember(
	t: TestConvex,
	setup: Awaited<ReturnType<typeof setUpStartup>>,
	name: string,
) {
	const member = await signUp(t, name);
	await t.run(async (ctx) => {
		await ctx.db.insert("memberships", {
			startupId: setup.startupId,
			userId: member.userId,
			role: "member",
		});
	});
	return member;
}

/** An active Cycle in the setup's Startup, with one Pulse assigned to `worker`. */
export async function cyclePulseFor(
	t: TestConvex,
	setup: Awaited<ReturnType<typeof setUpStartup>>,
	worker: Awaited<ReturnType<typeof signUp>>,
) {
	const cycleId = await setup.founder.as.mutation(api.work.cycles.create, {
		startupId: setup.startupId,
		title: "Landing page",
		startAt: Date.now(),
		endAt: Date.now() + 7 * DAY,
		memberUserIds: [worker.userId],
	});
	const pulseId = await worker.as.mutation(api.work.pulses.create, {
		startupId: setup.startupId,
		title: "Hero section",
		cycleId,
	});
	await worker.as.mutation(api.work.pulses.assignToMe, { pulseId });

	async function statusOf() {
		const pulses = await setup.founder.as.query(api.work.pulses.listForCycle, {
			cycleId,
		});
		return pulses.find((pulse) => pulse._id === pulseId)?.status;
	}

	return { cycleId, pulseId, statusOf };
}
