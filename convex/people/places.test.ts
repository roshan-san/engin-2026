import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	applicant,
	builders,
	closeHackathon,
	decidedHackathon,
	endHackathon,
	startHackathon,
} from "../hiring/applications.helpers";
import {
	draftHackathon,
	publishedHackathon,
} from "../hiring/hackathons.helpers";
import { createTest } from "../lib/testing.helpers";
import { addContributor, setUpStartup } from "../startups/startups.helpers";
import { SHIPPED } from "../work/cards.helpers";
import { type Person, signUp } from "./users.helpers";

async function placesOf(person: Person) {
	return await person.as.query(api.people.places.list, {});
}

async function threadOf(
	person: Person,
	where: { startupId: Id<"startups"> } | { hackathonId: Id<"hackathons"> },
	kind: "team" | "everyone" | "private",
) {
	const threads = await person.as.query(api.chat.threads.list, where);
	const thread = threads.find((candidate) => candidate.kind === kind);
	if (!thread) {
		throw new Error(`No ${kind} thread`);
	}
	return thread._id;
}

async function say(person: Person, threadId: Id<"threads">) {
	await person.as.mutation(api.chat.messages.send, { threadId, body: "Hello" });
}

/** The Hackathon's Builder Cards as the Builder sees them. */
async function boardOf(hackathonId: Id<"hackathons">, builder: Person) {
	return await builder.as.query(api.work.cards.listBuilderBoard, {
		hackathonId,
		builderId: builder.userId,
	});
}

describe("groups", () => {
	it("your Startups list as Founder and Contributor", async () => {
		const setup = await setUpStartup(createTest());
		const zedFounder = await signUp(setup.t, "Zed");
		const zeta = await zedFounder.as.mutation(api.startups.startups.create, {
			name: "Zeta",
			stage: "building",
			category: "saas",
			city: "pune",
		});
		await setup.t.run(
			async (ctx) =>
				await ctx.db.insert("contributors", {
					startupId: zeta.startupId,
					userId: setup.founder.userId,
				}),
		);

		const places = await placesOf(setup.founder);

		expect(places.startups).toEqual([
			{
				startupId: setup.startupId,
				slug: setup.slug,
				name: "Acme",
				role: "founder",
				waiting: false,
			},
			{
				startupId: zeta.startupId,
				slug: zeta.slug,
				name: "Zeta",
				role: "contributor",
				waiting: false,
			},
		]);
	});

	it("a Hackathon you build in lists under building", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await builders(setup, hackathonId, ["Ana"]);

		const places = await placesOf(ana);

		expect(places.building).toEqual([
			{
				hackathonId,
				job: { role: "frontend", pay: "6_9l", mode: "remote" },
				startupName: "Acme",
				waiting: false,
			},
		]);
		expect(places.applied).toEqual([]);
		expect(places.startups).toEqual([]);
	});

	it("an application lists under applied with its status", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");

		const before = await placesOf(ana);
		await setup.founder.as.mutation(api.hiring.applications.decline, {
			applicationId: ana.applicationId,
		});
		const after = await placesOf(ana);

		expect(before.applied).toEqual([
			{
				hackathonId,
				job: { role: "frontend", pay: "6_9l", mode: "remote" },
				startupName: "Acme",
				status: "applied",
			},
		]);
		expect(after.applied).toMatchObject([{ hackathonId, status: "declined" }]);
		expect(after.building).toEqual([]);
	});

	it("applied drops when the Hackathon is done", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ben] = await builders(setup, hackathonId, ["Ben"]);
		const ana = await applicant(setup, hackathonId, "Ana");
		await startHackathon(setup, hackathonId);
		await endHackathon(setup, hackathonId);

		const before = await placesOf(ana);
		await closeHackathon(setup, hackathonId);
		const after = await placesOf(ana);

		expect(before.applied).toHaveLength(1);
		expect(after.applied).toEqual([]);
		expect((await placesOf(ben)).building).toEqual([]);
	});

	it("building stays after the decision until the promise is answered, then drops", async () => {
		const setup = await setUpStartup(createTest());
		const {
			hackathonId,
			builders: [ana],
		} = await decidedHackathon(setup, [{ name: "Ana", decision: "hired" }]);

		const before = await placesOf(ana);
		await ana.as.mutation(api.hiring.applications.keepPromise, {
			applicationId: ana.applicationId,
			kept: true,
		});
		const after = await placesOf(ana);

		expect(before.building).toMatchObject([{ hackathonId }]);
		expect(after.building).toEqual([]);
	});
});

