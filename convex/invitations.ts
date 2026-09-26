import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { getMembership, requireFounderMembership } from "./lib/membership";
import { notify } from "./lib/notify";
import { WEEK_MS } from "./lib/time";

function generateToken(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function normaliseEmail(email: string): string {
	const value = email.trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
		throw new Error("Enter a valid email address");
	}
	return value;
}

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
		email: v.string(),
		role: v.union(v.literal("founder"), v.literal("member")),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounderMembership(ctx, args.startupId, userId);

		const email = normaliseEmail(args.email);

		const existing = await ctx.db
			.query("invites")
			.withIndex("by_startup_and_email", (q) =>
				q.eq("startupId", args.startupId).eq("email", email),
			)
			.first();

		if (existing?.status === "pending") {
			return { inviteId: existing._id, token: existing.token };
		}

		const token = generateToken();
		const inviteId = await ctx.db.insert("invites", {
			startupId: args.startupId,
			email,
			role: args.role,
			token,
			invitedByUserId: userId,
			status: "pending",
			expiresAt: Date.now() + WEEK_MS,
		});

		const invitee = await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", email))
			.unique();

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

		const now = Date.now();
		const results = [];

		for (const invite of invites) {
			if (invite.status !== "pending" || invite.expiresAt <= now) {
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

async function redeem(
	ctx: MutationCtx,
	invite: Doc<"invites">,
	userId: Id<"users">,
	userEmail: string,
) {
	if (invite.status !== "pending") {
		throw new Error("This invite is no longer valid");
	}
	if (invite.expiresAt <= Date.now()) {
		await ctx.db.patch(invite._id, { status: "expired" });
		throw new Error("This invite has expired");
	}
	if (invite.email !== userEmail.toLowerCase()) {
		throw new Error("This invite was sent to a different email address");
	}

	const existing = await getMembership(ctx, invite.startupId, userId);
	if (!existing) {
		await ctx.db.insert("memberships", {
			startupId: invite.startupId,
			userId,
			role: invite.role,
		});
	}

	await ctx.db.patch(invite._id, { status: "accepted" });
	await ctx.db.patch(userId, { activeStartupId: invite.startupId });

	return { startupId: invite.startupId };
}

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

		return await redeem(ctx, invite, userId, email);
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

		return await redeem(ctx, invite, userId, email);
	},
});
