import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	MAX_ROLE_OFFERS,
	MAX_ROLE_HACKATHONS,
	MAX_HACKATHON_APPLICATIONS,
} from "../lib/limits";
import { hackathonHref } from "../lib/links";
import { notify } from "../people/notifications.rules";
import { cancelHackathon } from "./hackathons.rules";

export type OfferSummary = Pick<Doc<"offers">, "_id" | "status">;

/** A Hackathon's Offers keyed by the Application they were made on (at most one each). */
export async function loadHackathonOffers(
	ctx: QueryCtx,
	hackathonId: Id<"hackathons">,
): Promise<Map<Id<"applications">, OfferSummary>> {
	const offers = await ctx.db
		.query("offers")
		.withIndex("by_hackathon", (q) => q.eq("hackathonId", hackathonId))
		.take(MAX_HACKATHON_APPLICATIONS);
	return new Map(
		offers.map((offer) => [
			offer.applicationId,
			{ _id: offer._id, status: offer.status },
		]),
	);
}

export async function withdrawOffer(
	ctx: MutationCtx,
	offer: Doc<"offers">,
): Promise<void> {
	await ctx.db.patch(offer._id, { status: "withdrawn" });
	const startup = await ctx.db.get(offer.startupId);
	const hackathon = await ctx.db.get(offer.hackathonId);
	await notify(ctx, {
		userId: offer.userId,
		kind: "offer",
		title: `Your Offer from ${startup?.name ?? "a Startup"} was withdrawn`,
		href: hackathon ? await hackathonHref(ctx, hackathon) : undefined,
	});
}

/**
 * Once accepted Offers reach the Headcount the Role closes: its pending Offers
 * are withdrawn and its unstarted Hackathons cancelled. Active Hackathons
 * run to their Verdicts.
 */
export async function fillRoleIfFull(
	ctx: MutationCtx,
	roleId: Id<"roles">,
): Promise<void> {
	const role = await ctx.db.get(roleId);
	if (role?.status !== "open") {
		return;
	}

	const accepted = await ctx.db
		.query("offers")
		.withIndex("by_role_and_status", (q) =>
			q.eq("roleId", roleId).eq("status", "accepted"),
		)
		.take(MAX_ROLE_OFFERS);
	if (accepted.length < role.headcount) {
		return;
	}

	await ctx.db.patch(roleId, { status: "closed" });

	const pending = await ctx.db
		.query("offers")
		.withIndex("by_role_and_status", (q) =>
			q.eq("roleId", roleId).eq("status", "pending"),
		)
		.take(MAX_ROLE_OFFERS);
	for (const offer of pending) {
		await withdrawOffer(ctx, offer);
	}

	const hackathons = await ctx.db
		.query("hackathons")
		.withIndex("by_role", (q) => q.eq("roleId", roleId))
		.take(MAX_ROLE_HACKATHONS);
	for (const hackathon of hackathons) {
		if (hackathon.status === "open" || hackathon.status === "draft") {
			await cancelHackathon(ctx, hackathon, `${role.title} has been filled`);
		}
	}
}
