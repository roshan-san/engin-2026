import type { FunctionArgs } from "convex/server";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { publishedHackathon } from "../testing/hackathons.setup";
import { runRating, toNextWeek, verifyCards } from "../testing/rating.setup";
import { addContributor, setUpStartup } from "../testing/startups.setup";
import { createTest } from "../testing/test.setup";
import { signUp } from "../testing/users.setup";

const acme = {
	name: "Acme",
	stage: "building",
	category: "saas",
	city: "bengaluru",
} as const;

describe("startups", () => {
	it("creating a startup makes you its one Founder", async () => {
		const t = createTest();

		const { founder } = await setUpStartup(t);

		const workspace = await founder.as.query(api.startups.startups.getBySlug, {
			slug: "acme",
		});
		expect(workspace?.role).toBe("founder");
		expect(workspace?.startup).toMatchObject({
			rating: 1000,
			ratingChange: 0,
			founderId: founder.userId,
		});
	});

	it("slugs stay unique", async () => {
		const t = createTest();
		const fay = await signUp(t, "Fay");
		const sam = await signUp(t, "Sam");

		const first = await fay.as.mutation(api.startups.startups.create, acme);
		const second = await sam.as.mutation(api.startups.startups.create, acme);

		expect(first.slug).toBe("acme");
		expect(second.slug).toBe("acme-2");
	});

	it("a new startup gets its Team thread", async () => {
		const t = createTest();

		const { startupId } = await setUpStartup(t);

		const teamThreads = await t.run(
			async (ctx) =>
				await ctx.db
					.query("threads")
					.withIndex("by_startup_and_kind", (q) =>
						q.eq("startupId", startupId).eq("kind", "team"),
					)
					.take(5),
		);
		expect(teamThreads).toHaveLength(1);
	});

	it("outsiders can't open the workspace but can see the public page", async () => {
		const t = createTest();
		await setUpStartup(t);
		const outsider = await signUp(t, "Olu");

		const workspace = await outsider.as.query(api.startups.startups.getBySlug, {
			slug: "acme",
		});
		const page = await outsider.as.query(api.startups.startups.getPublic, {
			slug: "acme",
		});

		expect(workspace).toBeNull();
		expect(page).toMatchObject({ name: "Acme", rating: 1000 });
		expect(page).not.toHaveProperty("founderId");
	});

	it("only the Founder edits the startup", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const ben = await addContributor(setup, "Ben");

		await expect(
			ben.as.mutation(api.startups.startups.update, {
				startupId: setup.startupId,
				name: "Acme 2",
			}),
		).rejects.toThrow("Only the Founder can do this");
	});

	it("a Contributor sees the workspace", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const ben = await addContributor(setup, "Ben");

		const workspace = await ben.as.query(api.startups.startups.getBySlug, {
			slug: setup.slug,
		});

		expect(workspace?.role).toBe("contributor");
	});

	it("the Founder edits details and the slug stays put", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);

		await setup.founder.as.mutation(api.startups.startups.update, {
			startupId: setup.startupId,
			name: "Acme Labs",
			oneLiner: "Rockets for everyone",
			website: "https://acme.example.com",
			stage: "launched",
		});

		const page = await t.query(api.startups.startups.getPublic, {
			slug: setup.slug,
		});
		expect(page).toMatchObject({
			name: "Acme Labs",
			slug: "acme",
			oneLiner: "Rockets for everyone",
			website: "https://acme.example.com",
			stage: "launched",
		});
	});

	it("a website must be a link", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);

		await expect(
			setup.founder.as.mutation(api.startups.startups.update, {
				startupId: setup.startupId,
				website: "acme dot com",
			}),
		).rejects.toThrow("Website must start with http:// or https://");
	});

	it("a name is required", async () => {
		const t = createTest();
		const fay = await signUp(t, "Fay");

		await expect(
			fay.as.mutation(api.startups.startups.create, { ...acme, name: "  " }),
		).rejects.toThrow("Name is required");
	});

	it("signed-out people can't create a startup", async () => {
		const t = createTest();

		await expect(
			t.mutation(api.startups.startups.create, acme),
		).rejects.toThrow("Not authenticated");
	});

	it("a new Startup starts with an empty rhythm", async () => {
		const t = createTest();

		const { startupId } = await setUpStartup(t);

		const startup = await t.run(async (ctx) => await ctx.db.get(startupId));
		expect(startup?.rhythm).toEqual([]);
	});
});

