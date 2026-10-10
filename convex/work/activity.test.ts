import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { advancePast, createTest, DAY } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";
import {
	addContributor,
	type Setup,
	setUpStartup,
} from "../startups/startups.helpers";
import { cardOn, SHIPPED } from "./cards.helpers";

async function verifiedCard(setup: Setup, title: string) {
	const sam = await addContributor(setup, `Sam ${title}`);
	const cardId = await cardOn(setup, sam, title);
	await sam.as.mutation(api.work.cards.submit, {
		cardId,
		shipped: { ...SHIPPED, line: title },
	});
	await setup.founder.as.mutation(api.work.cards.verify, { cardId });
	return sam;
}

describe("activity", () => {
	it("Activity groups verified work by Cycle", async () => {
		const setup = await setUpStartup(createTest());
		await setup.founder.as.mutation(api.work.cycles.setGoal, {
			startupId: setup.startupId,
			goal: "Get 10 paying users",
		});
		const first = await verifiedCard(setup, "Welcome emails");
		await advancePast(setup.t, 7 * DAY);
		await verifiedCard(setup, "Pricing page");

		const weeks = await setup.founder.as.query(api.work.activity.list, {
			startupId: setup.startupId,
		});

		expect(weeks).toHaveLength(2);
		expect(weeks[0]).toMatchObject({
			number: 2,
			goal: null,
			entries: [{ kind: "card_verified", line: "Pricing page" }],
		});
		expect(weeks[1]).toMatchObject({
			number: 1,
			goal: "Get 10 paying users",
			entries: [
				{
					kind: "card_verified",
					line: "Welcome emails",
					selfVerified: false,
					actor: { _id: first.userId, name: "Sam Welcome emails" },
				},
			],
		});
		expect(weeks[0].week > weeks[1].week).toBe(true);
	});

	it("a week lists its newest entry first", async () => {
		const setup = await setUpStartup(createTest());
		await verifiedCard(setup, "Older");
		await advancePast(setup.t, 1000);
		await verifiedCard(setup, "Newer");

		const weeks = await setup.founder.as.query(api.work.activity.list, {
			startupId: setup.startupId,
		});

		expect(weeks).toHaveLength(1);
		expect(weeks[0].entries.map((entry) => entry.line)).toEqual([
			"Newer",
			"Older",
		]);
	});

	it("Activity is team-only", async () => {
		const setup = await setUpStartup(createTest());
		const outsider = await signUp(setup.t, "Olly");

		await expect(
			outsider.as.query(api.work.activity.list, {
				startupId: setup.startupId,
			}),
		).rejects.toThrow("You're not on this startup");
	});
});
