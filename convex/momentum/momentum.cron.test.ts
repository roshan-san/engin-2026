import { describe, expect, it } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	endHackathon,
	participants,
	startHackathon,
} from "../applications/applications.setup";
import { cardOn } from "../cards/cards.setup";
import { weekOf } from "../cycles/rules";
import { publishedHackathon } from "../hackathons/hackathons.setup";
import { addContributor, setUpStartup } from "../startups/startups.setup";
import {
	advancePast,
	createTest,
	DAY,
	type TestConvex,
} from "../testing/test.setup";
import { signUp } from "../users/users.setup";
import { loadCredits } from "./credit";
import { scoreStartup } from "./model";
import {
	runMomentum,
	toNextWeek,
	verifyCards,
	verifyCardsNow,
} from "./momentum.setup";

async function momentumOf(t: TestConvex, userId: Id<"users">) {
	return (await t.run(async (ctx) => await ctx.db.get(userId)))?.momentum;
}

async function startupRow(t: TestConvex, startupId: Id<"startups">) {
	const startup = await t.run(async (ctx) => await ctx.db.get(startupId));
	if (!startup) {
		throw new Error("Startup not found");
	}
	return startup;
}

describe("momentum", () => {
	it("a Startup that verifies work every week rises", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(setup.founder.userId, { trust: "high" });
		});

		for (let week = 0; week < 4; week++) {
			await verifyCards(setup, sam, 5);
			await toNextWeek(setup.t);
			await runMomentum(setup.t);
		}

		const startup = await startupRow(setup.t, setup.startupId);
		expect(startup.momentum).toBeGreaterThan(1000);
		expect(startup.momentumChange).toBeGreaterThan(0);
		expect(startup.scoredWeeks).toBe(4);
		expect(startup.provisional).toBe(false);
	});

	it("a momentum run writes the last 12 weeks of rhythm", async () => {
		const setup = await setUpStartup(createTest());
		await verifyCards(setup, setup.founder, 2);
		await toNextWeek(setup.t);

		await runMomentum(setup.t);

		const startup = await startupRow(setup.t, setup.startupId);
		expect(startup.rhythm.at(-1)).toBe(2);
		expect(startup.rhythm.length).toBeLessThanOrEqual(12);
	});

	it("the rhythm keeps only the last 12 weeks", async () => {
		const setup = await setUpStartup(createTest());
		await toNextWeek(setup.t);
		for (let week = 0; week < 14; week++) {
			await verifyCards(setup, setup.founder, week === 13 ? 3 : 1);
			await toNextWeek(setup.t);
			await runMomentum(setup.t);
		}

		const startup = await startupRow(setup.t, setup.startupId);

		expect(startup.rhythm).toHaveLength(12);
		expect(startup.rhythm.at(-1)).toBe(3);
	});

	it("a Startup scored no weeks has an empty rhythm", async () => {
		const setup = await setUpStartup(createTest());

		await runMomentum(setup.t);

		expect((await startupRow(setup.t, setup.startupId)).rhythm).toEqual([]);
	});

	it("a team with no credit shows 1000 at Low", async () => {
		const setup = await setUpStartup(createTest());
		await setup.t.run(
			async (ctx) =>
				await ctx.db.patch(setup.startupId, { momentum: 1400, trust: "mid" }),
		);
		await toNextWeek(setup.t);

		await runMomentum(setup.t);

		expect(await startupRow(setup.t, setup.startupId)).toMatchObject({
			momentum: 1000,
			momentumChange: -400,
			trust: "low",
		});
	});

	it("momentum the same week twice changes nothing", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await verifyCards(setup, sam, 3);
		await toNextWeek(setup.t);
		await runMomentum(setup.t);
		const first = await startupRow(setup.t, setup.startupId);

		await setup.t.mutation(internal.momentum.scoreStartups, {
			week: first.scoredThrough,
		});
		await setup.t.finishInProgressScheduledFunctions();

		const second = await startupRow(setup.t, setup.startupId);
		expect(first.scoredThrough).toBeDefined();
		expect(second).toMatchObject({
			momentum: first.momentum,
			momentumChange: first.momentumChange,
			scoredWeeks: first.scoredWeeks,
		});
	});

	it("a Startup created this week waits for its first full week", async () => {
		const setup = await setUpStartup(createTest());

		await runMomentum(setup.t);

		const startup = await startupRow(setup.t, setup.startupId);
		expect(startup.momentum).toBe(1000);
		expect(startup.scoredThrough).toBeDefined();
	});

	it("every Startup is scored across pages", async () => {
		const t = createTest();
		const startupIds: Id<"startups">[] = [];
		for (let i = 0; i < 25; i++) {
			const founder = await signUp(t, `Founder${i}`);
			const { startupId, slug } = await founder.as.mutation(
				api.startups.create,
				{
					name: `Startup ${i}`,
					stage: "building",
					city: "remote",
				},
			);
			await verifyCards({ t, founder, startupId, slug }, founder, 1);
			startupIds.push(startupId);
		}
		await toNextWeek(t);

		await runMomentum(t);

		const rows = await Promise.all(startupIds.map((id) => startupRow(t, id)));
		const weeks = new Set(rows.map((row) => row.scoredThrough));
		expect(weeks.size).toBe(1);
		expect([...weeks][0]).toBeDefined();
		// Each Founder approved their own work: 0.25 holds 1000.
		expect(rows.every((row) => row.momentum === 1000)).toBe(true);
	});

	it("people are scored after Startups", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(setup.founder.userId, { trust: "high" });
		});
		await verifyCards(setup, sam, 3);
		await toNextWeek(setup.t);

		await runMomentum(setup.t);

		const profile = await setup.t.query(api.users.getRecord, {
			username: "sam",
		});
		expect(profile?.momentum).toBeGreaterThan(1000);
	});

	it("a new self-approving Founder holds 1000 from week one", async () => {
		const setup = await setUpStartup(createTest());
		for (let week = 0; week < 3; week++) {
			await verifyCards(setup, setup.founder, 1);
			await toNextWeek(setup.t);
			await runMomentum(setup.t);
			expect(await momentumOf(setup.t, setup.founder.userId)).toBe(1000);
		}
	});

	it("a break doesn't lower Momentum", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(setup.founder.userId, { trust: "high" });
		});
		for (let week = 0; week < 3; week++) {
			await verifyCards(setup, sam, 1);
			await toNextWeek(setup.t);
			await runMomentum(setup.t);
		}
		const before = await momentumOf(setup.t, sam.userId);
		expect(before).toBeGreaterThan(1000);

		for (let week = 0; week < 4; week++) {
			await toNextWeek(setup.t);
			await runMomentum(setup.t);
		}

		expect(await momentumOf(setup.t, sam.userId)).toBe(before);
	});

	it("a planning week doesn't lower Momentum", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(setup.founder.userId, { trust: "high" });
		});
		await verifyCards(setup, sam, 1);
		await toNextWeek(setup.t);
		await runMomentum(setup.t);
		const before = await momentumOf(setup.t, sam.userId);

		const cardId = await cardOn(setup, sam, "Plan next");
		await sam.as.mutation(api.cards.move, { cardId, to: "in_progress" });
		await toNextWeek(setup.t);
		await runMomentum(setup.t);

		expect(await momentumOf(setup.t, sam.userId)).toBe(before);
	});

	it("a rerun of the same week changes nothing", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await verifyCards(setup, sam, 1);
		await toNextWeek(setup.t);
		await runMomentum(setup.t);
		const first = await setup.t.run(
			async (ctx) => await ctx.db.get(sam.userId),
		);

		await setup.t.mutation(internal.momentum.scoreUsers, {
			week: first?.scoredThrough,
		});
		await setup.t.finishInProgressScheduledFunctions();

		const events = await setup.t.run(
			async (ctx) =>
				await ctx.db
					.query("scoreEvents")
					.withIndex("by_user_and_week", (q) => q.eq("userId", sam.userId))
					.collect(),
		);
		expect(events).toHaveLength(1);
		expect(await momentumOf(setup.t, sam.userId)).toBe(first?.momentum);
	});

	it("the profile shows last run's parts, not today's", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await verifyCards(setup, sam, 1);
		await toNextWeek(setup.t);
		await runMomentum(setup.t);
		const before = await sam.as.query(api.users.getRecord, {
			username: "sam",
		});

		await verifyCards(setup, sam, 2);

		const after = await sam.as.query(api.users.getRecord, {
			username: "sam",
		});
		expect(before?.details?.parts).toEqual({
			active: 1,
			shipped: 1,
			outcomes: 0,
		});
		expect(after?.details?.parts).toEqual(before?.details?.parts);
	});

	it("before any scored week, the profile has no parts", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		const profile = await sam.as.query(api.users.getRecord, {
			username: "sam",
		});

		expect(profile?.details?.parts).toBeNull();
	});

	it("scoredWeeks counts only active weeks", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await verifyCards(setup, sam, 2);
		await toNextWeek(setup.t);
		await runMomentum(setup.t);

		await toNextWeek(setup.t);
		await runMomentum(setup.t);

		expect((await startupRow(setup.t, setup.startupId)).scoredWeeks).toBe(1);
	});

	it("a Hackathon nobody joined leaves a Startup provisional", async () => {
		const setup = await setUpStartup(createTest());
		await publishedHackathon(setup);
		await advancePast(setup.t, 8 * DAY);
		await toNextWeek(setup.t);

		await runMomentum(setup.t);

		expect((await startupRow(setup.t, setup.startupId)).provisional).toBe(true);
	});

	it("a Hired Participant's Momentum counts the outcome", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		await setup.founder.as.mutation(api.applications.shortlist, {
			applicationId: ana.applicationId,
			shortlisted: true,
		});
		await setup.founder.as.mutation(api.applications.requestWalkthrough, {
			applicationId: ana.applicationId,
		});
		await setup.founder.as.mutation(api.applications.markWalkthrough, {
			applicationId: ana.applicationId,
		});
		await endHackathon(setup, hackathonId);
		await setup.founder.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "hired",
		});
		await setup.t.run(async (ctx) => {
			await ctx.db.insert("contributors", {
				startupId: setup.startupId,
				userId: ana.userId,
				discipline: "developer",
			});
		});
		await verifyCards(setup, ana, 1);
		await toNextWeek(setup.t);

		await runMomentum(setup.t);

		const profile = await setup.t.query(api.users.getRecord, {
			username: "ana",
		});
		// Credit 0.25 alone holds 1000; the Hire lifts the target to 1240.
		expect(profile).toMatchObject({ momentum: 1060, isProvisional: false });
	});
});