describe("explore", () => {
	async function secondStartup(
		t: ReturnType<typeof createTest>,
		overrides: Partial<FunctionArgs<typeof api.startups.startups.create>> & {
			name: string;
		},
	) {
		const owner = await signUp(t, `${overrides.name} Owner`);
		return await owner.as.mutation(api.startups.startups.create, {
			...acme,
			...overrides,
		});
	}

	it("anyone can explore Startups signed out", async () => {
		const t = createTest();
		await setUpStartup(t);

		const rows = await t.query(api.startups.startups.explore, {});

		expect(rows).toMatchObject([
			{
				slug: "acme",
				name: "Acme",
				oneLiner: null,
				stage: "building",
				category: "saas",
				city: "bengaluru",
				rating: 1000,
				ratingChange: 0,
				isProvisional: true,
				logoUrl: null,
			},
		]);
	});

	it("Startups come highest Rating first", async () => {
		const t = createTest();
		const low = await secondStartup(t, { name: "Low" });
		const high = await secondStartup(t, { name: "High" });
		const middle = await secondStartup(t, { name: "Middle" });
		await t.run(async (ctx) => {
			await ctx.db.patch(low.startupId, { rating: 900 });
			await ctx.db.patch(high.startupId, { rating: 1300 });
			await ctx.db.patch(middle.startupId, { rating: 1100 });
		});

		const rows = await t.query(api.startups.startups.explore, {});

		expect(rows.map((row) => row.name)).toEqual(["High", "Middle", "Low"]);
	});

	it("each chip filters", async () => {
		const t = createTest();
		await secondStartup(t, { name: "Alpha" });
		await secondStartup(t, {
			name: "Beta",
			stage: "launched",
			category: "fintech",
			city: "pune",
		});

		const byStage = await t.query(api.startups.startups.explore, {
			stage: "launched",
		});
		const byCategory = await t.query(api.startups.startups.explore, {
			category: "saas",
		});
		const byCity = await t.query(api.startups.startups.explore, {
			city: "pune",
		});
		const byAll = await t.query(api.startups.startups.explore, {
			stage: "launched",
			city: "bengaluru",
		});

		expect(byStage.map((row) => row.name)).toEqual(["Beta"]);
		expect(byCategory.map((row) => row.name)).toEqual(["Alpha"]);
		expect(byCity.map((row) => row.name)).toEqual(["Beta"]);
		expect(byAll).toEqual([]);
	});

	it("a Startup with an open Hackathon is hiring", async () => {
		const setup = await setUpStartup(createTest());
		const before = await setup.t.query(api.startups.startups.explore, {});
		await publishedHackathon(setup);
		const after = await setup.t.query(api.startups.startups.explore, {});

		expect(before[0].isHiring).toBe(false);
		expect(after[0].isHiring).toBe(true);
	});

	it("a Startup never rated shows twelve empty weeks", async () => {
		const t = createTest();
		await setUpStartup(t);

		const [row] = await t.query(api.startups.startups.explore, {});

		expect(row.strip).toHaveLength(12);
		expect(row.strip.every((cell) => cell.count === null)).toBe(true);
		expect(new Set(row.strip.map((cell) => cell.week)).size).toBe(12);
	});

	it("a rated Startup shows its counts at the end of the strip", async () => {
		const setup = await setUpStartup(createTest());
		await verifyCards(setup, setup.founder, 2);
		await toNextWeek(setup.t);
		await runRating(setup.t);

		const [row] = await setup.t.query(api.startups.startups.explore, {});

		expect(row.strip).toHaveLength(12);
		expect(row.strip.map((cell) => cell.count)).toEqual([
			...Array(11).fill(null),
			2,
		]);
	});
});
