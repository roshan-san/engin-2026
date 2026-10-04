import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { MAX_LISTED_ROLES, ROLE_TEXT_LIMITS } from "../lib/limits";
import { buildSearchText, limitText, requireLimitedText } from "../lib/text";
import { logActivity } from "../teams/activity.rules";
import {
	requireFounderMembership,
	requireMembership,
} from "../teams/membership.rules";
import { parseSkills, requireNoLiveHackathons } from "./roles.rules";

export const list = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireMembership(ctx, args.startupId, userId);

		return await ctx.db
			.query("roles")
			.withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
			.order("desc")
			.take(MAX_LISTED_ROLES);
	},
});

export const listOpenByStartup = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("roles")
			.withIndex("by_startup_and_status", (q) =>
				q.eq("startupId", args.startupId).eq("status", "open"),
			)
			.take(30);
	},
});

export const create = mutation({
	args: {
		startupId: v.id("startups"),
		title: v.string(),
		type: v.string(),
		skills: v.array(v.string()),
		description: v.string(),
		location: v.optional(v.string()),
		remote: v.optional(v.boolean()),
		headcount: v.number(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounderMembership(ctx, args.startupId, userId);

		if (!Number.isInteger(args.headcount) || args.headcount < 1) {
			throw new Error("Headcount must be a whole number of at least 1");
		}

		const title = requireLimitedText(
			args.title,
			"Role title",
			ROLE_TEXT_LIMITS.title,
		);
		const type = requireLimitedText(
			args.type,
			"Role type",
			ROLE_TEXT_LIMITS.title,
		);
		const description = requireLimitedText(
			args.description,
			"Role description",
			ROLE_TEXT_LIMITS.description,
		);
		const skills = parseSkills(args.skills);

		const roleId = await ctx.db.insert("roles", {
			startupId: args.startupId,
			title,
			type,
			skills,
			description,
			location: limitText(args.location, "Location", ROLE_TEXT_LIMITS.title),
			remote: args.remote,
			headcount: args.headcount,
			status: "open",
			searchText: buildSearchText(title, type, description, ...skills),
		});

		await logActivity(ctx, {
			startupId: args.startupId,
			kind: "role_posted",
			roleId,
			summary: `Role "${title}" posted`,
		});

		return roleId;
	},
});

/** Roles only close; a filled Role must not be reopened (ADR 0001). */
export const close = mutation({
	args: { roleId: v.id("roles") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const role = await ctx.db.get(args.roleId);
		if (!role) {
			throw new Error("Role not found");
		}

		await requireFounderMembership(ctx, role.startupId, userId);
		await requireNoLiveHackathons(ctx, role._id);
		await ctx.db.patch(args.roleId, { status: "closed" });
	},
});
