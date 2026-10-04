import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	advancePast,
	createTest,
	DAY,
	HOUR,
	type TestConvex,
} from "../lib/testing.helpers";
import { notificationTitles } from "../people/notifications.helpers";
import { signUp } from "../people/users.helpers";
import {
	joinAsMember,
	type Setup,
	setUpStartup,
} from "../teams/startups.helpers";
import {
	closeWithVerdict,
	createDraftTrial,
	createTrial,
	startedTrialWith,
} from "./trialCycles.helpers";

type DraftOverrides = Partial<{
	roleId: Id<"roles">;
	title: string;
	description: string;
	maxContributors: number;
	prize: string;
	expectedOutcome: string;
	evaluationCriteria: string;
	compensation: string;
	challenges: { title: string; description?: string }[];
}>;

/** A full draft, as the hackathon form submits it. */
function draftOf(setup: Setup, overrides: DraftOverrides = {}) {
	const startsAt = Date.now() + DAY;
	return {
		roleId: setup.roleId,
		title: "Build a feature",
		description: "Ship it",
		maxContributors: 5,
		startsAt,
		endsAt: startsAt + 7 * DAY,
		challenges: [],
		...overrides,
	};
}

async function createDraft(setup: Setup, overrides: DraftOverrides = {}) {
	return await setup.founder.as.mutation(api.hiring.trialCycles.create, {
		startupId: setup.startupId,
		...draftOf(setup, overrides),
	});
}

async function updateDraft(
	setup: Setup,
	trialCycleId: Id<"trialCycles">,
	overrides: DraftOverrides = {},
) {
	await setup.founder.as.mutation(api.hiring.trialCycles.update, {
		trialCycleId,
		...draftOf(setup, overrides),
	});
}

async function trialAsFounder(setup: Setup, trialCycleId: Id<"trialCycles">) {
	return await setup.founder.as.query(api.hiring.trialCycles.get, {
		trialCycleId,
	});
}

async function startingPulseTitles(
	setup: Setup,
	trialCycleId: Id<"trialCycles">,
) {
	const challenges = await setup.founder.as.query(api.hiring.challenges.list, {
		trialCycleId,
	});
	return challenges.map((challenge) => challenge.title);
}

async function trialCountOf(setup: Setup) {
	const trials = await setup.founder.as.query(api.hiring.trialCycles.list, {
		startupId: setup.startupId,
	});
	return trials.length;
}

/** A second Startup "Beta" with its own Founder and open Role. */
async function setUpOtherStartup(t: TestConvex): Promise<Setup> {
	const founder = await signUp(t, "Olga");
	const { startupId } = await founder.as.mutation(api.teams.startups.create, {
		name: "Beta",
	});
	const roleId = await founder.as.mutation(api.hiring.roles.create, {
		startupId,
		title: "Designer",
		type: "full-time",
		skills: [],
		description: "Design things",
		headcount: 1,
	});
	return { t, founder, startupId, roleId };
}

async function reschedule(
	setup: Setup,
	trialCycleId: Id<"trialCycles">,
	schedule: { startsAt: number; endsAt: number; applicationDeadline?: number },
) {
	await setup.founder.as.mutation(api.hiring.trialCycles.reschedule, {
		trialCycleId,
		...schedule,
	});
}

