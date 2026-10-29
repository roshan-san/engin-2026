import { describe, expect, it, vi } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { givePro } from "../billing/billing.setup";
import { MAX_LISTED_HACKATHONS } from "../shared/limits";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.setup";
import {
	closeHackathon,
	decidedHackathon,
	endHackathon,
	participants,
	startHackathon,
} from "../testing/applications.setup";
import { advancePast, createTest, DAY, HOUR } from "../testing/test.setup";
import { signUp } from "../users/users.setup";
import {
	draftHackathon,
	hackathonInput,
	nextMonday,
	publishedHackathon,
} from "./hackathons.setup";
import { finishIfDecided } from "./lifecycle";

/** The Founder's space, which must exist. */
async function spaceOf(setup: Setup, hackathonId: Id<"hackathons">) {
	const space = await setup.founder.as.query(api.hackathons.get, {
		hackathonId,
	});
	if (!space) {
		throw new Error("No Hackathon space");
	}
	return space;
}

describe("drafts", () => {
	it("a draft is private until published", async () => {
		const setup = await setUpStartup(createTest());
		await givePro(setup.t, setup.founder);
		const hackathonId = await draftHackathon(setup);

		const before = await setup.t.query(api.hackathons.getPublic, {
			hackathonId,
		});
		await setup.founder.as.mutation(api.hackathons.publish, {
			hackathonId,
		});
		const after = await setup.t.query(api.hackathons.getPublic, {
			hackathonId,
		});

		expect(before).toBeNull();
		expect(after).toMatchObject({
			status: "open",
			myApplication: null,
			startup: { name: "Acme", rating: 1000 },
		});
	});

	it("a Hackathon starts on a coming Monday", async () => {
		const setup = await setUpStartup(createTest());

		const midweek = draftHackathon(setup, { startsAt: nextMonday() + HOUR });
		const past = draftHackathon(setup, { startsAt: nextMonday() - 7 * DAY });

		await expect(midweek).rejects.toThrow("Start on a coming Monday");
		await expect(past).rejects.toThrow("Start on a coming Monday");
	});

	it("a Hackathon has 3–5 Cards", async () => {
		const setup = await setUpStartup(createTest());
		const card = { title: "Fix signup" };

		const two = draftHackathon(setup, { cards: Array(2).fill(card) });
		const six = draftHackathon(setup, { cards: Array(6).fill(card) });

		await expect(two).rejects.toThrow("Add 3–5 Cards");
		await expect(six).rejects.toThrow("Add 3–5 Cards");
	});

	it("a Hackathon runs for 1 or 2 weeks", async () => {
		const setup = await setUpStartup(createTest());

		const three = draftHackathon(setup, { weeks: 3 });

		await expect(three).rejects.toThrow("Run it for 1 or 2 weeks");
	});

	it("only the Founder drafts a Hackathon", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		const draft = sam.as.mutation(api.hackathons.create, {
			startupId: setup.startupId,
			...hackathonInput(),
		});

		await expect(draft).rejects.toThrow("Only the Founder can do this");
	});

	it("a draft keeps its Cards and dates", async () => {
		const setup = await setUpStartup(createTest());

		const hackathonId = await draftHackathon(setup, { weeks: 2 });

		const { hackathon, cards } = await spaceOf(setup, hackathonId);
		expect(hackathon).toMatchObject({
			status: "draft",
			startsAt: nextMonday(),
			endsAt: nextMonday() + 14 * DAY,
			decideBy: nextMonday() + 21 * DAY,
		});
		expect(cards.map((card) => card.title)).toEqual([
			"Fix signup",
			"Add onboarding",
			"Track drop-off",
		]);
		expect(cards.every((card) => card.status === "todo" && !card.ownerId)).toBe(
			true,
		);
	});

	it("editing a draft replaces its Cards", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await draftHackathon(setup);

		await setup.founder.as.mutation(api.hackathons.update, {
			hackathonId,
			...hackathonInput({
				problem: "New problem",
				cards: [{ title: "One" }, { title: "Two" }, { title: "Three" }],
			}),
		});

		const { hackathon, cards } = await spaceOf(setup, hackathonId);
		expect(hackathon.problem).toBe("New problem");
		expect(cards.map((card) => card.title)).toEqual(["One", "Two", "Three"]);
	});

	it("a published Hackathon can't be edited", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);

		const edit = setup.founder.as.mutation(api.hackathons.update, {
			hackathonId,
			...hackathonInput(),
		});

		await expect(edit).rejects.toThrow("Only drafts can be edited");
	});

	it("the Founder space is for the Founder only", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const hackathonId = await draftHackathon(setup);

		const forSam = await sam.as.query(api.hackathons.get, {
			hackathonId,
		});
		const forFounder = await setup.founder.as.query(api.hackathons.get, {
			hackathonId,
		});

		expect(forSam).toBeNull();
		expect(forFounder?.cards).toHaveLength(3);
	});

	it("an id that isn't a Hackathon has no space", async () => {
		const setup = await setUpStartup(createTest());

		const read = await setup.founder.as.query(api.hackathons.get, {
			hackathonId: "not-a-hackathon",
		});

		expect(read).toBeNull();
	});

	it("a missing Hackathon's space is empty", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await draftHackathon(setup);
		await setup.t.run(async (ctx) => await ctx.db.delete(hackathonId));

		const read = await setup.founder.as.query(api.hackathons.get, {
			hackathonId,
		});

		expect(read).toBeNull();
	});
});

