import { describe, expect, it } from "vitest";
import { decidedHackathon } from "./applications/applications.setup";
import { joinedAtFor } from "./migrations";
import { setUpStartup } from "./startups/startups.setup";
import { createTest } from "./testing/test.setup";

describe("setJoinedAt", () => {
	it("a hire already on the team gets joinedAt from their contributor row; one who isn't stays an Offer", async () => {
		const setup = await setUpStartup(createTest());
		const {
			participants: [ana, ben],
		} = await decidedHackathon(setup, [
			{ name: "Ana", decision: "hired" },
			{ name: "Ben", decision: "hired" },
		]);
		// Before Offers, accepting the hire Invite added a contributor and nothing else.
		const contributorId = await setup.t.run(async (ctx) => {
			for (const person of [ana, ben]) {
				await ctx.db.patch(person.applicationId, { offerTerms: undefined });
			}
			return await ctx.db.insert("contributors", {
				startupId: setup.startupId,
				userId: ana.userId,
				discipline: "developer",
			});
		});

		const result = await setup.t.run(async (ctx) => {
			for (const person of [ana, ben]) {
				const application = await ctx.db.get(person.applicationId);
				if (application) await joinedAtFor(ctx, application);
			}
			const contributor = await ctx.db.get(contributorId);
			return {
				ana: await ctx.db.get(ana.applicationId),
				ben: await ctx.db.get(ben.applicationId),
				joinedAt: contributor?._creationTime,
			};
		});

		expect(result.ana?.joinedAt).toBe(result.joinedAt);
		expect(result.ben?.joinedAt).toBeUndefined();
	});
});