describe("creating a draft", () => {
	test("Starting Pulses are saved with the draft, in order", async () => {
		const setup = await setUpStartup(createTest());

		const trialCycleId = await createDraft(setup, {
			challenges: [
				{ title: "Build the API", description: "REST is fine" },
				{ title: "Write the docs" },
			],
		});

		expect((await trialAsFounder(setup, trialCycleId))?.status).toBe("draft");
		expect(await startingPulseTitles(setup, trialCycleId)).toEqual([
			"Build the API",
			"Write the docs",
		]);
	});

	test("the More details fields are saved", async () => {
		const setup = await setUpStartup(createTest());

		const trialCycleId = await createDraft(setup, {
			expectedOutcome: "A working prototype",
			evaluationCriteria: "Code quality",
			compensation: "₹40k a month",
		});

		const trial = await trialAsFounder(setup, trialCycleId);
		expect(trial?.expectedOutcome).toBe("A working prototype");
		expect(trial?.evaluationCriteria).toBe("Code quality");
		expect(trial?.compensation).toBe("₹40k a month");
	});

	test("a draft with no Starting Pulses can be saved", async () => {
		const setup = await setUpStartup(createTest());

		const trialCycleId = await createDraft(setup, { challenges: [] });

		expect(await startingPulseTitles(setup, trialCycleId)).toEqual([]);
	});

	test("max participants is clamped to the platform cap of 10", async () => {
		const setup = await setUpStartup(createTest());

		const trialCycleId = await createDraft(setup, { maxContributors: 50 });

		expect((await trialAsFounder(setup, trialCycleId))?.maxContributors).toBe(
			10,
		);
	});

	test("a Role from another Startup is refused and nothing is saved", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const other = await setUpOtherStartup(t);

		await expect(createDraft(setup, { roleId: other.roleId })).rejects.toThrow(
			"Role not found",
		);

		expect(await trialCountOf(setup)).toBe(0);
	});

	test("a closed Role is refused and nothing is saved", async () => {
		const setup = await setUpStartup(createTest());
		await setup.founder.as.mutation(api.hiring.roles.close, {
			roleId: setup.roleId,
		});

		await expect(createDraft(setup)).rejects.toThrow("This Role is closed");

		expect(await trialCountOf(setup)).toBe(0);
	});

	test("a Member can't create a draft", async () => {
		const setup = await setUpStartup(createTest());
		const member = await joinAsMember(setup, "Mia");

		await expect(
			member.as.mutation(api.hiring.trialCycles.create, {
				startupId: setup.startupId,
				...draftOf(setup),
			}),
		).rejects.toThrow("Only founders");
	});

	test("21 Starting Pulses are refused", async () => {
		const setup = await setUpStartup(createTest());
		const challenges = Array.from({ length: 21 }, (_, index) => ({
			title: `Pulse ${index + 1}`,
		}));

		await expect(createDraft(setup, { challenges })).rejects.toThrow(
			"at most 20 Starting Pulses",
		);

		expect(await trialCountOf(setup)).toBe(0);
	});

	test("overlong and blank text is refused", async () => {
		const setup = await setUpStartup(createTest());

		await expect(
			createDraft(setup, { description: "x".repeat(4001) }),
		).rejects.toThrow("Description must be under 4000 characters");
		await expect(createDraft(setup, { title: "   " })).rejects.toThrow(
			"Title is required",
		);
		await expect(
			createDraft(setup, { challenges: [{ title: "x".repeat(121) }] }),
		).rejects.toThrow("Starting Pulse title must be under 120 characters");

		expect(await trialCountOf(setup)).toBe(0);
	});
});

describe("editing a draft", () => {
	test("an edit replaces the fields and the Starting Pulses", async () => {
		const setup = await setUpStartup(createTest());
		const trialCycleId = await createDraft(setup, {
			challenges: [{ title: "Build the API" }, { title: "Write the docs" }],
		});

		await updateDraft(setup, trialCycleId, {
			title: "Ship the dashboard",
			challenges: [{ title: "Design the charts" }],
		});

		expect((await trialAsFounder(setup, trialCycleId))?.title).toBe(
			"Ship the dashboard",
		);
		expect(await startingPulseTitles(setup, trialCycleId)).toEqual([
			"Design the charts",
		]);
	});

	test("an optional field left out is cleared", async () => {
		const setup = await setUpStartup(createTest());
		const trialCycleId = await createDraft(setup, { prize: "₹5,000" });

		await updateDraft(setup, trialCycleId);

		expect((await trialAsFounder(setup, trialCycleId))?.prize).toBeUndefined();
	});

	test("open, running, closed and cancelled hackathons can't be edited", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const bob = await signUp(t, "Bob");
		const running = await startedTrialWith(setup, [alice]);
		const closed = await startedTrialWith(setup, [bob]);
		await closeWithVerdict(setup, closed, bob, "passed");
		const open = await createTrial(setup);
		const cancelled = await createDraftTrial(setup);
		await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
			trialCycleId: cancelled,
		});

		for (const trialCycleId of [open, running, closed, cancelled]) {
			await expect(updateDraft(setup, trialCycleId)).rejects.toThrow(
				"Only an unpublished hackathon can be edited",
			);
		}
	});

	test("a Founder of another Startup can't edit the draft", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const other = await setUpOtherStartup(t);
		const trialCycleId = await createDraft(setup);

		await expect(
			other.founder.as.mutation(api.hiring.trialCycles.update, {
				trialCycleId,
				...draftOf(other, { title: "Hijacked" }),
			}),
		).rejects.toThrow("You are not a member of this startup");

		expect((await trialAsFounder(setup, trialCycleId))?.title).toBe(
			"Build a feature",
		);
	});

	test("a Member can't edit the draft", async () => {
		const setup = await setUpStartup(createTest());
		const member = await joinAsMember(setup, "Mia");
		const trialCycleId = await createDraft(setup);

		await expect(
			member.as.mutation(api.hiring.trialCycles.update, {
				trialCycleId,
				...draftOf(setup, { title: "Changed" }),
			}),
		).rejects.toThrow("Only founders");

		expect((await trialAsFounder(setup, trialCycleId))?.title).toBe(
			"Build a feature",
		);
	});
});