/** Inserts an approval at the startup worth `credit` this week: self for 0.25, else by the approver's Trust. */
async function approvalWorth(
	t: TestConvex,
	startupId: Id<"startups">,
	ownerId: Id<"users">,
	approverId: Id<"users">,
	trust: "low" | "mid" | "high",
	hackathonId?: Id<"hackathons">,
) {
	await t.run(async (ctx) => {
		const cardId = await ctx.db.insert("cards", {
			startupId,
			hackathonId,
			ownerId,
			title: "Done",
			notes: "",
			status: "done",
		});
		await ctx.db.insert("approvals", {
			ownerId,
			approverId,
			startupId,
			hackathonId,
			cardId,
			week: weekOf(Date.now()),
			self: ownerId === approverId,
			instant: false,
			approverTrust: trust,
		});
	});
}

async function scoreStartupNow(t: TestConvex, startupId: Id<"startups">) {
	await t.run(async (ctx) => {
		const startup = await ctx.db.get(startupId);
		if (startup) await scoreStartup(ctx, startup, weekOf(Date.now()));
	});
	return await startupRow(t, startupId);
}

describe("attacks", () => {
	it("self-approval: a solo Founder approving their own work holds 1000 at Low", async () => {
		const setup = await setUpStartup(createTest());

		for (let week = 0; week < 8; week++) {
			await verifyCards(setup, setup.founder, 2);
			await toNextWeek(setup.t);
			await runMomentum(setup.t);
		}

		const founder = await setup.t.run(
			async (ctx) => await ctx.db.get(setup.founder.userId),
		);
		expect(founder).toMatchObject({ momentum: 1000, trust: "low" });
	});

	it("fake approvers: a second account approving you reaches Mid, never High", async () => {
		const fake = await setUpStartup(createTest());
		const me = await addContributor(fake, "Me");

		for (let week = 0; week < 12; week++) {
			await verifyCards(fake, me, 1);
			await toNextWeek(fake.t);
			await runMomentum(fake.t);
		}

		const row = await fake.t.run(async (ctx) => await ctx.db.get(me.userId));
		expect(row?.trust).toBe("mid");
	});

	it("mutual approval: two Founders approving each other earn nothing", async () => {
		const a = await setUpStartup(createTest());
		const bFounder = await signUp(a.t, "Bo");
		const { startupId, slug } = await bFounder.as.mutation(
			api.startups.create,
			{ name: "Bo Co", stage: "building", city: "remote" },
		);
		const b = { t: a.t, founder: bFounder, startupId, slug };
		await a.t.run(async (ctx) => {
			for (const [startup, person] of [
				[a.startupId, bFounder.userId],
				[b.startupId, a.founder.userId],
			] as const) {
				await ctx.db.insert("contributors", {
					startupId: startup,
					userId: person,
					discipline: "developer",
				});
				await ctx.db.patch(person, { trust: "high" });
			}
		});

		for (let week = 0; week < 4; week++) {
			await verifyCards(a, bFounder, 1);
			await verifyCards(b, a.founder, 1);
			await toNextWeek(a.t);
			await runMomentum(a.t);
		}

		for (const person of [a.founder, bFounder]) {
			const credits = await a.t.run(
				async (ctx) => await loadCredits(ctx, person.userId, {}),
			);
			expect(credits.every((row) => row.credit === 0)).toBe(true);
		}
	});

	it("instant approval: Cards approved within 10 minutes earn nothing", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(setup.founder.userId, { trust: "high" });
		});

		for (let week = 0; week < 4; week++) {
			await verifyCardsNow(setup, sam, 1);
			await toNextWeek(setup.t);
			await runMomentum(setup.t);
		}

		const row = await setup.t.run(async (ctx) => await ctx.db.get(sam.userId));
		expect(row?.momentum).toBeLessThan(1000);
		expect(row?.trust ?? "low").toBe("low");
	});

	it("a star joining yesterday adds nothing to the startup", async () => {
		const setup = await setUpStartup(createTest());
		await approvalWorth(
			setup.t,
			setup.startupId,
			setup.founder.userId,
			setup.founder.userId,
			"low",
		);
		const before = await scoreStartupNow(setup.t, setup.startupId);
		const star = await addContributor(setup, "Star");
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(star.userId, { momentum: 1600, trust: "high" });
			await ctx.db.patch(setup.startupId, { scoredThrough: undefined });
		});

		const after = await scoreStartupNow(setup.t, setup.startupId);

		expect(after.momentum).toBe(before.momentum);
		expect(after.trust).toBe(before.trust);
	});
});

