import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { draftHackathon } from "../hackathons/hackathons.setup";
import { toNextWeek } from "../rating/rating.setup";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.setup";
import { createTest } from "../testing/test.setup";
import { isReviewDue, shiftWeek, weekOf } from "./rules";

const lastWeek = () => shiftWeek(weekOf(Date.now()), -1);

function goalRow(setup: Setup, week: string) {
	return setup.t.run(
		async (ctx) =>
			await ctx.db
				.query("cycleGoals")
				.withIndex("by_startup_and_week", (q) =>
					q.eq("startupId", setup.startupId).eq("week", week),
				)
				.first(),
	);
}

function addCard(setup: Setup, title: string) {
	return setup.founder.as.mutation(api.cards.create, {
		startupId: setup.startupId,
		title,
	});
}

function cardExists(setup: Setup, cardId: Id<"cards">) {
	return setup.t.run(async (ctx) => (await ctx.db.get(cardId)) !== null);
}

/** Acme, one week on, with a goal set last week. */
async function weekAfterGoal(): Promise<Setup> {
	const setup = await setUpStartup(createTest());
	await setup.founder.as.mutation(api.cycles.setGoal, {
		startupId: setup.startupId,
		goal: "Ten users",
	});
	await toNextWeek(setup.t);
	return setup;
}

describe("isReviewDue", () => {
	const nothing = {
		cycleNumber: 2,
		isReviewed: false,
		hasGoal: false,
		conversationCount: 0,
		unfinishedCount: 0,
	};

	it("isn't due with nothing to review", () => {
		expect(isReviewDue(nothing)).toBe(false);
	});

	it("is due for a goal, a conversation or an unfinished Card alone", () => {
		expect(isReviewDue({ ...nothing, hasGoal: true })).toBe(true);
		expect(isReviewDue({ ...nothing, conversationCount: 1 })).toBe(true);
		expect(isReviewDue({ ...nothing, unfinishedCount: 1 })).toBe(true);
	});

	it("isn't due in the first Cycle or once reviewed", () => {
		const has = { ...nothing, hasGoal: true };

		expect(isReviewDue({ ...has, cycleNumber: 1 })).toBe(false);
		expect(isReviewDue({ ...has, isReviewed: true })).toBe(false);
	});
});