describe("public page", () => {
	it("an id that isn't a Hackathon reads as missing", async () => {
		const setup = await setUpStartup(createTest());

		const page = await setup.t.query(api.hackathons.getPublic, {
			hackathonId: "not-a-hackathon",
		});

		expect(page).toBeNull();
	});

	it("the public page carries the hiring record and whether you're on the team", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);

		const signedOut = await setup.t.query(api.hackathons.getPublic, {
			hackathonId,
		});
		const forFounder = await setup.founder.as.query(api.hackathons.getPublic, {
			hackathonId,
		});

		expect(signedOut).toMatchObject({
			isTeam: false,
			hiringRecord: { finished: 0, hires: 0 },
			startup: {
				name: "Acme",
				slug: setup.slug,
				ratingChange: 0,
				isProvisional: true,
			},
		});
		expect(signedOut?.decideBy).toBe((signedOut?.endsAt ?? 0) + 7 * DAY);
		expect(forFounder?.isTeam).toBe(true);
	});

	it("signed in, the page lists the Cards Participants will work, without their notes", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const sam = await signUp(setup.t, "Sam");

		const page = await sam.as.query(api.hackathons.getPublic, {
			hackathonId,
		});

		expect(page?.cards).toEqual([
			"Fix signup",
			"Add onboarding",
			"Track drop-off",
		]);
	});

	it("signed out, the page shows the job and the problem but not the Cards", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);

		const page = await setup.t.query(api.hackathons.getPublic, {
			hackathonId,
		});

		expect(page?.problem).not.toBe("");
		expect(page?.job.role).not.toBeNull();
		expect(page?.cards).toBeNull();
		expect(JSON.stringify(page)).not.toContain("Fix signup");
	});
});

