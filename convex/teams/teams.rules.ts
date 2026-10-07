import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	MAX_TEAM_MEMBERS,
	MAX_TEAMS_PER_STARTUP,
	MAX_USER_TEAMS,
} from "../lib/limits";
import { loadPublicUser } from "../people/users.rules";
import { requireFounderMembership } from "./membership.rules";

type TeamCtx = QueryCtx | MutationCtx;

/** The Team, and the caller's membership as a Founder of its Startup. */
export async function requireTeamFounder(
	ctx: TeamCtx,
	teamId: Id<"teams">,
	userId: Id<"users">,
): Promise<{ team: Doc<"teams">; membership: Doc<"memberships"> }> {
	const team = await ctx.db.get(teamId);
	if (!team) {
		throw new Error("Team not found");
	}
	const membership = await requireFounderMembership(
		ctx,
		team.startupId,
		userId,
	);
	return { team, membership };
}

/** A Team picked for a Role or Cycle must belong to that Startup. */
export async function requireTeamInStartup(
	ctx: TeamCtx,
	teamId: Id<"teams">,
	startupId: Id<"startups">,
): Promise<Doc<"teams">> {
	const team = await ctx.db.get(teamId);
	if (!team || team.startupId !== startupId) {
		throw new Error("Team not found");
	}
	return team;
}

async function loadStartupTeams(ctx: TeamCtx, startupId: Id<"startups">) {
	return await ctx.db
		.query("teams")
		.withIndex("by_startup", (q) => q.eq("startupId", startupId))
		.take(MAX_TEAMS_PER_STARTUP);
}

/** Names are unique per Startup, ignoring case; a Team may keep its own name. */
export async function requireUniqueTeamName(
	ctx: TeamCtx,
	startupId: Id<"startups">,
	name: string,
	exceptTeamId?: Id<"teams">,
): Promise<void> {
	const teams = await loadStartupTeams(ctx, startupId);
	const taken = teams.some(
		(team) =>
			team._id !== exceptTeamId &&
			team.name.toLowerCase() === name.toLowerCase(),
	);
	if (taken) {
		throw new Error("A Team with that name already exists");
	}
}

export async function requireTeamCapacity(
	ctx: TeamCtx,
	startupId: Id<"startups">,
): Promise<void> {
	const teams = await loadStartupTeams(ctx, startupId);
	if (teams.length >= MAX_TEAMS_PER_STARTUP) {
		throw new Error(
			`A Startup can have at most ${MAX_TEAMS_PER_STARTUP} Teams`,
		);
	}
}

/** The Startup's Teams by name, each with its members' public summaries. */
export async function loadTeamsWithMembers(
	ctx: TeamCtx,
	startupId: Id<"startups">,
) {
	const teams = await loadStartupTeams(ctx, startupId);
	const result = [];
	for (const team of teams) {
		const rows = await ctx.db
			.query("teamMembers")
			.withIndex("by_team", (q) => q.eq("teamId", team._id))
			.take(MAX_TEAM_MEMBERS);
		const members = [];
		for (const row of rows) {
			const user = await loadPublicUser(ctx, row.userId);
			if (user) {
				members.push(user);
			}
		}
		result.push({
			_id: team._id,
			name: team.name,
			description: team.description,
			members,
		});
	}
	return result.sort((a, b) => a.name.localeCompare(b.name));
}

/** Puts someone on a Team once; returns false when they were already on it. */
export async function addToTeam(
	ctx: MutationCtx,
	team: Doc<"teams">,
	userId: Id<"users">,
): Promise<boolean> {
	const existing = await ctx.db
		.query("teamMembers")
		.withIndex("by_team_and_user", (q) =>
			q.eq("teamId", team._id).eq("userId", userId),
		)
		.unique();
	if (existing) {
		return false;
	}
	await ctx.db.insert("teamMembers", {
		startupId: team.startupId,
		teamId: team._id,
		userId,
	});
	return true;
}

/** Someone leaving a Startup leaves every Team in it. */
export async function removeUserFromStartupTeams(
	ctx: MutationCtx,
	startupId: Id<"startups">,
	userId: Id<"users">,
): Promise<void> {
	const rows = await ctx.db
		.query("teamMembers")
		.withIndex("by_startup_and_user", (q) =>
			q.eq("startupId", startupId).eq("userId", userId),
		)
		.take(MAX_USER_TEAMS);
	for (const row of rows) {
		await ctx.db.delete(row._id);
	}
}
