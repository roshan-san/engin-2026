import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { INVITE_TTL_MS, MAX_INVITES } from "../lib/limits";
import { getTeamRole } from "./access.rules";

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

/**
 * Invites the email to the Startup. Shared by the Founder's Invite and a
 * Hackathon hire, so it checks the Startup itself and leaves the Founder
 * check to the caller.
 */
export async function createInvite(
	ctx: MutationCtx,
	args: {
		startupId: Id<"startups">;
		email: string;
		invitedBy: Id<"users">;
		hackathonId?: Id<"hackathons">;
	},
): Promise<Id<"invites">> {
	const email = normalizeEmail(args.email);
	if (!/^\S+@\S+\.\S+$/.test(email)) {
		throw new ConvexError("Enter a valid email");
	}

	const account = await ctx.db
		.query("users")
		.withIndex("email", (q) => q.eq("email", email))
		.first();
	if (account && (await getTeamRole(ctx, args.startupId, account._id))) {
		throw new ConvexError("Already on this startup");
	}

	if (await loadOpenInvite(ctx, args.startupId, email)) {
		throw new ConvexError("Already invited");
	}

	return await ctx.db.insert("invites", {
		startupId: args.startupId,
		email,
		invitedBy: args.invitedBy,
		status: "pending",
		expiresAt: Date.now() + INVITE_TTL_MS,
		hackathonId: args.hackathonId,
	});
}

/**
 * The Invite a Hackathon hire sends. Never throws for someone already on the
 * Startup (no Invite) or already invited (their open Invite now carries the Hackathon).
 */
export async function ensureHireInvite(
	ctx: MutationCtx,
	args: {
		startupId: Id<"startups">;
		userId: Id<"users">;
		email: string;
		invitedBy: Id<"users">;
		hackathonId: Id<"hackathons">;
	},
): Promise<void> {
	if (await getTeamRole(ctx, args.startupId, args.userId)) {
		return;
	}
	const open = await loadOpenInvite(
		ctx,
		args.startupId,
		normalizeEmail(args.email),
	);
	if (open) {
		await ctx.db.patch(open._id, { hackathonId: args.hackathonId });
		return;
	}
	await createInvite(ctx, {
		startupId: args.startupId,
		email: args.email,
		invitedBy: args.invitedBy,
		hackathonId: args.hackathonId,
	});
}

/** The pending, unexpired Invite for this email to the Startup, or null. */
async function loadOpenInvite(
	ctx: QueryCtx | MutationCtx,
	startupId: Id<"startups">,
	email: string,
): Promise<Doc<"invites"> | null> {
	const pending = await ctx.db
		.query("invites")
		.withIndex("by_email_and_status_and_expiresAt", (q) =>
			q.eq("email", email).eq("status", "pending").gt("expiresAt", Date.now()),
		)
		.take(MAX_INVITES);
	return pending.find((invite) => invite.startupId === startupId) ?? null;
}

/** The invite, when it is still open and addressed to this person's email. */
export async function requireOpenInviteFor(
	ctx: QueryCtx | MutationCtx,
	inviteId: Id<"invites">,
	userId: Id<"users">,
): Promise<Doc<"invites">> {
	const invite = await ctx.db.get(inviteId);
	if (!invite) {
		throw new ConvexError("Invite not found");
	}
	const user = await ctx.db.get(userId);
	if (!user?.email || normalizeEmail(user.email) !== invite.email) {
		throw new ConvexError("This invite isn't for you");
	}
	if (invite.status !== "pending") {
		throw new ConvexError("This invite is no longer open");
	}
	if (invite.expiresAt <= Date.now()) {
		throw new ConvexError("This invite has expired");
	}
	return invite;
}
