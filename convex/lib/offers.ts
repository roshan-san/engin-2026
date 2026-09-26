import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { MAX_ROLE_OFFERS, MAX_ROLE_TRIALS } from "./limits";
import { notify } from "./notify";
import { cancelTrial } from "./trials";

export async function withdrawOffer(
	ctx: MutationCtx,
	offer: Doc<"offers">,
): Promise<void> {
	await ctx.db.patch(offer._id, { status: "withdrawn" });
	const startup = await ctx.db.get(offer.startupId);
	await notify(ctx, {
		userId: offer.userId,
		kind: "offer",
		title: `Your Offer from ${startup?.name ?? "a Startup"} was withdrawn`,
		href: "/app",
	});
}

/**
 * Once accepted Offers reach the Headcount the Role closes: its pending Offers
 * are withdrawn and its unstarted Trial Cycles cancelled. Active Trial Cycles
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

	const trials = await ctx.db
		.query("trialCycles")
		.withIndex("by_role", (q) => q.eq("roleId", roleId))
		.take(MAX_ROLE_TRIALS);
	for (const trial of trials) {
		if (trial.status === "open") {
			await cancelTrial(ctx, trial, `${role.title} has been filled`);
		}
	}
}
