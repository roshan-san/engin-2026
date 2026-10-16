import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import {
	closeHackathon,
	decidedHackathon,
} from "../testing/applications.setup";
import { setUpStartup } from "../testing/startups.setup";
import { createTest } from "../testing/test.setup";

describe("hiring record", () => {
	it("the hiring record counts promises and hires", async () => {
		const setup = await setUpStartup(createTest());
		const { builders } = await decidedHackathon(setup, [
			{ name: "Ana", decision: "hired" },
			{ name: "Ben", decision: "not_this_time" },
		]);
		for (const builder of builders) {
			await builder.as.mutation(api.hiring.applications.keepPromise, {
				applicationId: builder.applicationId,
				kept: true,
			});
		}

		const page = await setup.t.query(api.startups.startups.getPublic, {
			slug: setup.slug,
		});

		expect(page?.hiringRecord).toEqual({
			finished: 1,
			hires: 1,
			promisesKept: 2,
			promisesAnswered: 2,
			undecided: 0,
		});
	});

	it("a missed decision shows as undecided", async () => {
		const setup = await setUpStartup(createTest());
		const { hackathonId } = await decidedHackathon(setup, [
			{ name: "Ana", decision: "not_this_time" },
			{ name: "Ben" },
		]);
		await closeHackathon(setup, hackathonId);

		const page = await setup.t.query(api.startups.startups.getPublic, {
			slug: setup.slug,
		});

		expect(page?.hiringRecord).toMatchObject({ finished: 1, undecided: 1 });
	});
});
