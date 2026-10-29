import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { toNextWeek, verifyCards } from "../rating/rating.setup";
import { addContributor, setUpStartup } from "../startups/startups.setup";
import { createTest } from "../testing/test.setup";

describe("the team", () => {
	it("people show their Rating", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		const team = await sam.as.query(api.contributors.list, {
			startupId: setup.startupId,
		});

		expect(team.founder).toMatchObject({ rating: 1000, isProvisional: true });
		expect(team.contributors).toMatchObject([
			{ _id: sam.userId, rating: 1000, ratingChange: 0, isProvisional: true },
		]);
	});

	it("verified this Cycle counts each person's Cards", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await verifyCards(setup, sam, 2);

		const team = await setup.founder.as.query(api.contributors.list, {
			startupId: setup.startupId,
		});

		expect(team.contributors).toMatchObject([{ verifiedThisCycle: 2 }]);
		expect(team.founder).toMatchObject({ verifiedThisCycle: 0 });
	});

	it("a Founder's Self-verified Cards count too", async () => {
		const setup = await setUpStartup(createTest());
		await verifyCards(setup, setup.founder, 1);

		const team = await setup.founder.as.query(api.contributors.list, {
			startupId: setup.startupId,
		});

		expect(team.founder).toMatchObject({ verifiedThisCycle: 1 });
	});

	it("last week's Cards don't count this Cycle", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await verifyCards(setup, sam, 2);

		await toNextWeek(setup.t);

		const team = await setup.founder.as.query(api.contributors.list, {
			startupId: setup.startupId,
		});
		expect(team.contributors).toMatchObject([{ verifiedThisCycle: 0 }]);
	});

	it("a Contributor can see the team", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		await expect(
			sam.as.query(api.contributors.list, {
				startupId: setup.startupId,
			}),
		).resolves.toMatchObject({ founder: { _id: setup.founder.userId } });
	});
});
