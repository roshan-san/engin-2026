import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import { appendActivity } from "./activity/model";
import { firstWeekFor } from "./cycles/rules";
import {
	createInvite,
	loadOpenInvitesTo,
	normalizeEmail,
	requireOpenInviteFor,
} from "./invites/model";
import { MAX_INVITES } from "./invites/rules";
import { requireUserId } from "./lib/auth";
import { discipline } from "./lib/disciplines";
import { getTeamRole, requireFounder } from "./startups/team";

/** The Founder's pending, unexpired Invites for the Startup. */
export const list = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounder(ctx, args.startupId, userId);

		const pending = await ctx.db
			.query("invites")
			.withIndex("by_startup_and_status_and_expiresAt", (q) =>
				q
					.eq("startupId", args.startupId)
					.eq("status", "pending")
					.gt("expiresAt", Date.now()),
			)
			.take(MAX_INVITES);

		return pending.map((invite) => ({
			inviteId: invite._id,
			email: invite.email,
			expiresAt: invite.expiresAt,
			fromHackathon: invite.hackathonId !== undefined,
		}));
	},
});

/** Open invites addressed to the signed-in person's email. */
export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const user = await ctx.db.get(userId);
		if (!user?.email) {
			return [];
		}

		const pending = await loadOpenInvitesTo(ctx, normalizeEmail(user.email));

		const open = await Promise.all(
			pending.map(async (invite) => {
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
	args: { startupId: v.id("startups"), email: v.string(), discipline },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireFounder(ctx, args.startupId, userId);
		return await createInvite(ctx, {
			startupId: args.startupId,
			email: args.email,
			invitedBy: userId,
			discipline: args.discipline,
		});
	},
});

export const revoke = mutation({
	args: { inviteId: v.id("invites") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const invite = await ctx.db.get(args.inviteId);
		if (!invite) {
			throw new ConvexError("Invite not found");
		}
		await requireFounder(ctx, invite.startupId, userId);
		if (invite.status !== "pending") {
			throw new ConvexError("This invite is no longer open");
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
			throw new ConvexError("Already on this startup");
		}

		await restartMeetingsIfSolo(ctx, invite.startupId);
		await ctx.db.insert("contributors", {
			startupId: invite.startupId,
			userId,
			discipline: invite.discipline,
			label: invite.label,
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

/**
 * A team growing back from one person starts its meetings afresh: the Board stays
 * open until the next closing meeting, as when meetings are first saved.
 */
async function restartMeetingsIfSolo(
	ctx: MutationCtx,
	startupId: Id<"startups">,
): Promise<void> {
	const startup = await ctx.db.get(startupId);
	if (!startup?.meetings) {
		return;
	}
	const contributor = await ctx.db
		.query("contributors")
		.withIndex("by_startup_and_user", (q) => q.eq("startupId", startupId))
		.first();
	if (contributor) {
		return;
	}
	await ctx.db.patch(startupId, {
		meetings: {
			...startup.meetings,
			firstWeek: firstWeekFor(Date.now(), undefined, startup.meetings),
		},
	});
}
