import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { MAX_INVITES } from "../lib/limits";
import { appendActivity } from "../work/activity.rules";
import { getTeamRole, requireFounder } from "./access.rules";
import {
	createInvite,
	normalizeEmail,
	requireOpenInviteFor,
} from "./invites.rules";

/** Open invites addressed to the signed-in person's email. */
export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const user = await ctx.db.get(userId);
		if (!user?.email) {
			return [];
		}

		const now = Date.now();
		const pending = await ctx.db
			.query("invites")
			.withIndex("by_email_and_status", (q) =>
				q.eq("email", normalizeEmail(user.email ?? "")).eq("status", "pending"),
			)
			.take(MAX_INVITES);

		const open = await Promise.all(
			pending
				.filter((invite) => invite.expiresAt > now)
				.map(async (invite) => {
					const startup = await ctx.db.get(invite.startupId);
					return startup
						? {
								inviteId: invite._id,
								startupName: startup.name,
								slug: startup.slug,
								fromHackathon: invite.hackathonId !== undefined,
							}
						: null;
				}),
		);
		return open.filter((invite) => invite !== null);
	},
});

export const create = mutation({
	args: { startupId: v.id("startups"), email: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounder(ctx, args.startupId, userId);
		return await createInvite(ctx, {
			startupId: args.startupId,
			email: args.email,
			invitedBy: userId,
		});
	},
});

export const revoke = mutation({
	args: { inviteId: v.id("invites") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const invite = await ctx.db.get(args.inviteId);
		if (!invite) {
			throw new Error("Invite not found");
		}
		await requireFounder(ctx, invite.startupId, userId);
		if (invite.status !== "pending") {
			throw new Error("This invite is no longer open");
		}
		await ctx.db.patch(invite._id, { status: "revoked" });
	},
});

export const accept = mutation({
	args: { inviteId: v.id("invites") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const invite = await requireOpenInviteFor(ctx, args.inviteId, userId);
		if (await getTeamRole(ctx, invite.startupId, userId)) {
			throw new Error("Already on this startup");
		}

		await ctx.db.insert("contributors", {
			startupId: invite.startupId,
			userId,
		});
		await ctx.db.patch(invite._id, { status: "accepted" });
		await appendActivity(ctx, {
			startupId: invite.startupId,
			kind: "contributor_joined",
			at: Date.now(),
			actorId: userId,
		});
	},
});

export const decline = mutation({
	args: { inviteId: v.id("invites") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const invite = await requireOpenInviteFor(ctx, args.inviteId, userId);
		await ctx.db.patch(invite._id, { status: "declined" });
	},
});