describe("publish", () => {
	it("publishing opens the Everyone thread", async () => {
		const setup = await setUpStartup(createTest());

		const hackathonId = await publishedHackathon(setup);

		const threads = await setup.t.run(
			async (ctx) =>
				await ctx.db
					.query("threads")
					.withIndex("by_hackathon_and_kind", (q) =>
						q.eq("hackathonId", hackathonId),
					)
					.take(10),
		);
		expect(threads).toMatchObject([{ kind: "everyone" }]);
	});

	it("a Hackathon is published once", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);

		const again = setup.founder.as.mutation(api.hackathons.publish, {
			hackathonId,
		});

		await expect(again).rejects.toThrow("Already published");
	});

	it("a draft whose start has passed can't be published", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await draftHackathon(setup);
		await advancePast(setup.t, 8 * DAY);

		const publish = setup.founder.as.mutation(api.hackathons.publish, {
			hackathonId,
		});

		await expect(publish).rejects.toThrow("Start on a coming Monday");
	});

	it("drafts show on the Hiring tab for the Founder only", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const draftId = await draftHackathon(setup);
		const publishedId = await publishedHackathon(setup);

		const forSam = await sam.as.query(api.hackathons.list, {
			startupId: setup.startupId,
		});
		const forFounder = await setup.founder.as.query(api.hackathons.list, {
			startupId: setup.startupId,
		});

		expect(forSam.map((row) => row._id)).toEqual([publishedId]);
		expect(forFounder.map((row) => row._id)).toEqual([publishedId, draftId]);
	});

	it("the Hiring tab lists the Startup's Hackathons for the team", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const stranger = await signUp(setup.t, "Zed");
		const hackathonId = await publishedHackathon(setup);

		const rows = await sam.as.query(api.hackathons.list, {
			startupId: setup.startupId,
		});
		const outsider = stranger.as.query(api.hackathons.list, {
			startupId: setup.startupId,
		});

		expect(rows).toMatchObject([
			{
				_id: hackathonId,
				status: "open",
				applicantCount: 0,
				toReview: 0,
				toDecide: 0,
			},
		]);
		await expect(outsider).rejects.toThrow("You're not on this startup");
	});
});

/** Puts a person on the Hackathon as a Participant. */
async function addParticipant(
	setup: Setup,
	hackathonId: Id<"hackathons">,
	name: string,
) {
	const person = await signUp(setup.t, name);
	await setup.t.run(async (ctx) => {
		await ctx.db.insert("applications", {
			hackathonId,
			userId: person.userId,
			answer: "I can build it",
			status: "participating",
			shortlisted: false,
		});
	});
	return person;
}