describe("startups", () => {
	it("a startup is its team's credit-weighted average", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(setup.founder.userId, { momentum: 1000 });
			await ctx.db.patch(sam.userId, { momentum: 1400, trust: "high" });
		});
		// The Founder: 4 self-approvals, weight 1. Sam: 3 from a High approver, weight 3.
		for (let i = 0; i < 4; i++) {
			await approvalWorth(
				setup.t,
				setup.startupId,
				setup.founder.userId,
				setup.founder.userId,
				"low",
			);
		}
		for (let i = 0; i < 3; i++) {
			await approvalWorth(
				setup.t,
				setup.startupId,
				sam.userId,
				setup.founder.userId,
				"high",
			);
		}

		expect(await scoreStartupNow(setup.t, setup.startupId)).toMatchObject({
			momentum: 1300,
			trust: "mid",
		});
	});

	it("Hackathon Builders aren't team", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const builder = await signUp(setup.t, "Bea");
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(builder.userId, { momentum: 1600, trust: "high" });
		});
		await approvalWorth(
			setup.t,
			setup.startupId,
			builder.userId,
			setup.founder.userId,
			"high",
			hackathonId,
		);

		expect(await scoreStartupNow(setup.t, setup.startupId)).toMatchObject({
			momentum: 1000,
			trust: "low",
		});
	});

	it("a removed Contributor stops counting", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(sam.userId, { momentum: 1400, trust: "high" });
		});
		await approvalWorth(
			setup.t,
			setup.startupId,
			sam.userId,
			setup.founder.userId,
			"high",
		);
		expect((await scoreStartupNow(setup.t, setup.startupId)).momentum).toBe(
			1400,
		);

		await setup.t.run(async (ctx) => {
			const row = await ctx.db
				.query("contributors")
				.withIndex("by_startup_and_user", (q) =>
					q.eq("startupId", setup.startupId).eq("userId", sam.userId),
				)
				.unique();
			if (row) await ctx.db.delete(row._id);
			await ctx.db.patch(setup.startupId, { scoredThrough: undefined });
		});

		expect(await scoreStartupNow(setup.t, setup.startupId)).toMatchObject({
			momentum: 1000,
			trust: "low",
		});
	});

	it("each run records the startup's step", async () => {
		const setup = await setUpStartup(createTest());
		await scoreStartupNow(setup.t, setup.startupId);

		const events = await setup.t.run(
			async (ctx) =>
				await ctx.db
					.query("scoreEvents")
					.withIndex("by_startup_and_week", (q) =>
						q.eq("startupId", setup.startupId),
					)
					.collect(),
		);
		expect(events).toMatchObject([{ momentum: 1000, trust: "low", credit: 0 }]);
	});

	it("Explore rows and the Hackathon post carry Trust", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const hackathonId = await publishedHackathon(setup);
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(sam.userId, { trust: "mid", approvedWork: true });
			await ctx.db.patch(setup.founder.userId, { trust: "high" });
			await ctx.db.patch(setup.startupId, { trust: "high" });
		});

		const people = await setup.t.query(api.users.explore, {});
		const startups = await setup.t.query(api.startups.explore, {});
		const post = await setup.t.query(api.hackathons.getPublic, {
			hackathonId,
		});

		expect(people).toMatchObject([{ username: "sam", trust: "mid" }]);
		expect(startups).toMatchObject([{ slug: setup.slug, trust: "high" }]);
		expect(post).toMatchObject({ founderTrust: "high" });
		const fresh = await signUp(setup.t, "New");
		expect(
			await setup.t.query(api.users.getRecord, { username: "new" }),
		).toMatchObject({ trust: "low", _id: fresh.userId });
	});
});
