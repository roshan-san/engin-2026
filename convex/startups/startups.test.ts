import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { createTest } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";
import { addContributor, setUpStartup } from "./startups.helpers";

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

		const mine = await founder.as.query(api.startups.startups.listMine, {});
		expect(mine).toMatchObject([{ name: "Acme", role: "founder" }]);
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

	it("a Contributor sees the workspace and the startup in their list", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const ben = await addContributor(setup, "Ben");

		const workspace = await ben.as.query(api.startups.startups.getBySlug, {
			slug: setup.slug,
		});
		const mine = await ben.as.query(api.startups.startups.listMine, {});

		expect(workspace?.role).toBe("contributor");
		expect(mine).toMatchObject([{ name: "Acme", role: "contributor" }]);
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
});