describe("publishing needs Pro", () => {
	/** A second Startup founded by the same Founder. */
	async function secondStartup(setup: Setup): Promise<Setup> {
		const { startupId, slug } = await setup.founder.as.mutation(
			api.startups.create,
			{ name: "Beta", stage: "building", category: "saas", city: "pune" },
		);
		return { ...setup, startupId, slug };
	}

	function publish(setup: Setup, hackathonId: Id<"hackathons">) {
		return setup.founder.as.mutation(api.hackathons.publish, {
			hackathonId,
		});
	}

	it("a Founder without Pro can't publish", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await draftHackathon(setup);

		await expect(publish(setup, hackathonId)).rejects.toThrow(
			"Publishing needs Pro. Your draft is saved.",
		);
	});

	it("a plan on hold or cancelled can't publish", async () => {
		for (const status of ["on_hold", "cancelled"] as const) {
			const setup = await setUpStartup(createTest());
			await givePro(setup.t, setup.founder, "yearly", { status });
			const hackathonId = await draftHackathon(setup);

			await expect(publish(setup, hackathonId)).rejects.toThrow(
				"Publishing needs Pro.",
			);
		}
	});

	it("publishing records when it happened", async () => {
		const setup = await setUpStartup(createTest());
		await givePro(setup.t, setup.founder);
		const hackathonId = await draftHackathon(setup);

		await publish(setup, hackathonId);

		const hackathon = await setup.t.run(
			async (ctx) => await ctx.db.get(hackathonId),
		);
		expect(hackathon).toMatchObject({
			status: "open",
			publishedAt: Date.now(),
		});
	});

	it("a Monthly plan publishes one Hackathon across all the Founder's Startups", async () => {
		const setup = await setUpStartup(createTest());
		const beta = await secondStartup(setup);
		await givePro(setup.t, setup.founder, "monthly");
		await draftHackathon(setup);
		await publishedHackathon(setup);
		const betaDraft = await draftHackathon(beta);

		await expect(publish(beta, betaDraft)).rejects.toThrow(
			"You've published the Hackathon on your plan. More on",
		);
	});

	it("a renewal gives the allowance back", async () => {
		const setup = await setUpStartup(createTest());
		const subscriptionId = await givePro(setup.t, setup.founder, "monthly");
		await publishedHackathon(setup);
		await advancePast(setup.t, DAY);
		await setup.t.run(
			async (ctx) =>
				await ctx.db.patch(subscriptionId, { periodStart: Date.now() }),
		);
		const hackathonId = await draftHackathon(setup);

		await publish(setup, hackathonId);

		const hackathon = await setup.t.run(
			async (ctx) => await ctx.db.get(hackathonId),
		);
		expect(hackathon?.status).toBe("open");
	});

	it("a fifth running Hackathon waits until one is done, counted across the Founder's Startups", async () => {
		const setup = await setUpStartup(createTest());
		const beta = await secondStartup(setup);
		await givePro(setup.t, setup.founder);
		const runningIds: Id<"hackathons">[] = [];
		for (const [place, participant] of [
			[setup, "Ben"],
			[setup, "Cal"],
			[beta, "Dee"],
			[beta, "Eve"],
		] as const) {
			const id = await publishedHackathon(place);
			await participants(place, id, [participant]);
			runningIds.push(id);
		}
		const [firstId] = runningIds;
		const fifthId = await draftHackathon(setup, {
			startsAt: nextMonday() + 21 * DAY,
		});
		const fifthWaits = () =>
			expect(publish(setup, fifthId)).rejects.toThrow(
				"4 Hackathons are running. Make your Decisions before you open a fifth.",
			);

		await fifthWaits();
		await startHackathon(setup, firstId);
		await fifthWaits();
		await endHackathon(setup, firstId);
		await fifthWaits();

		const [ben] = await setup.t.run(
			async (ctx) =>
				await ctx.db
					.query("applications")
					.withIndex("by_hackathon_and_status", (q) =>
						q.eq("hackathonId", firstId).eq("status", "participating"),
					)
					.take(1),
		);
		await setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: ben._id,
			decision: "not_this_time",
		});
		await publish(setup, fifthId);

		const fifth = await setup.t.run(async (ctx) => await ctx.db.get(fifthId));
		expect(fifth?.status).toBe("open");
	});

	it("a published Hackathon carries on after its Founder's plan is cancelled", async () => {
		const setup = await setUpStartup(createTest());
		const subscriptionId = await givePro(setup.t, setup.founder);
		const hackathonId = await publishedHackathon(setup);
		await participants(setup, hackathonId, ["Ben"]);
		await setup.t.run(
			async (ctx) =>
				await ctx.db.patch(subscriptionId, { status: "cancelled" }),
		);

		await startHackathon(setup, hackathonId);

		const hackathon = await setup.t.run(
			async (ctx) => await ctx.db.get(hackathonId),
		);
		expect(hackathon?.status).toBe("live");
	});
});

