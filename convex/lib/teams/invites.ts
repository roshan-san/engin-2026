import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { logActivity } from "../activity";
import { INVITE_TTL_MS } from "../limits";
import { getMembership } from "./membership";

export function generateToken(): string {
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

export function inviteExpiry(): number {
	return Date.now() + INVITE_TTL_MS;
}

/**
 * An invitee is typed as either an email or a username (with or without "@").
 * Usernames must exist; emails may belong to someone who hasn't signed up yet.
 */
export async function resolveInvitee(
	ctx: MutationCtx,
	invitee: string,
): Promise<{ email: string; user: Doc<"users"> | null }> {
	const value = invitee.trim();
	if (/^[^@\s]+@[^@\s]+$/.test(value)) {
		const email = normaliseEmail(value);
		const user = await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", email))
			.unique();
		return { email, user };
	}

	const username = value.replace(/^@/, "").toLowerCase();
	const user = await ctx.db
		.query("users")
		.withIndex("by_username", (q) => q.eq("username", username))
		.unique();
	if (!user) {
		throw new Error(`No one on Engin has the username ${username}`);
	}
	if (!user.email) {
		throw new Error(`${username} has no email address to invite`);
	}
	return { email: user.email.toLowerCase(), user };
}

export function isInviteLive(invite: Doc<"invites">): boolean {
	return invite.status === "pending" && invite.expiresAt > Date.now();
}

export async function redeemInvite(
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
		const user = await ctx.db.get(userId);
		await logActivity(ctx, {
			startupId: invite.startupId,
			kind: "member_joined",
			actorUserId: userId,
			summary: `${user?.name ?? "Someone"} joined the team`,
		});
	}

	await ctx.db.patch(invite._id, { status: "accepted" });
	await ctx.db.patch(userId, { activeStartupId: invite.startupId });

	return { startupId: invite.startupId };
}
