import { api } from "../_generated/api";
import type { TestConvex } from "../lib/testing.helpers";
import { signUp } from "../people/users.helpers";

export type Setup = Awaited<ReturnType<typeof setUpStartup>>;

/** A Startup "Acme" with a Founder and one open Role. */
export async function setUpStartup(t: TestConvex, headcount = 1) {
	const founder = await signUp(t, "Founder");
	const { startupId } = await founder.as.mutation(api.teams.startups.create, {
		name: "Acme",
	});
	const roleId = await founder.as.mutation(api.hiring.roles.create, {
		startupId,
		title: "Engineer",
		type: "full-time",
		skills: ["typescript"],
		description: "Build things",
		headcount,
	});
	return { t, founder, startupId, roleId };
}

/** Signs someone up and adds them to the setup's Startup as a Member. */
export async function joinAsMember(setup: Setup, name: string) {
	return await join(setup, name, "member");
}

/** Signs someone up and adds them to the setup's Startup as a co-Founder. */
export async function joinAsCoFounder(setup: Setup, name: string) {
	return await join(setup, name, "founder");
}

async function join(setup: Setup, name: string, role: "founder" | "member") {
	const person = await signUp(setup.t, name);
	await setup.t.run(async (ctx) => {
		await ctx.db.insert("memberships", {
			startupId: setup.startupId,
			userId: person.userId,
			role,
		});
	});
	return person;
}

/** Puts the setup's Startup in stealth. Stealth is Pro only through the API. */
export async function goStealth(setup: Setup) {
	await setup.t.run(async (ctx) => {
		await ctx.db.patch(setup.startupId, { isPublic: false });
	});
}
