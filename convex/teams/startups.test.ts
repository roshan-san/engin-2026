import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "../_generated/api";
import {
	closeWithVerdict,
	createTest,
	createTrial,
	joinAsMember,
	setUpStartup,
	signUp,
	startedTrialWith,
} from "../test.helpers";

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

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

test("the Founder who creates Acme gets role founder and isFocused true", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const slug = (await t.run(async (ctx) => await ctx.db.get(setup.startupId)))
		?.slug as string;

	const result = await setup.founder.as.query(api.teams.startups.getBySlug, {
		slug,
	});

	expect(result?.role).toBe("founder");
	expect(result?.isFocused).toBe(true);
	expect(result?.startup.name).toBe("Acme");
});

test("a Member sees role member, then isFocused true after focusing", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(t, setup, "Bob");
	const slug = (await t.run(async (ctx) => await ctx.db.get(setup.startupId)))
		?.slug as string;

	const before = await bob.as.query(api.teams.startups.getBySlug, { slug });
	expect(before?.role).toBe("member");
	expect(before?.isFocused).toBe(false);

	await bob.as.mutation(api.teams.startups.focus, {
		startupId: setup.startupId,
	});

	const after = await bob.as.query(api.teams.startups.getBySlug, { slug });
	expect(after?.isFocused).toBe(true);
	const me = await bob.as.query(api.people.users.getMe, {});
	expect(me?.focusedStartupId).toBe(setup.startupId);
});

test("focusing the same Startup twice does not throw and leaves the field unchanged", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(t, setup, "Bob");

	await bob.as.mutation(api.teams.startups.focus, {
		startupId: setup.startupId,
	});
	await expect(
		bob.as.mutation(api.teams.startups.focus, {
			startupId: setup.startupId,
		}),
	).resolves.toBe(setup.startupId);

	const me = await bob.as.query(api.people.users.getMe, {});
	expect(me?.focusedStartupId).toBe(setup.startupId);
});

test("a Trial Cycle Participant who is not a Member gets role null and cannot focus", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	await startedTrialWith(t, setup, [alice]);
	const slug = (await t.run(async (ctx) => await ctx.db.get(setup.startupId)))
		?.slug as string;

	const result = await alice.as.query(api.teams.startups.getBySlug, { slug });
	expect(result?.role).toBeNull();
	expect(result?.isFocused).toBe(false);
	expect(result?.startup).toEqual({
		_id: setup.startupId,
		name: "Acme",
		slug,
	});

	await expect(
		alice.as.mutation(api.teams.startups.focus, {
			startupId: setup.startupId,
		}),
	).rejects.toThrow("You are not a member of this startup");
});

test("a non-Member gets null for a Stealth Startup, but a Member still sees it", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(t, setup, "Bob");
	const visitor = await signUp(t, "Visitor");
	await setup.founder.as.mutation(api.teams.startups.update, {
		startupId: setup.startupId,
		isPublic: false,
	});
	const slug = (await t.run(async (ctx) => await ctx.db.get(setup.startupId)))
		?.slug as string;

	expect(
		await visitor.as.query(api.teams.startups.getBySlug, { slug }),
	).toBeNull();
	expect(
		(await bob.as.query(api.teams.startups.getBySlug, { slug }))?.role,
	).toBe("member");
});

test("getBySlug returns null for an unknown slug and does no case folding", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);

	expect(
		await setup.founder.as.query(api.teams.startups.getBySlug, {
			slug: "nope",
		}),
	).toBeNull();
	expect(
		await setup.founder.as.query(api.teams.startups.getBySlug, {
			slug: "ACME",
		}),
	).toBeNull();
});

test("two Startups named Acme get distinct slugs and getBySlug matches exactly", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const second = await signUp(t, "Second");
	const { slug: secondSlug } = await second.as.mutation(
		api.teams.startups.create,
		{ name: "Acme" },
	);

	expect(secondSlug).toBe("acme-1");
	const result = await setup.founder.as.query(api.teams.startups.getBySlug, {
		slug: "acme",
	});
	expect(result?.startup._id).toBe(setup.startupId);
});

test("listMemberships lists every Startup in name order with roles and isFocused", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const betaFounder = await signUp(t, "BetaFounder");
	const { startupId: betaId } = await betaFounder.as.mutation(
		api.teams.startups.create,
		{ name: "Beta" },
	);
	await t.run(async (ctx) => {
		await ctx.db.insert("memberships", {
			startupId: betaId,
			userId: setup.founder.userId,
			role: "member",
		});
	});

	const memberships = await setup.founder.as.query(
		api.teams.startups.listMemberships,
		{},
	);
	expect(memberships.map((entry) => entry.startup.name)).toEqual([
		"Acme",
		"Beta",
	]);
	expect(memberships[0]?.role).toBe("founder");
	expect(memberships[0]?.isFocused).toBe(true);
	expect(memberships[1]?.role).toBe("member");
	expect(memberships[1]?.isFocused).toBe(false);
});

