import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { giveCredit } from "../billing/credits.helpers";
import {
	advancePast,
	DAY,
	HOUR,
	type TestConvex,
} from "../lib/testing.helpers";
import type { Person } from "../people/users.helpers";
import type { Setup } from "../teams/startups.helpers";

type TrialOverrides = {
	admission?: "open" | "application";
	maxContributors?: number;
	startsInMs?: number;
	applicationDeadlineInMs?: number;
	prize?: string;
};

/** A draft Trial Cycle: created, not paid for, not public. */
export async function createDraftTrial(
	setup: Setup,
	overrides: TrialOverrides = {},
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
		prize: overrides.prize,
	});
}

/**
 * A published Trial Cycle (eng review R7): the Founder pays with a credit,
 * so every lifecycle test runs unchanged.
 */
export async function createTrial(
	setup: Setup,
	overrides: TrialOverrides = {},
) {
	const trialCycleId = await createDraftTrial(setup, overrides);
	await giveCredit(setup.t, setup.founder.userId);
	await setup.founder.as.mutation(api.hiring.trialCycles.publish, {
		trialCycleId,
		acceptTerms: true,
	});
	return trialCycleId;
}

/** A Trial Cycle that has started, with the given people as Participants. */
export async function startedTrialWith(setup: Setup, participants: Person[]) {
	const trialCycleId = await createTrial(setup, { startsInMs: DAY });
	for (const participant of participants) {
		await participant.as.mutation(api.hiring.applications.joinTrial, {
			acceptTerms: true,
			trialCycleId,
		});
	}
	await advancePast(setup.t, DAY + HOUR);
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
	setup: Setup,
	trialCycleId: Id<"trialCycles">,
	participant: Person,
	verdict: "passed_with_offer" | "passed" | "not_passed",
) {
	await setup.founder.as.mutation(api.hiring.trialCycles.close, {
		trialCycleId,
		verdicts: [
			{
				applicationId: await applicationIdOf(
					setup.t,
					trialCycleId,
					participant.userId,
				),
				verdict,
			},
		],
	});
}
