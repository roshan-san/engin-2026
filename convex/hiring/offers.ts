import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { mutation, query } from "../_generated/server";
import { requireUserId } from "../lib/auth";
import { MAX_USER_OFFERS } from "../lib/limits";
import { hackathonHref } from "../lib/links";
import { notifyFounders } from "../people/notifications.rules";
import { refreshUserScore } from "../people/score.rules";
import { loadPublicUser } from "../people/users.rules";
import { logActivity } from "../teams/activity.rules";
import {
	requireFounderMembership,
	requireMembership,
} from "../teams/membership.rules";
import { fillRoleIfFull, withdrawOffer } from "./offers.rules";

async function requirePendingOffer(
	ctx: MutationCtx,
	offerId: Id<"offers">,
): Promise<Doc<"offers">> {
	const offer = await ctx.db.get(offerId);
	if (!offer) {
		throw new Error("Offer not found");
	}
	if (offer.status !== "pending") {
		throw new Error("This Offer is no longer pending");
	}
	return offer;
}

async function requireOwnPendingOffer(
	ctx: MutationCtx,
	offerId: Id<"offers">,
): Promise<Doc<"offers">> {
	const userId = await requireUserId(ctx);
	const offer = await requirePendingOffer(ctx, offerId);
	if (offer.userId !== userId) {
		throw new Error("Offer not found");
	}
	return offer;
}

async function tellFounder(
	ctx: MutationCtx,
	offer: Doc<"offers">,
	outcome: "accepted" | "declined",
) {
	const person = await ctx.db.get(offer.userId);
	const hackathon = await ctx.db.get(offer.hackathonId);
	await notifyFounders(ctx, offer.startupId, {
		kind: "offer",
		title: `${person?.name ?? "Someone"} ${outcome} your Offer`,
		href: hackathon ? await hackathonHref(ctx, hackathon) : undefined,
	});
}

export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const offers = await ctx.db
			.query("offers")
			.withIndex("by_user_and_status", (q) => q.eq("userId", userId))
			.order("desc")
			.take(MAX_USER_OFFERS);

		const results = [];
		for (const offer of offers) {
			const startup = await ctx.db.get(offer.startupId);
			const role = await ctx.db.get(offer.roleId);
			const hackathon = await ctx.db.get(offer.hackathonId);
			results.push({
				_id: offer._id,
				status: offer.status,
				createdAt: offer._creationTime,
				href: hackathon ? await hackathonHref(ctx, hackathon) : null,
				startupName: startup?.name ?? "Startup",
				startupSlug: startup?.slug ?? "",
				roleTitle: role?.title ?? "Role",
			});
		}
		return results;
	},
});

export const listForStartup = query({
	args: { startupId: v.id("startups") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireMembership(ctx, args.startupId, userId);

		const offers = await ctx.db
			.query("offers")
			.withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
			.order("desc")
			.take(MAX_USER_OFFERS);

		const results = [];
		for (const offer of offers) {
			const role = await ctx.db.get(offer.roleId);
			results.push({
				_id: offer._id,
				status: offer.status,
				roleTitle: role?.title ?? "Role",
				user: await loadPublicUser(ctx, offer.userId),
			});
		}
		return results;
	},
});

export const accept = mutation({
	args: { offerId: v.id("offers") },
	handler: async (ctx, args) => {
		const offer = await requireOwnPendingOffer(ctx, args.offerId);
		await ctx.db.patch(offer._id, { status: "accepted" });

		const existing = await ctx.db
			.query("memberships")
			.withIndex("by_startup_and_user", (q) =>
				q.eq("startupId", offer.startupId).eq("userId", offer.userId),
			)
			.unique();
		if (!existing) {
			await ctx.db.insert("memberships", {
				startupId: offer.startupId,
				userId: offer.userId,
				role: "member",
			});
			const person = await ctx.db.get(offer.userId);
			await logActivity(ctx, {
				startupId: offer.startupId,
				kind: "member_joined",
				summary: `${person?.name ?? "Someone"} joined the team`,
			});
		}

		const acceptedBy = await ctx.db.get(offer.userId);
		await logActivity(ctx, {
			startupId: offer.startupId,
			kind: "offer_accepted",
			roleId: offer.roleId,
			summary: `${acceptedBy?.name ?? "Someone"} accepted their Offer`,
		});

		await refreshUserScore(ctx, offer.userId);
		await tellFounder(ctx, offer, "accepted");
		await fillRoleIfFull(ctx, offer.roleId);
	},
});

export const decline = mutation({
	args: { offerId: v.id("offers") },
	handler: async (ctx, args) => {
		const offer = await requireOwnPendingOffer(ctx, args.offerId);
		await ctx.db.patch(offer._id, { status: "declined" });
		await tellFounder(ctx, offer, "declined");
	},
});

export const withdraw = mutation({
	args: { offerId: v.id("offers") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const offer = await requirePendingOffer(ctx, args.offerId);
		await requireFounderMembership(ctx, offer.startupId, userId);

		await withdrawOffer(ctx, offer);
	},
});
