import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { MAX_INVITES_PER_EMAIL } from "./lib/limits";
import { notify } from "./lib/notify";
import {
	generateToken,
	inviteExpiry,
	isInviteLive,
	redeemInvite,
	resolveInvitee,
} from "./lib/teams/invites";
import {
	getMembership,
	requireFounderMembership,
} from "./lib/teams/membership";
import { memberRole } from "./schema";

export const listInvites = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounderMembership(ctx, args.startupId, userId);

		return await ctx.db
			.query("invites")
			.withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
			.take(50);
	},
});

export const create = mutation({
	args: {
		startupId: v.id("startups"),
		/** A username (optionally "@"-prefixed) or an email address. */
		invitee: v.string(),
		role: memberRole,
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounderMembership(ctx, args.startupId, userId);

		const { email, user: invitee } = await resolveInvitee(ctx, args.invitee);
		if (invitee && (await getMembership(ctx, args.startupId, invitee._id))) {
			throw new Error("They are already on the team");
		}

		const pending = (
			await ctx.db
				.query("invites")
				.withIndex("by_startup_and_email", (q) =>
					q.eq("startupId", args.startupId).eq("email", email),
				)
				.take(MAX_INVITES_PER_EMAIL)
		).find((invite) => invite.status === "pending");

		if (pending) {
			await ctx.db.patch(pending._id, {
				role: args.role,
				expiresAt: inviteExpiry(),
			});
			return { inviteId: pending._id, token: pending.token };
		}

		const token = generateToken();
		const inviteId = await ctx.db.insert("invites", {
			startupId: args.startupId,
			email,
			role: args.role,
			token,
			invitedByUserId: userId,
			status: "pending",
			expiresAt: inviteExpiry(),
		});

		// People who haven't signed up see it in their invites once they do.
		if (invitee) {
			const startup = await ctx.db.get(args.startupId);
			await notify(ctx, {
				userId: invitee._id,
				kind: "invite",
				title: `You were invited to ${startup?.name ?? "a startup"}`,
				href: `/invite/${token}`,
			});
		}

		return { inviteId, token };
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

		await requireFounderMembership(ctx, invite.startupId, userId);
		await ctx.db.delete(args.inviteId);
	},
});

export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const user = await ctx.db.get(userId);
		if (!user?.email) {
			return [];
		}

		const invites = await ctx.db
			.query("invites")
			.withIndex("by_email", (q) => q.eq("email", user.email as string))
			.take(50);

		const results = [];

		for (const invite of invites) {
			if (!isInviteLive(invite)) {
				continue;
			}
			const startup = await ctx.db.get(invite.startupId);
			const inviter = await ctx.db.get(invite.invitedByUserId);
			results.push({
				_id: invite._id,
				token: invite.token,
				role: invite.role,
				expiresAt: invite.expiresAt,
				startupName: startup?.name ?? "Unknown startup",
				inviterName: inviter?.name ?? inviter?.email ?? "Someone",
			});
		}

		return results;
	},
});

export const getByToken = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		const invite = await ctx.db
			.query("invites")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.unique();

		if (!invite) {
			return null;
		}

		const startup = await ctx.db.get(invite.startupId);
		const isExpired =
			invite.status === "expired" || invite.expiresAt <= Date.now();

		return {
			role: invite.role,
			email: invite.email,
			status: invite.status,
			isExpired,
			startupName: startup?.name ?? "Unknown startup",
			startupSlug: startup?.slug ?? "",
		};
	},
});

async function requireInvitee(ctx: MutationCtx) {
	const userId = await requireUserId(ctx);
	const user = await ctx.db.get(userId);
	if (!user?.email) {
		throw new Error("Your account needs an email address to accept invites");
	}
	return { userId, email: user.email };
}

export const acceptByToken = mutation({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		const { userId, email } = await requireInvitee(ctx);

		const invite = await ctx.db
			.query("invites")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.unique();

		if (!invite) {
			throw new Error("Invite not found");
		}

		return await redeemInvite(ctx, invite, userId, email);
	},
});

export const acceptById = mutation({
	args: { inviteId: v.id("invites") },
	handler: async (ctx, args) => {
		const { userId, email } = await requireInvitee(ctx);

		const invite = await ctx.db.get(args.inviteId);
		if (!invite) {
			throw new Error("Invite not found");
		}

		return await redeemInvite(ctx, invite, userId, email);
	},
});

export const decline = mutation({
	args: { inviteId: v.id("invites") },
	handler: async (ctx, args) => {
		const { email } = await requireInvitee(ctx);
		const invite = await ctx.db.get(args.inviteId);
		if (!invite || invite.email !== email.toLowerCase()) {
			throw new Error("Invite not found");
		}
		if (invite.status !== "pending") {
			throw new Error("This invite is no longer valid");
		}
		await ctx.db.patch(invite._id, { status: "declined" });
	},
});