describe("lifecycle", () => {
	it("with no Participants, it ends at the start", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);

		await advancePast(setup.t, nextMonday() - Date.now() + HOUR);

		const { hackathon } = await spaceOf(setup, hackathonId);
		expect(hackathon.status).toBe("done");
		const activity = await setup.t.run(
			async (ctx) => await ctx.db.query("activity").take(10),
		);
		expect(activity).toEqual([]);
	});

	it("at the start, each Participant gets their own copy of the Cards", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await addParticipant(setup, hackathonId, "Ana");
		const ben = await addParticipant(setup, hackathonId, "Ben");

		await advancePast(setup.t, nextMonday() - Date.now() + HOUR);
		await setup.t.finishAllScheduledFunctions(vi.runAllTimers);

		const cards = await setup.t.run(
			async (ctx) => await ctx.db.query("cards").take(50),
		);
		const titlesOf = (userId: typeof ana.userId) =>
			cards.filter((card) => card.ownerId === userId).map((card) => card.title);
		expect(titlesOf(ana.userId)).toEqual([
			"Fix signup",
			"Add onboarding",
			"Track drop-off",
		]);
		expect(titlesOf(ben.userId)).toEqual([
			"Fix signup",
			"Add onboarding",
			"Track drop-off",
		]);
		expect(cards.filter((card) => !card.ownerId)).toHaveLength(3);
	});

	it("at the start, people still waiting are declined", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		await addParticipant(setup, hackathonId, "Ana");
		const waiting = await signUp(setup.t, "Wes");
		await setup.t.run(async (ctx) => {
			await ctx.db.insert("applications", {
				hackathonId,
				userId: waiting.userId,
				answer: "Pick me",
				status: "applied",
				shortlisted: false,
			});
		});

		await advancePast(setup.t, nextMonday() - Date.now() + HOUR);
		await setup.t.finishAllScheduledFunctions(vi.runAllTimers);

		const view = await waiting.as.query(api.hackathons.getPublic, {
			hackathonId,
		});
		expect(view?.myApplication).toMatchObject({
			status: "declined",
			decision: null,
		});
	});

	it("after the end it's time to decide", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		await addParticipant(setup, hackathonId, "Ana");

		await advancePast(setup.t, nextMonday() + 7 * DAY - Date.now() + HOUR);
		await advancePast(setup.t, 0);

		const { hackathon } = await spaceOf(setup, hackathonId);
		expect(hackathon.status).toBe("deciding");
		expect(hackathon.decideBy).toBe(hackathon.endsAt + 7 * DAY);
		const [row] = await setup.founder.as.query(api.hackathons.list, {
			startupId: setup.startupId,
		});
		expect(row).toMatchObject({ status: "deciding", toDecide: 1 });
	});

	it("starting twice does nothing the second time", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await addParticipant(setup, hackathonId, "Ana");
		await advancePast(setup.t, nextMonday() + 7 * DAY - Date.now() + HOUR);
		await advancePast(setup.t, 0);

		await setup.t.mutation(internal.hackathons.goLive, {
			hackathonId,
		});
		await setup.t.mutation(internal.hackathons.copyCardsFor, {
			hackathonId,
			userId: ana.userId,
		});

		const cards = await setup.t.run(
			async (ctx) => await ctx.db.query("cards").take(50),
		);
		expect(cards).toHaveLength(6);
		const { hackathon } = await spaceOf(setup, hackathonId);
		expect(hackathon.status).toBe("deciding");
	});

	it("when every Participant has a decision, the Hackathon is done", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await addParticipant(setup, hackathonId, "Ana");
		await advancePast(setup.t, nextMonday() + 7 * DAY - Date.now() + HOUR);
		await advancePast(setup.t, 0);
		const before = await spaceOf(setup, hackathonId);

		await setup.t.run(async (ctx) => {
			const application = await ctx.db
				.query("applications")
				.withIndex("by_hackathon_and_user", (q) =>
					q.eq("hackathonId", hackathonId).eq("userId", ana.userId),
				)
				.unique();
			if (application) {
				await ctx.db.patch(application._id, { decision: "hired" });
			}
			const hackathon = await ctx.db.get(hackathonId);
			if (hackathon) {
				await finishIfDecided(ctx, hackathon);
			}
		});

		expect(before.hackathon.status).toBe("deciding");
		const { hackathon } = await spaceOf(setup, hackathonId);
		expect(hackathon.status).toBe("done");
		const activity = await setup.t.run(
			async (ctx) => await ctx.db.query("activity").take(10),
		);
		expect(activity).toMatchObject([
			{ kind: "hackathon_finished", hackathonId },
		]);
	});
});

