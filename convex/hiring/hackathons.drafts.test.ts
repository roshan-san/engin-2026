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
	createDraftHackathon,
	createHackathon,
	startedHackathonWith,
} from "./hackathons.helpers";

type DraftOverrides = Partial<{
	roleId: Id<"roles">;
	title: string;
	description: string;
	maxParticipants: number;
	prize: string;
	expectedOutcome: string;
	evaluationCriteria: string;
	compensation: string;
	starterTasks: { title: string; description?: string }[];
}>;

/** A full draft, as the hackathon form submits it. */
function draftOf(setup: Setup, overrides: DraftOverrides = {}) {
	const startsAt = Date.now() + DAY;
	return {
		roleId: setup.roleId,
		title: "Build a feature",
		description: "Ship it",
		maxParticipants: 5,
		startsAt,
		endsAt: startsAt + 7 * DAY,
		starterTasks: [],
		...overrides,
	};
}

async function createDraft(setup: Setup, overrides: DraftOverrides = {}) {
	return await setup.founder.as.mutation(api.hiring.hackathons.create, {
		startupId: setup.startupId,
		...draftOf(setup, overrides),
	});
}

async function updateDraft(
	setup: Setup,
	hackathonId: Id<"hackathons">,
	overrides: DraftOverrides = {},
) {
	await setup.founder.as.mutation(api.hiring.hackathons.update, {
		hackathonId,
		...draftOf(setup, overrides),
	});
}

async function hackathonAsFounder(setup: Setup, hackathonId: Id<"hackathons">) {
	return await setup.founder.as.query(api.hiring.hackathons.get, {
		hackathonId,
	});
}

/** The hackathon's own Cycle, as its Founder reads it. */
async function cycleOf(setup: Setup, hackathonId: Id<"hackathons">) {
	const hackathon = await hackathonAsFounder(setup, hackathonId);
	if (!hackathon) {
		throw new Error("No hackathon");
	}
	const view = await setup.founder.as.query(api.work.cycles.get, {
		cycleId: hackathon.cycleId,
	});
	return view?.cycle;
}

async function starterTaskTitles(setup: Setup, hackathonId: Id<"hackathons">) {
	const starterTasks = await setup.founder.as.query(
		api.hiring.hackathons.listStarterTasks,
		{
			hackathonId,
		},
	);
	return starterTasks.map((starterTask) => starterTask.title);
}

async function hackathonCountOf(setup: Setup) {
	const hackathons = await setup.founder.as.query(api.hiring.hackathons.list, {
		startupId: setup.startupId,
	});
	return hackathons.length;
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
	hackathonId: Id<"hackathons">,
	schedule: { startsAt: number; endsAt: number; applicationDeadline?: number },
) {
	await setup.founder.as.mutation(api.hiring.hackathons.reschedule, {
		hackathonId,
		...schedule,
	});
}

describe("creating a draft", () => {
	test("Starter Tasks are saved with the draft, in order", async () => {
		const setup = await setUpStartup(createTest());

		const hackathonId = await createDraft(setup, {
			starterTasks: [
				{ title: "Build the API", description: "REST is fine" },
				{ title: "Write the docs" },
			],
		});

		expect((await hackathonAsFounder(setup, hackathonId))?.status).toBe(
			"draft",
		);
		expect(await starterTaskTitles(setup, hackathonId)).toEqual([
			"Build the API",
			"Write the docs",
		]);
	});

	test("the More details fields are saved", async () => {
		const setup = await setUpStartup(createTest());

		const hackathonId = await createDraft(setup, {
			expectedOutcome: "A working prototype",
			evaluationCriteria: "Code quality",
			compensation: "₹40k a month",
		});

		const hackathon = await hackathonAsFounder(setup, hackathonId);
		expect(hackathon?.expectedOutcome).toBe("A working prototype");
		expect(hackathon?.evaluationCriteria).toBe("Code quality");
		expect(hackathon?.compensation).toBe("₹40k a month");
	});

	test("a draft with no Starter Tasks can be saved", async () => {
		const setup = await setUpStartup(createTest());

		const hackathonId = await createDraft(setup, { starterTasks: [] });

		expect(await starterTaskTitles(setup, hackathonId)).toEqual([]);
	});

	test("max participants is clamped to the platform cap of 10", async () => {
		const setup = await setUpStartup(createTest());

		const hackathonId = await createDraft(setup, { maxParticipants: 50 });

		expect(
			(await hackathonAsFounder(setup, hackathonId))?.maxParticipants,
		).toBe(10);
	});

	test("a Role from another Startup is refused and nothing is saved", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const other = await setUpOtherStartup(t);

		await expect(createDraft(setup, { roleId: other.roleId })).rejects.toThrow(
			"Role not found",
		);

		expect(await hackathonCountOf(setup)).toBe(0);
	});

	test("a closed Role is refused and nothing is saved", async () => {
		const setup = await setUpStartup(createTest());
		await setup.founder.as.mutation(api.hiring.roles.close, {
			roleId: setup.roleId,
		});

		await expect(createDraft(setup)).rejects.toThrow("This Role is closed");

		expect(await hackathonCountOf(setup)).toBe(0);
	});

	test("a Member can't create a draft", async () => {
		const setup = await setUpStartup(createTest());
		const member = await joinAsMember(setup, "Mia");

		await expect(
			member.as.mutation(api.hiring.hackathons.create, {
				startupId: setup.startupId,
				...draftOf(setup),
			}),
		).rejects.toThrow("Only founders");
	});

	test("21 Starter Tasks are refused", async () => {
		const setup = await setUpStartup(createTest());
		const starterTasks = Array.from({ length: 21 }, (_, index) => ({
			title: `Task ${index + 1}`,
		}));

		await expect(createDraft(setup, { starterTasks })).rejects.toThrow(
			"at most 20 Starter Tasks",
		);

		expect(await hackathonCountOf(setup)).toBe(0);
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
			createDraft(setup, { starterTasks: [{ title: "x".repeat(121) }] }),
		).rejects.toThrow("Starter Task title must be under 120 characters");

		expect(await hackathonCountOf(setup)).toBe(0);
	});
});