describe("schedule rules", () => {
	test("a draft moves to later valid dates", async () => {
		const setup = await setUpStartup(createTest());
		const trialCycleId = await createDraftTrial(setup);
		const startsAt = Date.now() + 3 * DAY;

		await reschedule(setup, trialCycleId, {
			startsAt,
			endsAt: startsAt + DAY,
			applicationDeadline: startsAt - HOUR,
		});

		const trial = await trialAsFounder(setup, trialCycleId);
		expect(trial?.startsAt).toBe(startsAt);
		expect(trial?.endsAt).toBe(startsAt + DAY);
		expect(trial?.applicationDeadline).toBe(startsAt - HOUR);
	});

	test("the end must be after the start", async () => {
		const setup = await setUpStartup(createTest());
		const trialCycleId = await createDraftTrial(setup);
		const startsAt = Date.now() + DAY;

		await expect(
			reschedule(setup, trialCycleId, { startsAt, endsAt: startsAt }),
		).rejects.toThrow("Trial Cycle end must be after start");
	});

	test("the start must be in the future", async () => {
		const setup = await setUpStartup(createTest());
		const trialCycleId = await createDraftTrial(setup);
		const startsAt = Date.now() - HOUR;

		await expect(
			reschedule(setup, trialCycleId, { startsAt, endsAt: startsAt + DAY }),
		).rejects.toThrow("Pick a start time in the future");
	});

	test("the application deadline can't be after the start", async () => {
		const setup = await setUpStartup(createTest());
		const trialCycleId = await createDraftTrial(setup);
		const startsAt = Date.now() + DAY;

		await expect(
			reschedule(setup, trialCycleId, {
				startsAt,
				endsAt: startsAt + DAY,
				applicationDeadline: startsAt + HOUR,
			}),
		).rejects.toThrow("The application deadline must be before the start");
	});

	test("the application deadline must be in the future", async () => {
		const setup = await setUpStartup(createTest());
		const trialCycleId = await createDraftTrial(setup);
		const startsAt = Date.now() + DAY;

		await expect(
			reschedule(setup, trialCycleId, {
				startsAt,
				endsAt: startsAt + DAY,
				applicationDeadline: Date.now() - HOUR,
			}),
		).rejects.toThrow("Pick an application deadline in the future");
	});

	test("creating and editing use the same rules", async () => {
		const setup = await setUpStartup(createTest());
		const trialCycleId = await createDraft(setup);
		const startsAt = Date.now() - HOUR;
		const past = { startsAt, endsAt: startsAt + DAY };

		await expect(
			setup.founder.as.mutation(api.hiring.trialCycles.create, {
				startupId: setup.startupId,
				...draftOf(setup),
				...past,
			}),
		).rejects.toThrow("Pick a start time in the future");
		await expect(
			setup.founder.as.mutation(api.hiring.trialCycles.update, {
				trialCycleId,
				...draftOf(setup),
				...past,
			}),
		).rejects.toThrow("Pick a start time in the future");
	});
});

describe("cancelling", () => {
	test("cancelling an open hackathon notifies its applicants", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createTrial(setup);
		const alice = await signUp(t, "Alice");
		await alice.as.mutation(api.hiring.applications.applyToTrial, {
			acceptTerms: true,
			trialCycleId,
		});

		await setup.founder.as.mutation(api.hiring.trialCycles.cancel, {
			trialCycleId,
		});

		expect((await trialAsFounder(setup, trialCycleId))?.status).toBe(
			"cancelled",
		);
		expect(await notificationTitles(alice.as)).toContain(
			"Build a feature was cancelled",
		);
	});
});

describe("privacy", () => {
	test("a draft is hidden: not listed, not readable, not enterable, not scheduled", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const trialCycleId = await createDraftTrial(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");

		expect(
			await alice.as.query(api.hiring.trialCycles.get, { trialCycleId }),
		).toBeNull();
		expect(
			(await t.query(api.hiring.opportunities.search, {})).trials,
		).toHaveLength(0);
		expect(
			await t.query(api.hiring.trialCycles.listOpenByStartup, {
				startupId: setup.startupId,
			}),
		).toHaveLength(0);
		await expect(
			alice.as.mutation(api.hiring.applications.applyToTrial, {
				acceptTerms: true,
				trialCycleId,
			}),
		).rejects.toThrow("isn't published yet");

		await advancePast(t, 2 * DAY);
		expect((await trialAsFounder(setup, trialCycleId))?.status).toBe("draft");
	});
});
