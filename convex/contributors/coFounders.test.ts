import { describe, expect, it } from "vitest";
import { api, internal } from "../_generated/api";
import {
	endHackathon,
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
import { createTest } from "../testing/test.setup";
import type { Person } from "../users/users.setup";

async function coFounder(setup: Setup, name: string): Promise<Person> {
	const person = await addContributor(setup, name);
	await setup.founder.as.mutation(api.contributors.setCoFounder, {
		startupId: setup.startupId,
		userId: person.userId,
		isFounder: true,
	});
	return person;
}

async function statusOf(setup: Setup, cardId: string) {
	return await setup.t.run(async (ctx) => {
		const card = await ctx.db
			.query("cards")
			.filter((q) => q.eq(q.field("_id"), cardId))
			.unique();
		return card?.status;
	});
}

describe("Co-founders", () => {
	it("the Founder makes a Contributor a Co-founder, and back", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await coFounder(setup, "Sam");

		const team = await sam.as.query(api.contributors.list, {
			startupId: setup.startupId,
		});
		expect(team.contributors).toMatchObject([{ isFounder: true }]);

		await setup.founder.as.mutation(api.contributors.setCoFounder, {
			startupId: setup.startupId,
			userId: sam.userId,
			isFounder: false,
		});
		const after = await sam.as.query(api.contributors.list, {
			startupId: setup.startupId,
		});
		expect(after.contributors).toMatchObject([{ isFounder: false }]);
	});

	it("only the Founder makes Co-founders", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await coFounder(setup, "Sam");
		const lee = await addContributor(setup, "Lee");

		await expect(
			sam.as.mutation(api.contributors.setCoFounder, {
				startupId: setup.startupId,
				userId: lee.userId,
				isFounder: true,
			}),
		).rejects.toThrow("Only the Founder can do this");
		await expect(
			lee.as.mutation(api.contributors.setCoFounder, {
				startupId: setup.startupId,
				userId: lee.userId,
				isFounder: true,
			}),
		).rejects.toThrow("Only the Founder can do this");
	});

	it("a Co-founder approves Cards and removes Contributors, but not the Founder", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await coFounder(setup, "Sam");
		const lee = await addContributor(setup, "Lee");
		const cardId = await cardOn(setup, lee, "Write welcome emails");
		await lee.as.mutation(api.cards.submit, { cardId, shipped: SHIPPED });

		await sam.as.mutation(api.cards.verify, { cardId });
		expect(await statusOf(setup, cardId)).toBe("done");

		await sam.as.mutation(api.contributors.remove, {
			startupId: setup.startupId,
			userId: lee.userId,
		});
		await expect(
			sam.as.mutation(api.contributors.remove, {
				startupId: setup.startupId,
				userId: setup.founder.userId,
			}),
		).rejects.toThrow("The Founder can't be removed");
	});

	it("with a Co-founder, your own Card waits in Review for the other", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await coFounder(setup, "Sam");
		const cardId = await cardOn(setup, setup.founder, "Write welcome emails");

		await setup.founder.as.mutation(api.cards.submit, {
			cardId,
			shipped: SHIPPED,
		});
		expect(await statusOf(setup, cardId)).toBe("review");
		await expect(
			setup.founder.as.mutation(api.cards.verify, { cardId }),
		).rejects.toThrow("Another Founder approves your Card");

		await sam.as.mutation(api.cards.verify, { cardId });
		expect(await statusOf(setup, cardId)).toBe("done");
	});

	it("a Co-founder's own Card waits for the Founder", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await coFounder(setup, "Sam");
		const cardId = await cardOn(setup, sam, "Write welcome emails");

		await sam.as.mutation(api.cards.submit, { cardId, shipped: SHIPPED });
		expect(await statusOf(setup, cardId)).toBe("review");
		await expect(sam.as.mutation(api.cards.verify, { cardId })).rejects.toThrow(
			"Another Founder approves your Card",
		);
	});

	it("a Co-founder decides Builders on the Founder's Hackathon", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await coFounder(setup, "Sam");
		const hackathonId = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		await endHackathon(setup, hackathonId);

		await sam.as.mutation(api.applications.decide, {
			applicationId: ana.applicationId,
			decision: "not_this_time",
			feedback: "Thanks",
		});

		const application = await setup.t.run(
			async (ctx) => await ctx.db.get(ana.applicationId),
		);
		expect(application?.decision).toBe("not_this_time");
	});

	it("both Founders hear about new Applicants", async () => {
		const setup = await setUpStartup(createTest());
		await coFounder(setup, "Sam");
		const hackathonId = await publishedHackathon(setup);
		await participants(setup, hackathonId, ["Ana"]);
		await setup.t.run(async (ctx) => {
			await ctx.db.patch(hackathonId, { status: "open", applicantsEmailed: 0 });
		});

		await setup.t.mutation(internal.email.newApplicantsDigest, {});

		const kinds = await setup.t.run(async (ctx) =>
			(await ctx.db.query("emails").collect())
				.filter((email) => email.kind === "new_applicants")
				.map((email) => email.to)
				.sort(),
		);
		expect(kinds).toEqual(["fay@example.com", "sam@example.com"]);
	});
});
