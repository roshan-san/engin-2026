import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	participants,
	startHackathon,
} from "../applications/applications.setup";
import { SHIPPED } from "../cards/cards.setup";
import { publishedHackathon } from "../hackathons/hackathons.setup";
import { verifyCards } from "../rating/rating.setup";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.setup";
import { createTest } from "../testing/test.setup";
import type { Person } from "./users.setup";

const listedIds = async (setup: Setup, discipline?: "designer" | "developer") =>
	(await setup.t.query(api.users.explore, { discipline })).map(
		(row) => row._id,
	);

async function setProfile(
	setup: Setup,
	person: Person,
	fields: { discipline?: "designer"; rating?: number },
) {
	await setup.t.run((ctx) => ctx.db.patch(person.userId, fields));
}

describe("who Explore People lists", () => {
	it("nobody before any approval", async () => {
		const setup = await setUpStartup(createTest());
		await addContributor(setup, "Sam");

		expect(await listedIds(setup)).toEqual([]);
	});

	it("someone whose Card another person approved, not the approver", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		await verifyCards(setup, sam, 1);

		expect(await listedIds(setup)).toEqual([sam.userId]);
	});

	it("nobody for a self-approved Card", async () => {
		const setup = await setUpStartup(createTest());

		await verifyCards(setup, setup.founder, 1);

		expect(await listedIds(setup)).toEqual([]);
	});

	it("a Builder whose Hackathon Card was approved", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId: Id<"hackathons"> = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		const [card] = await ana.as.query(api.cards.listParticipantBoard, {
			hackathonId,
			participantId: ana.userId,
		});
		await ana.as.mutation(api.cards.submit, {
			cardId: card._id,
			shipped: SHIPPED,
		});

		await setup.founder.as.mutation(api.cards.verify, { cardId: card._id });

		expect(await listedIds(setup)).toEqual([ana.userId]);
	});
});

describe("a listed person's discipline", () => {
	it("comes from their team role when they haven't set one", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		await verifyCards(setup, sam, 1);

		expect(await listedIds(setup, "developer")).toEqual([sam.userId]);
	});

	it("comes from the Hackathon for a Builder", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId: Id<"hackathons"> = await publishedHackathon(setup);
		const [ana] = await participants(setup, hackathonId, ["Ana"]);
		await startHackathon(setup, hackathonId);
		const [card] = await ana.as.query(api.cards.listParticipantBoard, {
			hackathonId,
			participantId: ana.userId,
		});
		await ana.as.mutation(api.cards.submit, {
			cardId: card._id,
			shipped: SHIPPED,
		});

		await setup.founder.as.mutation(api.cards.verify, { cardId: card._id });

		expect(await listedIds(setup, "developer")).toEqual([ana.userId]);
	});

	it("stays the one they chose", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await setProfile(setup, sam, { discipline: "designer" });

		await verifyCards(setup, sam, 1);

		expect(await listedIds(setup, "designer")).toEqual([sam.userId]);
		expect(await listedIds(setup, "developer")).toEqual([]);
	});

	it("stays cleared if they clear it after being listed", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await verifyCards(setup, sam, 1);
		await sam.as.mutation(api.users.updateProfile, { discipline: null });

		await verifyCards(setup, sam, 1);

		expect(await listedIds(setup, "developer")).toEqual([]);
		expect(await listedIds(setup)).toEqual([sam.userId]);
	});
});

describe("the People list", () => {
	it("is best Rating first", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const lee = await addContributor(setup, "Lee");
		await verifyCards(setup, sam, 1);
		await verifyCards(setup, lee, 1);
		await setProfile(setup, sam, { rating: 1100 });
		await setProfile(setup, lee, { rating: 1300 });

		expect(await listedIds(setup)).toEqual([lee.userId, sam.userId]);
	});

	it("filters by discipline, and someone without one shows only unfiltered", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const lee = await addContributor(setup, "Lee");
		await verifyCards(setup, sam, 1);
		await verifyCards(setup, lee, 1);
		await setProfile(setup, sam, { discipline: "designer" });

		expect(await listedIds(setup, "designer")).toEqual([sam.userId]);
		expect(await listedIds(setup)).toHaveLength(2);
	});

	it("shows signed-out visitors only the public profile", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await verifyCards(setup, sam, 1);
		await sam.as.mutation(api.users.updateProfile, {
			bio: "Private to members",
		});

		const [row] = await setup.t.query(api.users.explore, {});

		expect(row).toMatchObject({ _id: sam.userId, isProvisional: true });
		expect(row).not.toHaveProperty("email");
		expect(row).not.toHaveProperty("bio");
	});

	it("leaves out someone with no username, who has no page to link to", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await verifyCards(setup, sam, 1);
		await setup.t.run((ctx) =>
			ctx.db.patch(sam.userId, { username: undefined }),
		);

		expect(await listedIds(setup)).toEqual([]);
	});
});
