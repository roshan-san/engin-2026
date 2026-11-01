import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { verifyCards } from "../rating/rating.setup";
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

	it("the team shows no per-person counts", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await verifyCards(setup, sam, 2);

		const team = await setup.founder.as.query(api.contributors.list, {
			startupId: setup.startupId,
		});

		expect(team.contributors[0]).not.toHaveProperty("verifiedThisCycle");
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