describe("editing a draft", () => {
	test("an edit replaces the fields and the Starter Tasks", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await createDraft(setup, {
			starterTasks: [{ title: "Build the API" }, { title: "Write the docs" }],
		});

		await updateDraft(setup, hackathonId, {
			title: "Ship the dashboard",
			starterTasks: [{ title: "Design the charts" }],
		});

		expect((await hackathonAsFounder(setup, hackathonId))?.title).toBe(
			"Ship the dashboard",
		);
		expect(await starterTaskTitles(setup, hackathonId)).toEqual([
			"Design the charts",
		]);
	});

	test("an optional field left out is cleared", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await createDraft(setup, { prize: "₹5,000" });

		await updateDraft(setup, hackathonId);

		expect(
			(await hackathonAsFounder(setup, hackathonId))?.prize,
		).toBeUndefined();
	});

	test("open, running, closed and cancelled hackathons can't be edited", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const alice = await signUp(t, "Alice");
		const bob = await signUp(t, "Bob");
		const running = await startedHackathonWith(setup, [alice]);
		const closed = await startedHackathonWith(setup, [bob]);
		await closeWithVerdict(setup, closed, bob, "passed");
		const open = await createHackathon(setup);
		const cancelled = await createDraftHackathon(setup);
		await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
			hackathonId: cancelled,
		});

		for (const hackathonId of [open, running, closed, cancelled]) {
			await expect(updateDraft(setup, hackathonId)).rejects.toThrow(
				"Only an unpublished hackathon can be edited",
			);
		}
	});

	test("a Founder of another Startup can't edit the draft", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const other = await setUpOtherStartup(t);
		const hackathonId = await createDraft(setup);

		await expect(
			other.founder.as.mutation(api.hiring.hackathons.update, {
				hackathonId,
				...draftOf(other, { title: "Hijacked" }),
			}),
		).rejects.toThrow("You are not a member of this startup");

		expect((await hackathonAsFounder(setup, hackathonId))?.title).toBe(
			"Build a feature",
		);
	});

	test("a Member can't edit the draft", async () => {
		const setup = await setUpStartup(createTest());
		const member = await joinAsMember(setup, "Mia");
		const hackathonId = await createDraft(setup);

		await expect(
			member.as.mutation(api.hiring.hackathons.update, {
				hackathonId,
				...draftOf(setup, { title: "Changed" }),
			}),
		).rejects.toThrow("Only founders");

		expect((await hackathonAsFounder(setup, hackathonId))?.title).toBe(
			"Build a feature",
		);
	});
});

