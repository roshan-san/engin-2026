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

type HackathonOverrides = {
	maxParticipants?: number;
	startsInMs?: number;
	applicationDeadlineInMs?: number;
	prize?: string;
	/** `null` leaves it out, so publish refuses. */
	expectedOutcome?: string | null;
	starterTasks?: { title: string; description?: string }[];
};

/** A draft Hackathon: created, not paid for, not public. Has one Starter Task unless told otherwise. */
export async function createDraftHackathon(
	setup: Setup,
	overrides: HackathonOverrides = {},
) {
	const now = Date.now();
	const startsAt = now + (overrides.startsInMs ?? DAY);
	return await setup.founder.as.mutation(api.hiring.hackathons.create, {
		startupId: setup.startupId,
		roleId: setup.roleId,
		title: "Build a feature",
		description: "Ship it",
		maxParticipants: overrides.maxParticipants ?? 5,
		startsAt,
		endsAt: startsAt + 7 * DAY,
		applicationDeadline:
			overrides.applicationDeadlineInMs === undefined
				? undefined
				: now + overrides.applicationDeadlineInMs,
		prize: overrides.prize,
		expectedOutcome:
			overrides.expectedOutcome === null
				? undefined
				: (overrides.expectedOutcome ?? "A working feature"),
		starterTasks: overrides.starterTasks ?? [{ title: "Ship the feature" }],
	});
}

/**
 * A published Hackathon (eng review R7): the Founder pays with a credit,
 * so every lifecycle test runs unchanged.
 */
export async function createHackathon(
	setup: Setup,
	overrides: HackathonOverrides = {},
) {
	const hackathonId = await createDraftHackathon(setup, overrides);
	await giveCredit(setup.t, setup.founder.userId);
	await setup.founder.as.mutation(api.hiring.hackathons.publish, {
		hackathonId,
		acceptTerms: true,
	});
	return hackathonId;
}

/** A Hackathon that has started, with the given people as Participants. */
export async function startedHackathonWith(
	setup: Setup,
	participants: Person[],
) {
	const hackathonId = await createHackathon(setup, { startsInMs: DAY });
	for (const participant of participants) {
		await enterHackathon(setup, hackathonId, participant);
	}
	await advancePast(setup.t, DAY + HOUR);
	return hackathonId;
}

/** The only way in: the person applies, then a Founder accepts them. */
export async function enterHackathon(
	setup: Setup,
	hackathonId: Id<"hackathons">,
	person: Person,
) {
	const applicationId = await person.as.mutation(
		api.hiring.applications.applyToHackathon,
		{ hackathonId, acceptTerms: true },
	);
	await setup.founder.as.mutation(api.hiring.applications.decide, {
		applicationId,
		status: "accepted",
	});
	return applicationId;
}

export async function applicationIdOf(
	t: TestConvex,
	hackathonId: Id<"hackathons">,
	userId: Id<"users">,
) {
	const application = await t.run(
		async (ctx) =>
			await ctx.db
				.query("applications")
				.withIndex("by_hackathon_and_user", (q) =>
					q.eq("hackathonId", hackathonId).eq("userId", userId),
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
	hackathonId: Id<"hackathons">,
	participant: Person,
	verdict: "passed_with_offer" | "passed" | "not_passed",
) {
	await setup.founder.as.mutation(api.hiring.hackathons.close, {
		hackathonId,
		verdicts: [
			{
				applicationId: await applicationIdOf(
					setup.t,
					hackathonId,
					participant.userId,
				),
				verdict,
			},
		],
	});
}

/** The Cycle a hackathon owns, where its Starter Tasks and lanes live. */
export async function cycleIdOf(t: TestConvex, hackathonId: Id<"hackathons">) {
	const hackathon = await t.run(async (ctx) => await ctx.db.get(hackathonId));
	if (!hackathon) {
		throw new Error("No hackathon");
	}
	return hackathon.cycleId;
}
