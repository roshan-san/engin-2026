import { expect, test } from "vitest";
import { api } from "../_generated/api";
import { createTest } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";
import { cyclePulseFor } from "../work/cycles.helpers";
import { joinAsMember, setUpStartup } from "./startups.helpers";

test("posting a Role, an accepted Invite, and a verified Pulse each write one Activity row", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const bob = await signUp(t, "Bob");
	const { inviteId } = await setup.founder.as.mutation(
		api.teams.invitations.create,
		{ startupId: setup.startupId, invitee: "@Bob", role: "member" },
	);
	await bob.as.mutation(api.teams.invitations.acceptById, { inviteId });

	const kinds = await t.run(async (ctx) =>
		(
			await ctx.db
				.query("activity")
				.withIndex("by_startup", (q) => q.eq("startupId", setup.startupId))
				.collect()
		).map((row) => row.kind),
	);

	expect(kinds).toEqual(
		expect.arrayContaining(["role_posted", "member_joined"]),
	);

	const { pulseId } = await cyclePulseFor(setup, bob);
	await bob.as.mutation(api.work.pulses.setStatus, {
		pulseId,
		status: "review",
	});
	await setup.founder.as.mutation(api.work.pulses.verify, { pulseId });

	const afterVerify = await t.run(async (ctx) =>
		(
			await ctx.db
				.query("activity")
				.withIndex("by_startup", (q) => q.eq("startupId", setup.startupId))
				.collect()
		).filter((row) => row.kind === "pulse_verified"),
	);
	expect(afterVerify).toHaveLength(1);
});

test("a Member does not see Pulse events from Cycles they are not in", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	const inCycle = await joinAsMember(setup, "Alice");
	const outsider = await joinAsMember(setup, "Bob");

	const { pulseId } = await cyclePulseFor(setup, inCycle);
	await inCycle.as.mutation(api.work.pulses.setStatus, {
		pulseId,
		status: "review",
	});
	await setup.founder.as.mutation(api.work.pulses.verify, { pulseId });

	const dashboard = await outsider.as.query(api.teams.activity.dashboard, {
		startupId: setup.startupId,
	});
	expect(
		dashboard.activity.some((item) => item.kind === "pulse_verified"),
	).toBe(false);

	const founderDashboard = await setup.founder.as.query(
		api.teams.activity.dashboard,
		{ startupId: setup.startupId },
	);
	expect(
		founderDashboard.activity.some((item) => item.kind === "pulse_verified"),
	).toBe(true);
});

test("the dashboard reports team size and open counts", async () => {
	const t = createTest();
	const setup = await setUpStartup(t);
	await joinAsMember(setup, "Alice");

	const dashboard = await setup.founder.as.query(api.teams.activity.dashboard, {
		startupId: setup.startupId,
	});

	expect(dashboard.stats.teamSize).toBe(2);
	expect(dashboard.stats.openRoles).toBe(1);
});
