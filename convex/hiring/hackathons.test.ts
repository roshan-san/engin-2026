import { describe, expect, it, vi } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { DAY, HOUR, advancePast, createTest } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.helpers";
import { closeHackathon, decidedHackathon } from "./applications.helpers";
import {
	draftHackathon,
	hackathonInput,
	nextMonday,
	publishedHackathon,
} from "./hackathons.helpers";
import { finishIfDecided } from "./hackathons.rules";

describe("drafts", () => {
	it("a draft is private until published", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await draftHackathon(setup);

		const before = await setup.t.query(api.hiring.hackathons.getPublic, {
			hackathonId,
		});
		await setup.founder.as.mutation(api.hiring.hackathons.publish, {
			hackathonId,
		});
		const after = await setup.t.query(api.hiring.hackathons.getPublic, {
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

		const draft = sam.as.mutation(api.hiring.hackathons.create, {
			startupId: setup.startupId,
			...hackathonInput(),
		});

		await expect(draft).rejects.toThrow("Only the Founder can do this");
	});

	it("a draft keeps its Cards and dates", async () => {
		const setup = await setUpStartup(createTest());

		const hackathonId = await draftHackathon(setup, { weeks: 2 });

		const { hackathon, cards } = await setup.founder.as.query(
			api.hiring.hackathons.get,
			{ hackathonId },
		);
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

		await setup.founder.as.mutation(api.hiring.hackathons.update, {
			hackathonId,
			...hackathonInput({
				problem: "New problem",
				cards: [{ title: "One" }, { title: "Two" }, { title: "Three" }],
			}),
		});

		const { hackathon, cards } = await setup.founder.as.query(
			api.hiring.hackathons.get,
			{ hackathonId },
		);
		expect(hackathon.problem).toBe("New problem");
		expect(cards.map((card) => card.title)).toEqual(["One", "Two", "Three"]);
	});

	it("a published Hackathon can't be edited", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);

		const edit = setup.founder.as.mutation(api.hiring.hackathons.update, {
			hackathonId,
			...hackathonInput(),
		});

		await expect(edit).rejects.toThrow("Only drafts can be edited");
	});

	it("the Founder space is for the Founder only", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const hackathonId = await draftHackathon(setup);

		const read = sam.as.query(api.hiring.hackathons.get, { hackathonId });

		await expect(read).rejects.toThrow("Only the Founder can do this");
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

		const again = setup.founder.as.mutation(api.hiring.hackathons.publish, {
			hackathonId,
		});

		await expect(again).rejects.toThrow("Already published");
	});

	it("a draft whose start has passed can't be published", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await draftHackathon(setup);
		await advancePast(setup.t, 8 * DAY);

		const publish = setup.founder.as.mutation(api.hiring.hackathons.publish, {
			hackathonId,
		});

		await expect(publish).rejects.toThrow("Start on a coming Monday");
	});

	it("drafts show on the Hiring tab for the Founder only", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const draftId = await draftHackathon(setup);
		const publishedId = await publishedHackathon(setup);

		const forSam = await sam.as.query(api.hiring.hackathons.list, {
			startupId: setup.startupId,
		});
		const forFounder = await setup.founder.as.query(
			api.hiring.hackathons.list,
			{ startupId: setup.startupId },
		);

		expect(forSam.map((row) => row._id)).toEqual([publishedId]);
		expect(forFounder.map((row) => row._id)).toEqual([publishedId, draftId]);
	});

	it("the Hiring tab lists the Startup's Hackathons for the team", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const stranger = await signUp(setup.t, "Zed");
		const hackathonId = await publishedHackathon(setup);

		const rows = await sam.as.query(api.hiring.hackathons.list, {
			startupId: setup.startupId,
		});
		const outsider = stranger.as.query(api.hiring.hackathons.list, {
			startupId: setup.startupId,
		});

		expect(rows).toMatchObject([
			{
				_id: hackathonId,
				status: "open",
				applicantCount: 0,
				builderCount: 0,
				toReview: 0,
				toDecide: 0,
			},
		]);
		await expect(outsider).rejects.toThrow("You're not on this startup");
	});
});

/** Puts a person on the Hackathon as a Builder. */
async function addBuilder(
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
			status: "building",
			shortlisted: false,
		});
		await ctx.db.patch(hackathonId, { builderCount: 1 });
	});
	return person;
}

describe("lifecycle", () => {
	it("with no Builders, it ends at the start", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);

		await advancePast(setup.t, nextMonday() - Date.now() + HOUR);

		const { hackathon } = await setup.founder.as.query(
			api.hiring.hackathons.get,
			{ hackathonId },
		);
		expect(hackathon.status).toBe("done");
		const activity = await setup.t.run(
			async (ctx) => await ctx.db.query("activity").take(10),
		);
		expect(activity).toEqual([]);
	});

	it("at the start, each Builder gets their own copy of the Cards", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await addBuilder(setup, hackathonId, "Ana");
		const ben = await addBuilder(setup, hackathonId, "Ben");

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
		await addBuilder(setup, hackathonId, "Ana");
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

		const view = await waiting.as.query(api.hiring.hackathons.getPublic, {
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
		await addBuilder(setup, hackathonId, "Ana");

		await advancePast(setup.t, nextMonday() + 7 * DAY - Date.now() + HOUR);
		await advancePast(setup.t, 0);

		const { hackathon } = await setup.founder.as.query(
			api.hiring.hackathons.get,
			{ hackathonId },
		);
		expect(hackathon.status).toBe("deciding");
		expect(hackathon.decideBy).toBe(hackathon.endsAt + 7 * DAY);
		const [row] = await setup.founder.as.query(api.hiring.hackathons.list, {
			startupId: setup.startupId,
		});
		expect(row).toMatchObject({ status: "deciding", toDecide: 1 });
	});

	it("starting twice does nothing the second time", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await addBuilder(setup, hackathonId, "Ana");
		await advancePast(setup.t, nextMonday() + 7 * DAY - Date.now() + HOUR);
		await advancePast(setup.t, 0);

		await setup.t.mutation(internal.hiring.hackathons.startBuilding, {
			hackathonId,
		});
		await setup.t.mutation(internal.hiring.hackathons.copyCardsFor, {
			hackathonId,
			userId: ana.userId,
		});

		const cards = await setup.t.run(
			async (ctx) => await ctx.db.query("cards").take(50),
		);
		expect(cards).toHaveLength(6);
		const { hackathon } = await setup.founder.as.query(
			api.hiring.hackathons.get,
			{ hackathonId },
		);
		expect(hackathon.status).toBe("deciding");
	});

	it("when every Builder has a decision, the Hackathon is done", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await addBuilder(setup, hackathonId, "Ana");
		await advancePast(setup.t, nextMonday() + 7 * DAY - Date.now() + HOUR);
		await advancePast(setup.t, 0);
		const before = await setup.founder.as.query(api.hiring.hackathons.get, {
			hackathonId,
		});

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
		const { hackathon } = await setup.founder.as.query(
			api.hiring.hackathons.get,
			{ hackathonId },
		);
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

	it("decideBy finishes a Hackathon with undecided Builders", async () => {
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
			builders: [ben],
		} = await decidedHackathon(setup, [{ name: "Ben" }]);
		await closeHackathon(setup, hackathonId);

		const decide = setup.founder.as.mutation(api.hiring.applications.decide, {
			applicationId: ben.applicationId,
			decision: "not_this_time",
		});

		await expect(decide).rejects.toThrow("This Hackathon has ended");
	});
});
