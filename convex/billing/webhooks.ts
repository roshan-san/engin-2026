import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { internalMutation, type MutationCtx } from "../_generated/server";
import { IP_TERMS_MESSAGE } from "../hiring/ipTerms.rules";
import { publishDraft, publishProblem } from "../hiring/publish.rules";
import { hackathonHref } from "../lib/links";
import { notify } from "../people/notifications.rules";
import { getMembership } from "../teams/membership.rules";
import {
	grantCredit,
	grantProMonthCredits,
	HACKATHON_PAYMENT_KIND,
} from "./credits.rules";

export const subscriptionEvent = v.union(
	v.literal("active"),
	v.literal("renewed"),
	v.literal("on_hold"),
	v.literal("cancelled"),
	v.literal("failed"),
	v.literal("expired"),
);

/**
 * The checkout's `userId` metadata, else the customer email. With neither,
 * log and give up (eng review R6): someone fixes it by hand from the logs.
 */
async function resolveWebhookUser(
	ctx: MutationCtx,
	input: {
		event: string;
		reference: string;
		metadataUserId?: string;
		email?: string;
	},
): Promise<Id<"users"> | null> {
	const fromMetadata = input.metadataUserId
		? ctx.db.normalizeId("users", input.metadataUserId)
		: null;
	if (fromMetadata && (await ctx.db.get(fromMetadata))) {
		return fromMetadata;
	}
	if (input.email) {
		const user = await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", input.email))
			.first();
		if (user) {
			return user._id;
		}
	}
	console.error(
		`Dodo webhook ${input.event} (${input.reference}) matched no user; customer email: ${input.email ?? "none"}`,
	);
	return null;
}

export const applySubscriptionEvent = internalMutation({
	args: {
		event: subscriptionEvent,
		subscriptionId: v.string(),
		metadataUserId: v.optional(v.string()),
		email: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<void> => {
		const userId = await resolveWebhookUser(ctx, {
			event: `subscription.${args.event}`,
			reference: args.subscriptionId,
			metadataUserId: args.metadataUserId,
			email: args.email,
		});
		if (!userId) {
			return;
		}

		// Pro changes limits and the hackathon price, and each Pro month includes
		// credits that lapse at its end. Ending Pro keeps that month's credits.
		const isPro = args.event === "active" || args.event === "renewed";
		if (!isPro) {
			await ctx.db.patch(userId, { planTier: "free", proStartedAt: undefined });
			return;
		}
		const user = await ctx.db.get(userId);
		if (!user) {
			return;
		}
		const now = Date.now();
		// A renewal keeps the Pro run; going Pro from Free starts a new one.
		const proStartedAt =
			user.planTier === "pro" ? (user.proStartedAt ?? now) : now;
		await ctx.db.patch(userId, { planTier: "pro", proStartedAt });
		await grantProMonthCredits(
			ctx,
			{ ...user, planTier: "pro", proStartedAt },
			now,
		);
	},
});

/** Why a paid-for draft can't go live, or null (eng review R4). */
async function paidPublishProblem(
	ctx: MutationCtx,
	hackathon: Doc<"hackathons">,
	userId: Id<"users">,
	now: number,
): Promise<string | null> {
	const membership = await getMembership(ctx, hackathon.startupId, userId);
	if (membership?.role !== "founder") {
		return "You're no longer a founder of this startup.";
	}
	if (hackathon.ipAcknowledgedAt === undefined) {
		return IP_TERMS_MESSAGE;
	}
	return await publishProblem(ctx, hackathon, now);
}

/**
 * A one-time hackathon payment: grant a purchase credit keyed by payment,
 * then publish the draft named in the checkout if it still can. Otherwise
 * the credit waits in the balance (eng review R4).
 */
export const applyPaymentSucceeded = internalMutation({
	args: {
		paymentId: v.string(),
		kind: v.optional(v.string()),
		hackathonId: v.optional(v.string()),
		metadataUserId: v.optional(v.string()),
		email: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<void> => {
		// Subscription renewals are payments too; subscription events handle those.
		if (args.kind !== HACKATHON_PAYMENT_KIND) {
			return;
		}
		const userId = await resolveWebhookUser(ctx, {
			event: "payment.succeeded",
			reference: args.paymentId,
			metadataUserId: args.metadataUserId,
			email: args.email,
		});
		if (!userId) {
			return;
		}

		const creditId = await grantCredit(ctx, {
			ownerUserId: userId,
			source: "purchase",
			grantKey: `purchase:${args.paymentId}`,
		});
		if (!creditId) {
			return;
		}

		const hackathonId = args.hackathonId
			? ctx.db.normalizeId("hackathons", args.hackathonId)
			: null;
		const hackathon = hackathonId ? await ctx.db.get(hackathonId) : null;
		if (!hackathon) {
			return;
		}

		const now = Date.now();
		const problem = await paidPublishProblem(ctx, hackathon, userId, now);
		const href = await hackathonHref(ctx, hackathon);
		if (problem) {
			await notify(ctx, {
				userId,
				kind: "billing",
				title: `Payment received. ${hackathon.title} is still a draft`,
				body: `${problem} Your hackathon credit is in your balance.`,
				href,
			});
			return;
		}

		await publishDraft(ctx, hackathon, userId, now);
		await notify(ctx, {
			userId,
			kind: "billing",
			title: `Payment received. ${hackathon.title} is live`,
			href,
		});
	},
});