test("a User with no Startups gets an empty memberships list", async () => {
	const t = createTest();
	const solo = await signUp(t, "Solo");
	expect(
		await solo.as.query(api.teams.startups.listMemberships, {}),
	).toEqual([]);
});

test("getBySlug, listMemberships and focus throw when signed out", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);

	await expect(
		t.query(api.teams.startups.getBySlug, { slug: "acme" }),
	).rejects.toThrow("Not authenticated");
	await expect(
		t.query(api.teams.startups.listMemberships, {}),
	).rejects.toThrow("Not authenticated");
	await expect(
		t.mutation(api.teams.startups.focus, { startupId: setup.startupId }),
	).rejects.toThrow("Not authenticated");
});

test("getBySlug's Plan block reports Free limits and correct usage", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await createTrial(setup);
	await joinAsMember(t, setup, "Bob");
	await signUp(t, "Carol");
	await setup.founder.as.mutation(api.teams.invitations.create, {
		startupId: setup.startupId,
		invitee: "carol",
		role: "member",
	});
	const slug = (await t.run(async (ctx) => await ctx.db.get(setup.startupId)))
		?.slug as string;

	const result = await setup.founder.as.query(api.teams.startups.getBySlug, {
		slug,
	});

	expect(result?.plan).toEqual({
		tier: "free",
		limits: {
			capacity: 5,
			openRoles: 1,
			liveTrialCycles: 1,
			members: 5,
			stealth: false,
		},
		usage: {
			openRoles: 1,
			liveTrialCycles: 1,
			members: 2,
			stealth: false,
		},
	});
});

test("a pending Offer counts toward Plan usage.members", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const alice = await signUp(t, "Alice");
	const trialCycleId = await startedTrialWith(t, setup, [alice]);
	await closeWithVerdict(t, setup, trialCycleId, alice, "passed_with_offer");
	const slug = (await t.run(async (ctx) => await ctx.db.get(setup.startupId)))
		?.slug as string;

	const result = await setup.founder.as.query(api.teams.startups.getBySlug, {
		slug,
	});
	expect(result?.plan?.usage.members).toBe(1);
});

test("a pending founder Invite does not count toward Plan usage.members", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await signUp(t, "Dana");
	await setup.founder.as.mutation(api.teams.invitations.create, {
		startupId: setup.startupId,
		invitee: "dana",
		role: "founder",
	});
	const slug = (await t.run(async (ctx) => await ctx.db.get(setup.startupId)))
		?.slug as string;

	const result = await setup.founder.as.query(api.teams.startups.getBySlug, {
		slug,
	});
	expect(result?.plan?.usage.members).toBe(0);
});

test("a Pro Founder's Startup reports Pro limits", async () => {
	const t = createTest();
	const pat = await signUp(t, "Pat", "pro");
	const { startupId } = await pat.as.mutation(api.teams.startups.create, {
		name: "Rocket",
	});
	const slug = (await t.run(async (ctx) => await ctx.db.get(startupId)))
		?.slug as string;

	const result = await pat.as.query(api.teams.startups.getBySlug, { slug });
	expect(result?.plan?.tier).toBe("pro");
	expect(result?.plan?.limits).toEqual({
		capacity: 20,
		openRoles: null,
		liveTrialCycles: null,
		members: 50,
		stealth: true,
	});
});

test("Plan usage.stealth reflects a non-public Startup", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await joinAsMember(t, setup, "Bob");
	await setup.founder.as.mutation(api.teams.startups.update, {
		startupId: setup.startupId,
		isPublic: false,
	});
	const slug = (await t.run(async (ctx) => await ctx.db.get(setup.startupId)))
		?.slug as string;

	const result = await bob.as.query(api.teams.startups.getBySlug, { slug });
	expect(result?.plan?.usage.stealth).toBe(true);
});

test("a fresh Startup with nothing else reports zero Plan usage", async () => {
	const t = createTest();
	const founder = await signUp(t, "Lonely");
	const { startupId } = await founder.as.mutation(api.teams.startups.create, {
		name: "Empty",
	});
	const slug = (await t.run(async (ctx) => await ctx.db.get(startupId)))
		?.slug as string;

	const result = await founder.as.query(api.teams.startups.getBySlug, {
		slug,
	});
	expect(result?.plan?.usage).toEqual({
		openRoles: 0,
		liveTrialCycles: 0,
		members: 0,
		stealth: false,
	});
});

test("a non-Member of a public Startup gets plan null", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const visitor = await signUp(t, "Visitor");
	const slug = (await t.run(async (ctx) => await ctx.db.get(setup.startupId)))
		?.slug as string;

	const result = await visitor.as.query(api.teams.startups.getBySlug, {
		slug,
	});
	expect(result?.plan).toBeNull();
});
