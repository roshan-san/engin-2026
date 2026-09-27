import { expect, test } from "vitest";
import { api } from "../_generated/api";
import {
	createTest,
	joinAsMember,
	setUpStartup,
	signUp,
} from "../test.helpers";

test("only a Founder can edit the Pitch", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const member = await joinAsMember(t, setup, "Bob");

	await expect(
		member.as.mutation(api.teams.startups.update, {
			startupId: setup.startupId,
			problem: "Nobody can find great engineers",
		}),
	).rejects.toThrow();

	await setup.founder.as.mutation(api.teams.startups.update, {
		startupId: setup.startupId,
		problem: "Nobody can find great engineers",
		isPublic: true,
	});

	const pitch = await t.query(api.teams.startups.getPublic, {
		slug: (await t.run(async (ctx) => await ctx.db.get(setup.startupId)))
			?.slug as string,
	});
	expect(pitch?.problem).toBe("Nobody can find great engineers");
});

test("a non-public Startup's Pitch is not returned to anyone", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await setup.founder.as.mutation(api.teams.startups.update, {
		startupId: setup.startupId,
		isPublic: false,
	});
	const slug = (await t.run(async (ctx) => await ctx.db.get(setup.startupId)))
		?.slug as string;

	expect(await t.query(api.teams.startups.getPublic, { slug })).toBeNull();
	expect(
		await setup.founder.as.query(api.teams.startups.getPublic, { slug }),
	).toBeNull();
});

test("signed-out visitors get Pitch content but no team member profiles", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await joinAsMember(t, setup, "Bob");
	await setup.founder.as.mutation(api.teams.startups.update, {
		startupId: setup.startupId,
		isPublic: true,
	});
	const slug = (await t.run(async (ctx) => await ctx.db.get(setup.startupId)))
		?.slug as string;

	const asVisitor = await t.query(api.teams.startups.getPublic, { slug });
	expect(asVisitor?.isAuthenticated).toBe(false);
	expect(asVisitor?.team).toEqual([]);
	expect(asVisitor?.isMember).toBe(false);

	const visitor = await signUp(t, "Visitor");
	const asSignedIn = await visitor.as.query(api.teams.startups.getPublic, {
		slug,
	});
	expect(asSignedIn?.isAuthenticated).toBe(true);
	expect(asSignedIn?.team).toHaveLength(2);
});