describe("the hackathon's Cycle", () => {
	test("a new draft gets a Planned Cycle with its title and dates", async () => {
		const setup = await setUpStartup(createTest());
		const draft = draftOf(setup, { title: "API sprint" });

		const hackathonId = await createDraft(setup, { title: "API sprint" });

		expect(await cycleOf(setup, hackathonId)).toMatchObject({
			kind: "hackathon",
			hackathonId,
			title: "API sprint",
			status: "planned",
			startAt: draft.startsAt,
			endAt: draft.endsAt,
		});
	});

	test("editing the draft renames its Cycle and moves its dates", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await createDraft(setup);

		await updateDraft(setup, hackathonId, { title: "Payments sprint" });

		const cycle = await cycleOf(setup, hackathonId);
		const hackathon = await hackathonAsFounder(setup, hackathonId);
		expect(cycle?.title).toBe("Payments sprint");
		expect(cycle?.startAt).toBe(hackathon?.startsAt);
		expect(cycle?.endAt).toBe(hackathon?.endsAt);
	});

	test("rescheduling the draft moves its Cycle's dates", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await createDraftHackathon(setup);
		const startsAt = Date.now() + 8 * DAY;

		await reschedule(setup, hackathonId, {
			startsAt,
			endsAt: startsAt + 6 * DAY,
		});

		expect(await cycleOf(setup, hackathonId)).toMatchObject({
			startAt: startsAt,
			endAt: startsAt + 6 * DAY,
		});
	});

	test("the Cycle stays Planned while open and becomes Active at the start", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const open = await createHackathon(setup);
		expect((await cycleOf(setup, open))?.status).toBe("planned");

		const running = await startedHackathonWith(setup, [
			await signUp(t, "Alice"),
		]);

		expect((await cycleOf(setup, running))?.status).toBe("active");
	});

	test("a start with nobody accepted cancels the hackathon and closes its Cycle", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const hackathonId = await createHackathon(setup, { startsInMs: DAY });

		await advancePast(t, DAY + HOUR);

		expect((await hackathonAsFounder(setup, hackathonId))?.status).toBe(
			"cancelled",
		);
		expect((await cycleOf(setup, hackathonId))?.status).toBe("closed");
	});
});

describe("schedule rules", () => {
	test("a draft moves to later valid dates", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await createDraftHackathon(setup);
		const startsAt = Date.now() + 3 * DAY;

		await reschedule(setup, hackathonId, {
			startsAt,
			endsAt: startsAt + DAY,
			applicationDeadline: startsAt - HOUR,
		});

		const hackathon = await hackathonAsFounder(setup, hackathonId);
		expect(hackathon?.startsAt).toBe(startsAt);
		expect(hackathon?.endsAt).toBe(startsAt + DAY);
		expect(hackathon?.applicationDeadline).toBe(startsAt - HOUR);
	});

	test("the end must be after the start", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await createDraftHackathon(setup);
		const startsAt = Date.now() + DAY;

		await expect(
			reschedule(setup, hackathonId, { startsAt, endsAt: startsAt }),
		).rejects.toThrow("Hackathon end must be after start");
	});

	test("the start must be in the future", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await createDraftHackathon(setup);
		const startsAt = Date.now() - HOUR;

		await expect(
			reschedule(setup, hackathonId, { startsAt, endsAt: startsAt + DAY }),
		).rejects.toThrow("Pick a start time in the future");
	});

	test("the application deadline can't be after the start", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await createDraftHackathon(setup);
		const startsAt = Date.now() + DAY;

		await expect(
			reschedule(setup, hackathonId, {
				startsAt,
				endsAt: startsAt + DAY,
				applicationDeadline: startsAt + HOUR,
			}),
		).rejects.toThrow("The application deadline must be before the start");
	});

	test("the application deadline must be in the future", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await createDraftHackathon(setup);
		const startsAt = Date.now() + DAY;

		await expect(
			reschedule(setup, hackathonId, {
				startsAt,
				endsAt: startsAt + DAY,
				applicationDeadline: Date.now() - HOUR,
			}),
		).rejects.toThrow("Pick an application deadline in the future");
	});

	test("creating and editing use the same rules", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await createDraft(setup);
		const startsAt = Date.now() - HOUR;
		const past = { startsAt, endsAt: startsAt + DAY };

		await expect(
			setup.founder.as.mutation(api.hiring.hackathons.create, {
				startupId: setup.startupId,
				...draftOf(setup),
				...past,
			}),
		).rejects.toThrow("Pick a start time in the future");
		await expect(
			setup.founder.as.mutation(api.hiring.hackathons.update, {
				hackathonId,
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
		const hackathonId = await createHackathon(setup);
		const alice = await signUp(t, "Alice");
		await alice.as.mutation(api.hiring.applications.applyToHackathon, {
			acceptTerms: true,
			hackathonId,
		});

		await setup.founder.as.mutation(api.hiring.hackathons.cancel, {
			hackathonId,
		});

		expect((await hackathonAsFounder(setup, hackathonId))?.status).toBe(
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
		const hackathonId = await createDraftHackathon(setup, { startsInMs: DAY });
		const alice = await signUp(t, "Alice");

		expect(
			await alice.as.query(api.hiring.hackathons.get, { hackathonId }),
		).toBeNull();
		expect(
			(await t.query(api.hiring.opportunities.search, {})).hackathons,
		).toHaveLength(0);
		expect(
			await t.query(api.hiring.hackathons.listOpenByStartup, {
				startupId: setup.startupId,
			}),
		).toHaveLength(0);
		await expect(
			alice.as.mutation(api.hiring.applications.applyToHackathon, {
				acceptTerms: true,
				hackathonId,
			}),
		).rejects.toThrow("isn't published yet");

		await advancePast(t, 2 * DAY);
		expect((await hackathonAsFounder(setup, hackathonId))?.status).toBe(
			"draft",
		);
	});
});
