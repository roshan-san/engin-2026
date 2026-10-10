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
		throw new Error("Enter a valid email");
	}

	const account = await ctx.db
		.query("users")
		.withIndex("email", (q) => q.eq("email", email))
		.first();
	if (account && (await getTeamRole(ctx, args.startupId, account._id))) {
		throw new Error("Already on this startup");
	}

	const now = Date.now();
	const pending = await ctx.db
		.query("invites")
		.withIndex("by_email_and_status", (q) =>
			q.eq("email", email).eq("status", "pending"),
		)
		.take(MAX_INVITES);
	if (
		pending.some(
			(invite) => invite.startupId === args.startupId && invite.expiresAt > now,
		)
	) {
		throw new Error("Already invited");
	}

	return await ctx.db.insert("invites", {
		startupId: args.startupId,
		email,
		invitedBy: args.invitedBy,
		status: "pending",
		expiresAt: now + INVITE_TTL_MS,
		hackathonId: args.hackathonId,
	});
}

/** The invite, when it is still open and addressed to this person's email. */
export async function requireOpenInviteFor(
	ctx: QueryCtx | MutationCtx,
	inviteId: Id<"invites">,
	userId: Id<"users">,
): Promise<Doc<"invites">> {
	const invite = await ctx.db.get(inviteId);
	if (!invite) {
		throw new Error("Invite not found");
	}
	const user = await ctx.db.get(userId);
	if (!user?.email || normalizeEmail(user.email) !== invite.email) {
		throw new Error("This invite isn't for you");
	}
	if (invite.status !== "pending") {
		throw new Error("This invite is no longer open");
	}
	if (invite.expiresAt <= Date.now()) {
		throw new Error("This invite has expired");
	}
	return invite;
}