describe("the decision deadline", () => {
	async function finishedKinds(setup: Setup) {
		const rows = await setup.t.run(
			async (ctx) => await ctx.db.query("activity").take(20),
		);
		return rows.filter((row) => row.kind === "hackathon_finished");
	}

	it("decideBy finishes a Hackathon with undecided Participants", async () => {
		const setup = await setUpStartup(createTest());
		const { hackathonId } = await decidedHackathon(setup, [
			{ name: "Ana", decision: "not_this_time" },
			{ name: "Ben" },
		]);

		await closeHackathon(setup, hackathonId);

		const hackathon = await setup.t.run(
			async (ctx) => await ctx.db.get(hackathonId),
		);
		expect(hackathon?.status).toBe("done");
		expect(await finishedKinds(setup)).toHaveLength(1);
	});

	it("a Hackathon decided before decideBy is finished once", async () => {
		const setup = await setUpStartup(createTest());
		const { hackathonId } = await decidedHackathon(setup, [
			{ name: "Ana", decision: "not_this_time" },
		]);

		await closeHackathon(setup, hackathonId);

		const hackathon = await setup.t.run(
			async (ctx) => await ctx.db.get(hackathonId),
		);
		expect(hackathon?.status).toBe("done");
		expect(await finishedKinds(setup)).toHaveLength(1);
	});

	it("a decision after decideBy is refused", async () => {
		const setup = await setUpStartup(createTest());
		const {
			hackathonId,
			participants: [ben],
		} = await decidedHackathon(setup, [{ name: "Ben" }]);
		await closeHackathon(setup, hackathonId);

		const decide = setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: ben.applicationId,
			decision: "not_this_time",
		});

		await expect(decide).rejects.toThrow("This Hackathon has ended");
	});
});

describe("hiring rows", () => {
	it("Hiring rows count hires and promises", async () => {
		const setup = await setUpStartup(createTest());
		const { participants: decided } = await decidedHackathon(setup, [
			{ name: "Ana", decision: "hired" },
			{ name: "Ben", decision: "not_this_time" },
		]);
		for (const participant of decided) {
			await participant.as.mutation(api.hiring.applications.keepPromise, {
				applicationId: participant.applicationId,
				kept: true,
			});
		}

		const [row] = await setup.founder.as.query(api.hackathons.list, {
			startupId: setup.startupId,
		});

		expect(row).toMatchObject({
			status: "done",
			weeks: 1,
			hires: 1,
			promisesKept: 2,
			promisesAnswered: 2,
			undecided: 0,
		});
	});

	it("a closed Hackathon counts its undecided Participants", async () => {
		const setup = await setUpStartup(createTest());
		const { hackathonId } = await decidedHackathon(setup, [{ name: "Ben" }]);
		await closeHackathon(setup, hackathonId);

		const [row] = await setup.founder.as.query(api.hackathons.list, {
			startupId: setup.startupId,
		});

		expect(row).toMatchObject({ status: "done", hires: 0, undecided: 1 });
	});
});

