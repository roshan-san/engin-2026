import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import {
	MAX_LISTED_CYCLES,
	MAX_LISTED_ROLES,
	MAX_TEAM_DESCRIPTION,
	MAX_TEAM_MEMBERS,
	MAX_TEAM_NAME,
} from "../lib/limits";
import { limitText, requireLimitedText } from "../lib/text";
import { notify } from "../people/notifications.rules";
import { logActivity } from "./activity.rules";
import {
	getMembership,
	requireFounderMembership,
	requireMembership,
} from "./membership.rules";
import {
	addToTeam,
	loadTeamsWithMembers,
	requireTeamCapacity,
	requireTeamFounder,
	requireUniqueTeamName,
} from "./teams.rules";

export const list = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireMembership(ctx, args.startupId, userId);

		return await loadTeamsWithMembers(ctx, args.startupId);
	},
});

export const create = mutation({
	args: {
		startupId: v.id("startups"),
		name: v.string(),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounderMembership(ctx, args.startupId, userId);

		const name = requireLimitedText(args.name, "Team name", MAX_TEAM_NAME);
		const description = limitText(
			args.description,
			"Team description",
			MAX_TEAM_DESCRIPTION,
		);
		await requireUniqueTeamName(ctx, args.startupId, name);
		await requireTeamCapacity(ctx, args.startupId);

		const teamId = await ctx.db.insert("teams", {
			startupId: args.startupId,
			name,
			description,
		});
		await logActivity(ctx, {
			startupId: args.startupId,
			kind: "team_created",
			summary: `Team "${name}" created`,
		});
		return teamId;
	},
});

export const update = mutation({
	args: {
		teamId: v.id("teams"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { team } = await requireTeamFounder(ctx, args.teamId, userId);

		const name =
			args.name === undefined
				? team.name
				: requireLimitedText(args.name, "Team name", MAX_TEAM_NAME);
		await requireUniqueTeamName(ctx, team.startupId, name, team._id);
		const description =
			args.description === undefined
				? team.description
				: limitText(args.description, "Team description", MAX_TEAM_DESCRIPTION);

		await ctx.db.patch(team._id, { name, description });
	},
});

/** Deletes a Team; its Roles and Cycles keep going without one. */
export const remove = mutation({
	args: { teamId: v.id("teams") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { team } = await requireTeamFounder(ctx, args.teamId, userId);

		const rows = await ctx.db
			.query("teamMembers")
			.withIndex("by_team", (q) => q.eq("teamId", team._id))
			.take(MAX_TEAM_MEMBERS);
		for (const row of rows) {
			await ctx.db.delete(row._id);
		}
		const roles = await ctx.db
			.query("roles")
			.withIndex("by_team", (q) => q.eq("teamId", team._id))
			.take(MAX_LISTED_ROLES);
		for (const role of roles) {
			await ctx.db.patch(role._id, { teamId: undefined });
		}
		const cycles = await ctx.db
			.query("cycles")
			.withIndex("by_team", (q) => q.eq("teamId", team._id))
			.take(MAX_LISTED_CYCLES);
		for (const cycle of cycles) {
			await ctx.db.patch(cycle._id, { teamId: undefined });
		}
		await ctx.db.delete(team._id);
	},
});

export const addMember = mutation({
	args: { teamId: v.id("teams"), userId: v.id("users") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { team } = await requireTeamFounder(ctx, args.teamId, userId);
		if (!(await getMembership(ctx, team.startupId, args.userId))) {
			throw new Error("Only members of this Startup can join its Teams");
		}

		if (await addToTeam(ctx, team, args.userId)) {
			const startup = await ctx.db.get(team.startupId);
			await notify(ctx, {
				userId: args.userId,
				kind: "team",
				title: `You were added to ${team.name} at ${startup?.name ?? "a startup"}`,
				href: startup ? `/s/${startup.slug}/team` : undefined,
			});
		}
	},
});

export const removeMember = mutation({
	args: { teamId: v.id("teams"), userId: v.id("users") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const { team } = await requireTeamFounder(ctx, args.teamId, userId);

		const row = await ctx.db
			.query("teamMembers")
			.withIndex("by_team_and_user", (q) =>
				q.eq("teamId", team._id).eq("userId", args.userId),
			)
			.unique();
		if (row) {
			await ctx.db.delete(row._id);
		}
	},
});
