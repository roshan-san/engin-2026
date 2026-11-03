import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import {
	closeHackathon,
	decidedHackathon,
} from "../applications/applications.setup";
import { setUpStartup } from "../startups/startups.setup";
import { createTest } from "../testing/test.setup";
import { publishedHackathon } from "./hackathons.setup";

describe("hiring record", () => {
	it("the hiring record counts promises and hires", async () => {
		const setup = await setUpStartup(createTest());
		const { participants } = await decidedHackathon(setup, [
			{ name: "Ana", decision: "hired", joined: true },
			{ name: "Ben", decision: "not_this_time" },
		]);
		for (const participant of participants) {
			await participant.as.mutation(api.applications.keepPromise, {
				applicationId: participant.applicationId,
				kept: true,
			});
		}

		const page = await setup.t.query(api.startups.getPublic, {
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

	it("an Offer not taken isn't a hire", async () => {
		const setup = await setUpStartup(createTest());
		await decidedHackathon(setup, [{ name: "Ana", decision: "hired" }]);

		const page = await setup.t.query(api.startups.getPublic, {
			slug: setup.slug,
		});

		expect(page?.hiringRecord).toMatchObject({ finished: 1, hires: 0 });
	});

	it("a missed decision shows as undecided", async () => {
		const setup = await setUpStartup(createTest());
		const { hackathonId } = await decidedHackathon(setup, [
			{ name: "Ana", decision: "not_this_time" },
			{ name: "Ben" },
		]);
		await closeHackathon(setup, hackathonId);

		const page = await setup.t.query(api.startups.getPublic, {
			slug: setup.slug,
		});

		expect(page?.hiringRecord).toMatchObject({ finished: 1, undecided: 1 });
	});

	it("a Hackathon nobody joined doesn't count as finished", async () => {
		const setup = await setUpStartup(createTest());
		const hackathonId = await publishedHackathon(setup);
		await closeHackathon(setup, hackathonId);

		const page = await setup.t.query(api.startups.getPublic, {
			slug: setup.slug,
		});

		expect(page?.hiringRecord).toMatchObject({ finished: 0, undecided: 0 });
	});
});