describe("explore", () => {
	/** A second Startup with its own Founder, sharing the same deployment. */
	async function otherStartup(setup: Setup, name: string): Promise<Setup> {
		const founder = await signUp(setup.t, `${name} Founder`);
		const { startupId, slug } = await founder.as.mutation(api.startups.create, {
			name,
			stage: "building",
			category: "saas",
			city: "pune",
		});
		return { t: setup.t, founder, startupId, slug };
	}

	it("an Explore row carries its Startup's logo, null without one", async () => {
		const setup = await setUpStartup(createTest());
		await publishedHackathon(setup);

		const rows = await setup.t.query(api.hackathons.explore, {});

		expect(rows[0].startup.logoUrl).toBeNull();
	});

	it("anyone can explore Hackathons signed out", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);

		const rows = await setup.t.query(api.hackathons.explore, {});

		expect(rows).toMatchObject([
			{
				hackathonId,
				status: "open",
				job: { role: "frontend", pay: "6_9l", mode: "remote" },
				weeks: 1,
				participantsGet: "Ship real work and meet the team",
				startup: {
					name: "Acme",
					slug: "acme",
					rating: 1000,
					ratingChange: 0,
					isProvisional: true,
				},
			},
		]);
	});

	it("open Hackathons come before live ones", async () => {
		const setup = await setUpStartup(createTest());
		const zeta = await otherStartup(setup, "Zeta");
		const liveId = await publishedHackathon(setup);
		await participants(setup, liveId, ["Ben"]);
		const laterId = await publishedHackathon(zeta, {
			startsAt: nextMonday() + 14 * DAY,
		});
		const soonerId = await publishedHackathon(zeta, {
			startsAt: nextMonday() + 7 * DAY,
		});
		await startHackathon(setup, liveId);

		const rows = await setup.t.query(api.hackathons.explore, {});

		expect(rows.map((row) => [row.hackathonId, row.status])).toEqual([
			[soonerId, "open"],
			[laterId, "open"],
			[liveId, "live"],
		]);
	});

	it("Explore shows the soonest-starting open Hackathons first", async () => {
		const setup = await setUpStartup(createTest());
		const zeta = await otherStartup(setup, "Zeta");
		const laterId = await publishedHackathon(zeta, {
			startsAt: nextMonday() + 7 * DAY,
		});
		await setup.t.run(async (ctx) => {
			const later = await ctx.db.get(laterId);
			if (!later) {
				throw new Error("Hackathon not found");
			}
			const { _id, _creationTime, ...fields } = later;
			for (let i = 1; i < MAX_LISTED_HACKATHONS; i++) {
				await ctx.db.insert("hackathons", fields);
			}
		});
		const soonestId = await publishedHackathon(setup);

		const rows = await setup.t.query(api.hackathons.explore, {});

		expect(rows[0].hackathonId).toBe(soonestId);
	});

	it("live Hackathons come latest start first", async () => {
		const setup = await setUpStartup(createTest());
		const zeta = await otherStartup(setup, "Zeta");
		const firstId = await publishedHackathon(setup, { weeks: 2 });
		await participants(setup, firstId, ["Ben"]);
		const secondId = await publishedHackathon(zeta, {
			startsAt: nextMonday() + 7 * DAY,
		});
		await participants(zeta, secondId, ["Cal"]);
		await startHackathon(zeta, secondId);

		const rows = await setup.t.query(api.hackathons.explore, {});

		expect(rows.map((row) => row.hackathonId)).toEqual([secondId, firstId]);
	});

	it("drafts and finished Hackathons are left out", async () => {
		const setup = await setUpStartup(createTest());
		await draftHackathon(setup);
		const { hackathonId: finishedId } = await decidedHackathon(setup, [
			{ name: "Ben", decision: "hired" },
		]);
		await closeHackathon(setup, finishedId);
		const openId = await publishedHackathon(setup);

		const rows = await setup.t.query(api.hackathons.explore, {});

		expect(rows.map((row) => row.hackathonId)).toEqual([openId]);
	});

	it("role, length and paid filter", async () => {
		const setup = await setUpStartup(createTest());
		const designerId = await publishedHackathon(setup, {
			job: { role: "designer", pay: "equity", mode: "remote" },
			participantsGet: undefined,
		});
		const backendId = await publishedHackathon(setup, {
			job: { role: "backend", pay: "6_9l", mode: "remote" },
			weeks: 2,
		});
		const ids = async (args: {
			role?: "designer";
			weeks?: 1 | 2;
			paid?: boolean;
		}) =>
			(await setup.t.query(api.hackathons.explore, args)).map(
				(row) => row.hackathonId,
			);

		expect(await ids({ role: "designer" })).toEqual([designerId]);
		expect(await ids({ weeks: 2 })).toEqual([backendId]);
		expect(await ids({ paid: true })).toEqual([backendId]);
		expect(await ids({ role: "designer", paid: true })).toEqual([]);
		expect(await ids({})).toHaveLength(2);
	});

	it("each row carries the hiring record", async () => {
		const setup = await setUpStartup(createTest());
		const { hackathonId: finishedId } = await decidedHackathon(setup, [
			{ name: "Ben", decision: "hired" },
		]);
		await closeHackathon(setup, finishedId);
		await publishedHackathon(setup);
		await publishedHackathon(setup, { startsAt: nextMonday() + 7 * DAY });

		const rows = await setup.t.query(api.hackathons.explore, {});

		expect(rows).toHaveLength(2);
		for (const row of rows) {
			expect(row.hiringRecord).toMatchObject({ finished: 1, hires: 1 });
		}
	});
});