describe("the Monday review", () => {
	it("shows the Founder last week's goal, Cards and conversations", async () => {
		const setup = await setUpStartup(createTest());
		const args = { startupId: setup.startupId };
		await setup.founder.as.mutation(api.cycles.setGoal, {
			...args,
			goal: "Ten users",
		});
		await setup.founder.as.mutation(api.conversations.add, {
			...args,
			line: "Priya",
		});
		await addCard(setup, "Unfinished");
		await toNextWeek(setup.t);

		const review = await setup.founder.as.query(api.cycles.getReview, args);

		expect(review).toMatchObject({
			week: lastWeek(),
			number: 1,
			goal: "Ten users",
			currentGoal: null,
			unfinished: [{ title: "Unfinished" }],
			conversations: [{ line: "Priya" }],
		});
	});

	it("closes last week: Drop deletes, carried Cards stay, the next goal is set", async () => {
		const setup = await weekAfterGoal();
		const args = { startupId: setup.startupId };
		const dropped = await addCard(setup, "Drop me");
		const carried = await addCard(setup, "Carry me");

		await setup.founder.as.mutation(api.cycles.closeReview, {
			...args,
			week: lastWeek(),
			goalMet: true,
			dropCardIds: [dropped],
			nextGoal: "Twenty users",
		});

		expect(await goalRow(setup, lastWeek())).toMatchObject({
			goal: "Ten users",
			goalMet: true,
			reviewedAt: Date.now(),
		});
		expect(await cardExists(setup, dropped)).toBe(false);
		expect(await cardExists(setup, carried)).toBe(true);
		const current = await setup.founder.as.query(api.cycles.getCurrent, args);
		expect(current.goal).toBe("Twenty users");
	});

	it("Contributors don't get a review and can't close one", async () => {
		const setup = await weekAfterGoal();
		const sam = await addContributor(setup, "Sam");
		const args = { startupId: setup.startupId };

		expect(await sam.as.query(api.cycles.getReview, args)).toBeNull();
		await expect(
			sam.as.mutation(api.cycles.closeReview, {
				...args,
				week: lastWeek(),
				goalMet: true,
				dropCardIds: [],
			}),
		).rejects.toThrow("Only the Founder can do this");
	});

	it("a review is due once", async () => {
		const setup = await weekAfterGoal();
		const args = {
			startupId: setup.startupId,
			week: lastWeek(),
			goalMet: false,
			dropCardIds: [],
		};
		await setup.founder.as.mutation(api.cycles.closeReview, args);

		expect(
			await setup.founder.as.query(api.cycles.getReview, {
				startupId: setup.startupId,
			}),
		).toBeNull();
		await expect(
			setup.founder.as.mutation(api.cycles.closeReview, args),
		).rejects.toThrow("already closed");
	});

	it("a goalless week closes with no goalMet and stays goalless", async () => {
		const setup = await setUpStartup(createTest());
		await addCard(setup, "Open");
		await toNextWeek(setup.t);

		await setup.founder.as.mutation(api.cycles.closeReview, {
			startupId: setup.startupId,
			week: lastWeek(),
			goalMet: true,
			dropCardIds: [],
		});

		const row = await goalRow(setup, lastWeek());
		expect(row?.reviewedAt).toBe(Date.now());
		expect(row?.goal).toBeUndefined();
		expect(row?.goalMet).toBeUndefined();
	});

	it("a week with a goal needs an answer", async () => {
		const setup = await weekAfterGoal();

		await expect(
			setup.founder.as.mutation(api.cycles.closeReview, {
				startupId: setup.startupId,
				week: lastWeek(),
				dropCardIds: [],
			}),
		).rejects.toThrow("Say whether the goal happened");
	});

	it("a review left open past Sunday is refused and changes nothing", async () => {
		const setup = await weekAfterGoal();
		const staleWeek = lastWeek();
		const card = await addCard(setup, "Keep me");
		await toNextWeek(setup.t);

		await expect(
			setup.founder.as.mutation(api.cycles.closeReview, {
				startupId: setup.startupId,
				week: staleWeek,
				goalMet: true,
				dropCardIds: [card],
				nextGoal: "Late",
			}),
		).rejects.toThrow("This review has passed");

		expect(await cardExists(setup, card)).toBe(true);
		expect((await goalRow(setup, staleWeek))?.reviewedAt).toBeUndefined();
		expect((await goalRow(setup, weekOf(Date.now())))?.goal).toBeUndefined();
	});

	it("Drop leaves other Startups', Hackathon, Review and missing Cards alone", async () => {
		const setup = await weekAfterGoal();
		const other = await setUpStartup(setup.t);
		const theirs = await addCard(other, "Theirs");
		const hackathonId = await draftHackathon(setup);
		const hackathonCard = await setup.t.run(
			async (ctx) =>
				await ctx.db.insert("cards", {
					startupId: setup.startupId,
					hackathonId,
					title: "Hackathon",
					notes: "",
					status: "todo",
				}),
		);
		const inReview = await setup.t.run(
			async (ctx) =>
				await ctx.db.insert("cards", {
					startupId: setup.startupId,
					title: "In Review",
					notes: "",
					status: "review",
				}),
		);
		const gone = await addCard(setup, "Gone");
		await setup.founder.as.mutation(api.cards.remove, { cardId: gone });

		await setup.founder.as.mutation(api.cycles.closeReview, {
			startupId: setup.startupId,
			week: lastWeek(),
			goalMet: true,
			dropCardIds: [theirs, hackathonCard, inReview, gone],
		});

		expect(await cardExists(setup, theirs)).toBe(true);
		expect(await cardExists(setup, hackathonCard)).toBe(true);
		expect(await cardExists(setup, inReview)).toBe(true);
		expect((await goalRow(setup, lastWeek()))?.reviewedAt).toBe(Date.now());
	});

	it("a blank next goal keeps the goal already set this week", async () => {
		const setup = await weekAfterGoal();
		const args = { startupId: setup.startupId };
		await setup.founder.as.mutation(api.cycles.setGoal, {
			...args,
			goal: "Set on Monday",
		});

		await setup.founder.as.mutation(api.cycles.closeReview, {
			...args,
			week: lastWeek(),
			goalMet: true,
			dropCardIds: [],
			nextGoal: "   ",
		});

		const current = await setup.founder.as.query(api.cycles.getCurrent, args);
		expect(current.goal).toBe("Set on Monday");
	});

	it("a goalless review row reads as no goal on the Record", async () => {
		const setup = await setUpStartup(createTest());
		await addCard(setup, "Open");
		await toNextWeek(setup.t);
		await setup.founder.as.mutation(api.cycles.closeReview, {
			startupId: setup.startupId,
			week: lastWeek(),
			dropCardIds: [],
		});

		const { cycles } = await setup.founder.as.query(api.activity.list, {
			startupId: setup.startupId,
		});

		expect(cycles.every((cycle) => cycle.goal === null)).toBe(true);
	});
});
