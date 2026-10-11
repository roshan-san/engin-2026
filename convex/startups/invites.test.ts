import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import { decidedHackathon } from "../hiring/applications.helpers";
import { INVITE_TTL_MS } from "../lib/limits";
import { advancePast, createTest } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";
import { addContributor, setUpStartup } from "./startups.helpers";

describe("invites", () => {
	it("an invited person joins as a Contributor", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const sam = await signUp(t, "Sam");

		await setup.founder.as.mutation(api.startups.invites.create, {
			startupId: setup.startupId,
			email: "Sam@Example.com",
		});
		const invites = await sam.as.query(api.startups.invites.listMine, {});
		expect(invites).toMatchObject([
			{ startupName: "Acme", slug: setup.slug, fromHackathon: false },
		]);
		await sam.as.mutation(api.startups.invites.accept, {
			inviteId: invites[0].inviteId,
		});

		const mine = await sam.as.query(api.startups.startups.listMine, {});
		expect(mine).toMatchObject([{ name: "Acme", role: "contributor" }]);
		expect(await sam.as.query(api.startups.invites.listMine, {})).toEqual([]);
		const activity = await t.run(
			async (ctx) => await ctx.db.query("activity").take(10),
		);
		expect(activity).toMatchObject([
			{
				startupId: setup.startupId,
				kind: "contributor_joined",
				actorId: sam.userId,
			},
		]);
	});

	it("an invite only works for its email", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const inviteId = await setup.founder.as.mutation(
			api.startups.invites.create,
			{ startupId: setup.startupId, email: "sam@example.com" },
		);
		const lee = await signUp(t, "Lee");

		await expect(
			lee.as.mutation(api.startups.invites.accept, { inviteId }),
		).rejects.toThrow("This invite isn't for you");
	});

	it("an expired invite can't be accepted", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const sam = await signUp(t, "Sam");
		const inviteId = await setup.founder.as.mutation(
			api.startups.invites.create,
			{ startupId: setup.startupId, email: "sam@example.com" },
		);

		await advancePast(t, INVITE_TTL_MS + 1);

		await expect(
			sam.as.mutation(api.startups.invites.accept, { inviteId }),
		).rejects.toThrow("This invite has expired");
		expect(await sam.as.query(api.startups.invites.listMine, {})).toEqual([]);
	});

	it("only the Founder invites and removes", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const sam = await addContributor(setup, "Sam");

		await expect(
			sam.as.mutation(api.startups.invites.create, {
				startupId: setup.startupId,
				email: "lee@example.com",
			}),
		).rejects.toThrow("Only the Founder can do this");
		await expect(
			sam.as.mutation(api.startups.contributors.remove, {
				startupId: setup.startupId,
				userId: sam.userId,
			}),
		).rejects.toThrow("Only the Founder can do this");
	});

	it("a removed Contributor loses the workspace", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const sam = await addContributor(setup, "Sam");

		await setup.founder.as.mutation(api.startups.contributors.remove, {
			startupId: setup.startupId,
			userId: sam.userId,
		});

		expect(
			await sam.as.query(api.startups.startups.getBySlug, { slug: setup.slug }),
		).toBeNull();
	});

	it("the team is listed with the Founder first", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const sam = await addContributor(setup, "Sam");

		const team = await sam.as.query(api.startups.contributors.list, {
			startupId: setup.startupId,
		});

		expect(team.founder).toMatchObject({ _id: setup.founder.userId });
		expect(team.contributors).toMatchObject([{ _id: sam.userId }]);
		expect(JSON.stringify(team)).not.toContain("example.com");
	});

	it("the Founder lists pending Invites", async () => {
		const setup = await setUpStartup(createTest());
		const inviteId = await setup.founder.as.mutation(
			api.startups.invites.create,
			{ startupId: setup.startupId, email: "Sam@Example.com" },
		);

		const invites = await setup.founder.as.query(api.startups.invites.list, {
			startupId: setup.startupId,
		});

		expect(invites).toEqual([
			{
				inviteId,
				email: "sam@example.com",
				expiresAt: Date.now() + INVITE_TTL_MS,
				fromHackathon: false,
			},
		]);
	});

	it("revoked and expired Invites aren't listed", async () => {
		const setup = await setUpStartup(createTest());
		const revoked = await setup.founder.as.mutation(
			api.startups.invites.create,
			{ startupId: setup.startupId, email: "sam@example.com" },
		);
		await setup.founder.as.mutation(api.startups.invites.revoke, {
			inviteId: revoked,
		});
		await setup.founder.as.mutation(api.startups.invites.create, {
			startupId: setup.startupId,
			email: "lee@example.com",
		});

		await advancePast(setup.t, INVITE_TTL_MS + 1);

		expect(
			await setup.founder.as.query(api.startups.invites.list, {
				startupId: setup.startupId,
			}),
		).toEqual([]);
	});

	it("a Hired Invite says so", async () => {
		const setup = await setUpStartup(createTest());
		await decidedHackathon(setup, [{ name: "Ana", decision: "hired" }]);
		await setup.founder.as.mutation(api.startups.invites.create, {
			startupId: setup.startupId,
			email: "lee@example.com",
		});

		const invites = await setup.founder.as.query(api.startups.invites.list, {
			startupId: setup.startupId,
		});

		expect(invites).toHaveLength(2);
		expect(invites).toMatchObject([
			{ email: "ana@example.com", fromHackathon: true },
			{ email: "lee@example.com", fromHackathon: false },
		]);
	});

	it("a Contributor can't list Invites", async () => {
		const setup = await setUpStartup(createTest());
		const sam = await addContributor(setup, "Sam");

		await expect(
			sam.as.query(api.startups.invites.list, { startupId: setup.startupId }),
		).rejects.toThrow("Only the Founder can do this");
	});

	it("the Founder can't be removed", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);

		await expect(
			setup.founder.as.mutation(api.startups.contributors.remove, {
				startupId: setup.startupId,
				userId: setup.founder.userId,
			}),
		).rejects.toThrow("The Founder can't be removed");
	});

	it("inviting someone already on the team or already invited is refused", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		await addContributor(setup, "Sam");
		const invite = { startupId: setup.startupId, email: "lee@example.com" };

		await expect(
			setup.founder.as.mutation(api.startups.invites.create, {
				startupId: setup.startupId,
				email: "SAM@example.com",
			}),
		).rejects.toThrow("Already on this startup");
		await setup.founder.as.mutation(api.startups.invites.create, invite);
		await expect(
			setup.founder.as.mutation(api.startups.invites.create, {
				...invite,
				email: "Lee@Example.com",
			}),
		).rejects.toThrow("Already invited");
	});

	it("a declined or revoked invite can't be accepted", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const sam = await signUp(t, "Sam");
		const declined = await setup.founder.as.mutation(
			api.startups.invites.create,
			{ startupId: setup.startupId, email: "sam@example.com" },
		);
		await sam.as.mutation(api.startups.invites.decline, {
			inviteId: declined,
		});
		const lee = await signUp(t, "Lee");
		const revoked = await setup.founder.as.mutation(
			api.startups.invites.create,
			{ startupId: setup.startupId, email: "lee@example.com" },
		);
		await setup.founder.as.mutation(api.startups.invites.revoke, {
			inviteId: revoked,
		});

		await expect(
			sam.as.mutation(api.startups.invites.accept, { inviteId: declined }),
		).rejects.toThrow("This invite is no longer open");
		await expect(
			lee.as.mutation(api.startups.invites.accept, { inviteId: revoked }),
		).rejects.toThrow("This invite is no longer open");
	});

	it("someone already on the team can't accept an invite to it", async () => {
		const t = createTest();
		const setup = await setUpStartup(t);
		const inviteId = await setup.founder.as.mutation(
			api.startups.invites.create,
			{ startupId: setup.startupId, email: "sam@example.com" },
		);
		const sam = await addContributor(setup, "Sam");

		await expect(
			sam.as.mutation(api.startups.invites.accept, { inviteId }),
		).rejects.toThrow("Already on this startup");
	});
});