describe("waiting", () => {
	it("an unread Team message lights the Startup", async () => {
		const setup = await setUpStartup(createTest());
		const cal = await addContributor(setup, "Cal");
		const threadId = await threadOf(
			cal,
			{ startupId: setup.startupId },
			"team",
		);

		await say(cal, threadId);
		const lit = await placesOf(setup.founder);
		await setup.founder.as.mutation(api.chat.threads.markRead, { threadId });
		const read = await placesOf(setup.founder);

		expect(lit.startups[0].waiting).toBe(true);
		expect(read.startups[0].waiting).toBe(false);
	});

	it("your own message doesn't light it", async () => {
		const setup = await setUpStartup(createTest());
		await addContributor(setup, "Cal");
		const threadId = await threadOf(
			setup.founder,
			{ startupId: setup.startupId },
			"team",
		);

		await say(setup.founder, threadId);
		const places = await placesOf(setup.founder);

		expect(places.startups[0].waiting).toBe(false);
	});

	it("a Board Card in Review lights it for the Founder only", async () => {
		const setup = await setUpStartup(createTest());
		const cal = await addContributor(setup, "Cal");
		const card = await cal.as.mutation(api.work.cards.create, {
			startupId: setup.startupId,
			title: "Welcome emails",
		});
		await cal.as.mutation(api.work.cards.submit, {
			cardId: card,
			shipped: SHIPPED,
		});

		const founderLit = await placesOf(setup.founder);
		const contributor = await placesOf(cal);
		await setup.founder.as.mutation(api.work.cards.verify, { cardId: card });
		const founderClear = await placesOf(setup.founder);

		expect(founderLit.startups[0].waiting).toBe(true);
		expect(contributor.startups[0].waiting).toBe(false);
		expect(founderClear.startups[0].waiting).toBe(false);
	});

	it("an Applicant to screen lights it", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const ana = await applicant(setup, hackathonId, "Ana");

		const lit = await placesOf(setup.founder);
		await setup.founder.as.mutation(api.hiring.applications.accept, {
			applicationId: ana.applicationId,
		});
		const screened = await placesOf(setup.founder);

		expect(lit.startups[0].waiting).toBe(true);
		expect(screened.startups[0].waiting).toBe(false);
	});

	it("a Builder's Card in Review lights it", async () => {
		const setup = await setUpStartup(createTest());
		const cal = await addContributor(setup, "Cal");
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await builders(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		const [card] = await boardOf(hackathonId, ana);
		await ana.as.mutation(api.work.cards.submit, {
			cardId: card._id,
			shipped: SHIPPED,
		});

		const lit = await placesOf(setup.founder);
		const contributor = await placesOf(cal);
		await setup.founder.as.mutation(api.work.cards.verify, {
			cardId: card._id,
		});
		const clear = await placesOf(setup.founder);

		expect(lit.startups[0].waiting).toBe(true);
		expect(contributor.startups[0].waiting).toBe(false);
		expect(clear.startups[0].waiting).toBe(false);
	});

	it("an unread Builder thread lights it for the Founder", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await builders(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		const threadId = await threadOf(ana, { hackathonId }, "private");

		await say(ana, threadId);
		const lit = await placesOf(setup.founder);
		await setup.founder.as.mutation(api.chat.threads.markRead, { threadId });
		const read = await placesOf(setup.founder);

		expect(lit.startups[0].waiting).toBe(true);
		expect(read.startups[0].waiting).toBe(false);
	});

	it("the Founder's Startup lights when Everyone has an unread message", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await builders(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		const threadId = await threadOf(ana, { hackathonId }, "everyone");

		await say(ana, threadId);

		expect((await placesOf(setup.founder)).startups[0].waiting).toBe(true);
	});

	it("a draft or done Hackathon never lights the Startup", async () => {
		const setup = await setUpStartup(createTest());
		await draftHackathon(setup);
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await builders(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		await say(ana, await threadOf(ana, { hackathonId }, "everyone"));
		await endHackathon(setup, hackathonId);

		await closeHackathon(setup, hackathonId);

		expect((await placesOf(setup.founder)).startups[0].waiting).toBe(false);
	});

	it("an undecided Builder while deciding lights it", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana, ben] = await builders(setup, hackathonId, ["Ana", "Ben"]);
		await startHackathon(setup, hackathonId);
		const building = await placesOf(setup.founder);
		await endHackathon(setup, hackathonId);

		const lit = await placesOf(setup.founder);
		for (const builder of [ana, ben]) {
			await setup.founder.as.mutation(api.hiring.applications.decide, {
				applicationId: builder.applicationId,
				decision: "not_this_time",
			});
		}
		const decided = await placesOf(setup.founder);

		expect(building.startups[0].waiting).toBe(false);
		expect(lit.startups[0].waiting).toBe(true);
		expect(decided.startups[0].waiting).toBe(false);
	});

	it("an unread Everyone message lights the Builder's Hackathon", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await builders(setup, hackathonId, ["Ana"]);
		const threadId = await threadOf(setup.founder, { hackathonId }, "everyone");

		await say(setup.founder, threadId);
		const lit = await placesOf(ana);
		await ana.as.mutation(api.chat.threads.markRead, { threadId });
		const read = await placesOf(ana);

		expect(lit.building[0].waiting).toBe(true);
		expect(read.building[0].waiting).toBe(false);
	});

	it("a decision waiting on the promise lights the Builder's Hackathon", async () => {
		const setup = await setUpStartup(createTest());
		const {
			builders: [ana],
		} = await decidedHackathon(setup, [{ name: "Ana", decision: "hired" }]);

		const places = await placesOf(ana);

		expect(places.building[0].waiting).toBe(true);
	});

	it("nothing pending leaves every dot off", async () => {
		const setup = await setUpStartup(createTest());
		const cal = await addContributor(setup, "Cal");
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await builders(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);

		const places = [setup.founder, cal, ana].map(placesOf);

		for (const place of await Promise.all(places)) {
			expect(place.startups.map((row) => row.waiting)).not.toContain(true);
			expect(place.building.map((row) => row.waiting)).not.toContain(true);
		}
	});
});

it("places need sign-in", async () => {
	const t = createTest();

	await expect(t.query(api.people.places.list, {})).rejects.toThrow(
		"Not authenticated",
	);
});
