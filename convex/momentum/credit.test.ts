import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	participants,
	startHackathon,
} from "../applications/applications.setup";
import { cardOn, SHIPPED } from "../cards/cards.setup";
import { publishedHackathon } from "../hackathons/hackathons.setup";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.setup";
import { advancePast, createTest } from "../testing/test.setup";
import type { Person } from "../users/users.setup";
import { loadCredits } from "./credit";
import { verifyCards, verifyCardsNow } from "./momentum.setup";

async function creditsOf(setup: Setup, userId: Id<"users">) {
	return await setup.t.run(async (ctx) => await loadCredits(ctx, userId, {}));
}

async function approvalsOf(setup: Setup, ownerId: Id<"users">) {
	return await setup.t.run(
		async (ctx) =>
			await ctx.db
				.query("approvals")
				.withIndex("by_owner_and_week", (q) => q.eq("ownerId", ownerId))
				.collect(),
	);
}

async function activeWeeksOf(setup: Setup, userId: Id<"users">) {
	return await setup.t.run(
		async (ctx) =>
			await ctx.db
				.query("activeWeeks")
				.withIndex("by_user_and_week", (q) => q.eq("userId", userId))
				.collect(),
	);
}

async function setTrust(
	setup: Setup,
	person: Person,
	trust: "low" | "mid" | "high",
) {
	await setup.t.run(async (ctx) => {
		await ctx.db.patch(person.userId, { trust });
	});
}

describe("approval credit", () => {
	it("a self-approved Card earns 0.25 and is marked self", async () => {
		const setup = await setUpStartup(createTest());

		await verifyCards(setup, setup.founder, 1);

		expect(await approvalsOf(setup, setup.founder.userId)).toMatchObject([
			{ approverId: setup.founder.userId, self: true, instant: false },
		]);
		expect(await creditsOf(setup, setup.founder.userId)).toMatchObject([
			{ self: true, credit: 0.25 },
		]);
	});

	it("someone else's approval earns by the approver's Trust", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		await verifyCards(setup, sam, 1);
		await setTrust(setup, setup.founder, "mid");
		await verifyCards(setup, sam, 1);
		await setTrust(setup, setup.founder, "high");
		await verifyCards(setup, sam, 1);

		const credits = await creditsOf(setup, sam.userId);
		expect(credits.map((row) => row.credit).sort()).toEqual([0.25, 0.6, 1]);
		expect(credits.every((row) => !row.self)).toBe(true);
	});

	it("a Card approved under 10 minutes after creation earns nothing", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		await verifyCardsNow(setup, sam, 1);

		expect(await approvalsOf(setup, sam.userId)).toMatchObject([
			{ instant: true },
		]);
		expect(await creditsOf(setup, sam.userId)).toMatchObject([{ credit: 0 }]);
	});

	it("two people who approve each other get nothing from each other", async () => {
		const x = await setUpStartup(createTest());
		const y = await setUpStartup(x.t);
		const a = x.founder;
		const b = y.founder;
		await x.t.run(async (ctx) => {
			await ctx.db.insert("contributors", {
				startupId: x.startupId,
				userId: b.userId,
				discipline: "developer",
			});
			await ctx.db.insert("contributors", {
				startupId: y.startupId,
				userId: a.userId,
				discipline: "developer",
			});
		});

		await verifyCards(x, b, 1);
		expect(await creditsOf(x, b.userId)).toMatchObject([{ credit: 0.25 }]);
		await verifyCards(y, a, 1);

		expect(await creditsOf(x, b.userId)).toMatchObject([{ credit: 0 }]);
		expect(await creditsOf(x, a.userId)).toMatchObject([{ credit: 0 }]);
	});

	it("a Card with no owner records no approval", async () => {
		const setup = await setUpStartup(createTest());
		const cardId = await cardOn(setup, setup.founder, "Nobody's");
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(cardId, {
				ownerId: undefined,
				status: "review",
				shipped: SHIPPED,
				submittedAt: Date.now(),
			});
		});

		await setup.founder.as.mutation(api.cards.verify, { cardId });

		const rows = await setup.t.run(
			async (ctx) => await ctx.db.query("approvals").collect(),
		);
		expect(rows).toEqual([]);
	});

	it("a Hackathon approval carries its Hackathon", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [builder] = await participants(setup, hackathonId, ["Bea"]);
		await startHackathon(setup, hackathonId);
		const [card] = await builder.as.query(api.cards.listParticipantBoard, {
			hackathonId,
			participantId: builder.userId,
		});

		await builder.as.mutation(api.cards.submit, {
			cardId: card._id,
			shipped: SHIPPED,
		});
		await setup.founder.as.mutation(api.cards.verify, { cardId: card._id });

		expect(await creditsOf(setup, builder.userId)).toMatchObject([
			{ hackathonId, startupId: setup.startupId },
		]);
	});
});

describe("active weeks", () => {
	it("submitting your own Card or having one approved marks the week active", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Emails");

		await sam.as.mutation(api.cards.submit, { cardId, shipped: SHIPPED });

		expect(await activeWeeksOf(setup, sam.userId)).toHaveLength(1);
		await setup.founder.as.mutation(api.cards.verify, { cardId });
		expect(await activeWeeksOf(setup, sam.userId)).toHaveLength(1);
	});

	it("creating or moving your own Card, or approving someone else's, doesn't mark the week active", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const mine = await cardOn(setup, setup.founder, "Plan");
		await setup.founder.as.mutation(api.cards.move, {
			cardId: mine,
			to: "in_progress",
		});
		const samCard = await cardOn(setup, sam, "Emails");
		await advancePast(setup.t, 11 * 60_000);
		await sam.as.mutation(api.cards.submit, {
			cardId: samCard,
			shipped: SHIPPED,
		});

		await setup.founder.as.mutation(api.cards.verify, { cardId: samCard });

		expect(await activeWeeksOf(setup, setup.founder.userId)).toEqual([]);
	});
});
