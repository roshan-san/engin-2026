import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { verifyCards } from "../rating/rating.setup";
import { addContributor, setUpStartup } from "../startups/startups.setup";
import { createTest } from "../testing/test.setup";
import { signUp } from "../users/users.setup";

describe("a Contributor's label", () => {
	it("is theirs to set, trimmed", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		await sam.as.mutation(api.contributors.setMyLabel, {
			startupId: setup.startupId,
			label: "  Growth lead  ",
		});

		const team = await sam.as.query(api.contributors.list, {
			startupId: setup.startupId,
		});
		expect(team.contributors).toMatchObject([
			{ discipline: "developer", label: "Growth lead" },
		]);
	});

	it.each([
		["blank", "   "],
		["null", null],
	])("clears when %s", async (_name, label) => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await sam.as.mutation(api.contributors.setMyLabel, {
			startupId: setup.startupId,
			label: "Growth lead",
		});

		await sam.as.mutation(api.contributors.setMyLabel, {
			startupId: setup.startupId,
			label,
		});

		const team = await sam.as.query(api.contributors.list, {
			startupId: setup.startupId,
		});
		expect(team.contributors[0].label).toBeNull();
	});

	it("fits any Hackathon title, up to 60 characters", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		const set = (label: string) =>
			sam.as.mutation(api.contributors.setMyLabel, {
				startupId: setup.startupId,
				label,
			});

		await expect(set("x".repeat(61))).rejects.toThrow();
		await expect(set("x".repeat(60))).resolves.toBeNull();
	});

	it("can't be set by someone off the startup, or by the Founder", async () => {
		const setup = await setUpStartup(createTest());
		const lee = await signUp(setup.t, "Lee");

		await expect(
			lee.as.mutation(api.contributors.setMyLabel, {
				startupId: setup.startupId,
				label: "Growth lead",
			}),
		).rejects.toThrow("You're not on this startup");
		await expect(
			setup.founder.as.mutation(api.contributors.setMyLabel, {
				startupId: setup.startupId,
				label: "Growth lead",
			}),
		).rejects.toThrow("You're not on this startup");
	});

	it("gives no extra permissions", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");
		await sam.as.mutation(api.contributors.setMyLabel, {
			startupId: setup.startupId,
			label: "Founder",
		});

		await expect(
			sam.as.mutation(api.invites.create, {
				startupId: setup.startupId,
				email: "lee@example.com",
				discipline: "sales",
			}),
		).rejects.toThrow("Only the Founder can do this");
	});
});

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
